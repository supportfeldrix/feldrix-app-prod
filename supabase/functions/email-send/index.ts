/// <reference lib="deno.ns" />

// ============================================================================
// Feldrix — email-send
// Supabase Edge Function
//
// Sends outgoing emails via SMTP using nodemailer.
// Used by the Customer Success Centre to reply to emails from Feldrix.
//
// Supports proper email threading (Message-ID, In-Reply-To, References).
//
// IMPORTANT: Deno Deploy does NOT support outgoing connections on ports 25/587.
// Use port 465 (SSL) or 2587 (AWS SES) or another non-standard SMTP port.
//
// Secrets required (configured in Supabase Dashboard → Edge Functions → Secrets):
//   EMAIL_USERNAME   — SMTP auth username (e.g. support@feldrix.com)
//   EMAIL_PASSWORD   — SMTP auth password or app password
//   SMTP_HOST        — SMTP server hostname
//   SMTP_PORT        — SMTP port (must NOT be 25 or 587; use 465 or 2587)
//   SMTP_SECURE      — "true" for SSL (port 465), "false" for STARTTLS
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

declare const Deno: {
  serve(handler: (req: Request) => Promise<Response> | Response): void;
  env: { get(key: string): string | undefined };
};

// ─── Configuration ──────────────────────────────────────────

function getSmtpConfig() {
  const user = Deno.env.get("EMAIL_USERNAME");
  const password = Deno.env.get("EMAIL_PASSWORD");
  const host = Deno.env.get("SMTP_HOST");
  const port = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
  const secure = Deno.env.get("SMTP_SECURE") !== "false"; // default true for port 465

  if (!user || !password || !host) {
    throw new Error("Missing SMTP configuration. Set EMAIL_USERNAME, EMAIL_PASSWORD, and SMTP_HOST in Supabase Secrets.");
  }

  return { user, password, host, port, secure };
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

// ─── Generate Message-ID ────────────────────────────────────

function generateMessageId(): string {
  const random = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  return `<${random}@feldrix.com>`;
}

// ─── Main Handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();

  try {
    const body = await req.json();
    const { to, subject, text, in_reply_to, references, sent_email_id } = body;

    // Validation
    if (!to || !subject || !text) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields: to, subject, text." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get SMTP configuration
    const smtpConfig = getSmtpConfig();
    const messageId = generateMessageId();

    // Create nodemailer transport
    const transport = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
    });

    // Build mail options with threading headers
    const mailOptions: any = {
      from: `"Feldrix Support" <${smtpConfig.user}>`,
      to,
      subject,
      text,
      messageId,
    };

    if (in_reply_to) {
      mailOptions.inReplyTo = in_reply_to;
    }
    if (references) {
      mailOptions.references = references;
    }

    // Send the email
    const info = await transport.sendMail(mailOptions);

    // Update sent_emails record if ID provided
    if (sent_email_id) {
      await supabase
        .from("sent_emails")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          message_id: messageId,
          smtp_response: info?.response?.substring(0, 500) || "OK",
        })
        .eq("id", sent_email_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully.",
        message_id: messageId,
        smtp_message_id: info?.messageId || null,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown SMTP error.";

    // Update sent_emails record with failure
    try {
      const reqBody = await req.clone().json().catch(() => ({}));
      if (reqBody?.sent_email_id) {
        await supabase
          .from("sent_emails")
          .update({
            status: "failed",
            smtp_response: errorMessage.substring(0, 500),
          })
          .eq("id", reqBody.sent_email_id);
      }
    } catch { /* ignore */ }

    // User-friendly error messages
    let userMessage = "Unable to send email. Please try again.";
    if (errorMessage.includes("auth") || errorMessage.includes("credentials") || errorMessage.includes("535") || errorMessage.includes("Invalid login")) {
      userMessage = "SMTP authentication failed. Verify email credentials in Supabase Secrets.";
    } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT") || errorMessage.includes("ECONNREFUSED")) {
      userMessage = "Connection failed. The mail server may be unavailable or the port is blocked.";
    } else if (errorMessage.includes("certificate") || errorMessage.includes("SSL") || errorMessage.includes("TLS") || errorMessage.includes("self signed")) {
      userMessage = "SSL/TLS error. Verify SMTP_SECURE and SMTP_PORT settings.";
    } else if (errorMessage.includes("Missing SMTP configuration")) {
      userMessage = errorMessage;
    }

    return new Response(
      JSON.stringify({ success: false, message: userMessage, error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
