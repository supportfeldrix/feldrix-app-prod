/// <reference lib="deno.ns" />

// ============================================================================
// Feldrix — email-sync
// Supabase Edge Function
//
// Connects to the support mailbox via IMAP, fetches the latest emails,
// and stores them in the imported_emails table. Uses Message-ID for
// deduplication.
//
// READ ONLY — never deletes, moves, or marks emails as read on the server.
//
// Secrets required (configured in Supabase Dashboard):
//   EMAIL_USERNAME, EMAIL_PASSWORD, IMAP_HOST, IMAP_PORT, IMAP_SECURE
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { ImapClient } from "npm:imapflow@1";

declare const Deno: {
  serve(handler: (req: Request) => Promise<Response> | Response): void;
  env: { get(key: string): string | undefined };
};

// ─── Configuration ──────────────────────────────────────────

function getConfig() {
  const username = Deno.env.get("EMAIL_USERNAME");
  const password = Deno.env.get("EMAIL_PASSWORD");
  const host = Deno.env.get("IMAP_HOST");
  const port = parseInt(Deno.env.get("IMAP_PORT") || "993", 10);
  const secure = Deno.env.get("IMAP_SECURE") !== "false";

  if (!username || !password || !host) {
    throw new Error("Missing email configuration. Ensure EMAIL_USERNAME, EMAIL_PASSWORD, and IMAP_HOST are set in Supabase Secrets.");
  }

  return { username, password, host, port, secure };
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

// ─── IMAP Email Fetching ────────────────────────────────────

interface ParsedEmail {
  message_id: string | null;
  subject: string;
  sender_name: string;
  sender_email: string;
  recipient: string;
  cc: string;
  received_at: string;
  preview: string;
  body_text: string;
  body_html: string;
  has_attachments: boolean;
  attachment_count: number;
  message_size: number;
}

async function fetchEmails(config: ReturnType<typeof getConfig>, limit = 50): Promise<ParsedEmail[]> {
  const client = new ImapClient({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false,
  });

  await client.connect();

  const lock = await client.getMailboxLock("INBOX");
  const emails: ParsedEmail[] = [];

  try {
    // Fetch the latest N messages by sequence number (newest last)
    const mailbox = client.mailbox;
    const total = mailbox?.exists || 0;

    if (total === 0) {
      return [];
    }

    const start = Math.max(1, total - limit + 1);
    const range = `${start}:*`;

    for await (const message of client.fetch(range, {
      envelope: true,
      bodyStructure: true,
      source: { maxBytes: 256 * 1024 }, // Limit to 256KB per message
    })) {
      try {
        const envelope = message.envelope;
        const from = envelope?.from?.[0];
        const to = envelope?.to?.[0];
        const cc = (envelope?.cc || []).map((c: any) => c.address).join(", ");

        const senderEmail = from?.address || "";
        const senderName = from?.name || senderEmail.split("@")[0] || "";
        const recipient = to?.address || "support@feldrix.com";
        const subject = envelope?.subject || "(No Subject)";
        const messageId = envelope?.messageId || null;
        const date = envelope?.date ? new Date(envelope.date).toISOString() : new Date().toISOString();

        // Get body text
        let bodyText = "";
        let bodyHtml = "";
        try {
          const downloaded = await client.download(message.seq.toString(), undefined, { maxBytes: 128 * 1024 });
          if (downloaded?.content) {
            const chunks: Uint8Array[] = [];
            const reader = downloaded.content.getReader();
            let done = false;
            while (!done) {
              const result = await reader.read();
              if (result.value) chunks.push(result.value);
              done = result.done;
            }
            const decoder = new TextDecoder();
            const raw = decoder.decode(new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0)));
            // Simple extraction — full MIME parsing would be more complex
            bodyText = raw.substring(0, 5000);
          }
        } catch {
          // Body download failed — continue with empty body
        }

        // Check attachments from body structure
        const hasAttachments = message.bodyStructure?.childNodes?.some(
          (node: any) => node.disposition === "attachment"
        ) || false;
        const attachmentCount = message.bodyStructure?.childNodes?.filter(
          (node: any) => node.disposition === "attachment"
        )?.length || 0;

        const preview = (bodyText || subject).substring(0, 200).replace(/\s+/g, " ").trim();

        emails.push({
          message_id: messageId,
          subject,
          sender_name: senderName,
          sender_email: senderEmail,
          recipient,
          cc,
          received_at: date,
          preview,
          body_text: bodyText,
          body_html: bodyHtml,
          has_attachments: hasAttachments,
          attachment_count: attachmentCount,
          message_size: message.size || 0,
        });
      } catch {
        // Skip malformed messages
        continue;
      }
    }
  } finally {
    lock.release();
  }

  await client.logout();

  return emails;
}

// ─── Database Storage ───────────────────────────────────────

async function storeEmails(supabase: any, emails: ParsedEmail[]) {
  let imported = 0;
  let skipped = 0;

  for (const email of emails) {
    // Upsert using message_id for deduplication
    const { error } = await supabase
      .from("imported_emails")
      .upsert(
        {
          message_id: email.message_id,
          subject: email.subject,
          sender_name: email.sender_name,
          sender_email: email.sender_email,
          recipient: email.recipient,
          cc: email.cc || null,
          received_at: email.received_at,
          preview: email.preview,
          body_text: email.body_text,
          body_html: email.body_html || null,
          has_attachments: email.has_attachments,
          attachment_count: email.attachment_count,
          message_size: email.message_size,
          folder: "inbox",
          sync_status: "imported",
          imported_at: new Date().toISOString(),
        },
        { onConflict: "message_id", ignoreDuplicates: true }
      );

    if (error) {
      // Likely a duplicate without message_id — skip
      skipped++;
    } else {
      imported++;
    }
  }

  return { imported, skipped };
}

// ─── Main Handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();
  let logId: string | null = null;

  try {
    // Create sync log entry
    const { data: logEntry } = await supabase
      .from("email_sync_log")
      .insert([{ status: "running" }])
      .select("id")
      .single();

    logId = logEntry?.id || null;

    // Get IMAP configuration from secrets
    const config = getConfig();

    // Fetch emails from IMAP
    const emails = await fetchEmails(config, 50);

    // Store in database
    const { imported, skipped } = await storeEmails(supabase, emails);

    // Update sync log
    if (logId) {
      await supabase
        .from("email_sync_log")
        .update({
          completed_at: new Date().toISOString(),
          emails_imported: imported,
          duplicates_skipped: skipped,
          status: "completed",
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed. ${imported} emails imported, ${skipped} duplicates skipped.`,
        imported,
        skipped,
        total_fetched: emails.length,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error during email sync.";

    // Update sync log with error
    if (logId) {
      await supabase
        .from("email_sync_log")
        .update({
          completed_at: new Date().toISOString(),
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", logId);
    }

    // Determine user-friendly error
    let userMessage = "Unable to connect to the support mailbox.";
    if (errorMessage.includes("auth") || errorMessage.includes("credentials") || errorMessage.includes("LOGIN")) {
      userMessage = "Authentication failed. Please verify email credentials in Supabase Secrets.";
    } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      userMessage = "Connection timed out. The mail server may be temporarily unavailable.";
    } else if (errorMessage.includes("certificate") || errorMessage.includes("SSL") || errorMessage.includes("TLS")) {
      userMessage = "SSL/TLS connection error. Please verify IMAP_SECURE and IMAP_PORT settings.";
    } else if (errorMessage.includes("Missing email configuration")) {
      userMessage = errorMessage;
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: userMessage,
        error: errorMessage,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
