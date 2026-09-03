/**
 * Feldrix v1.2 — Weather Push Notification Service Worker
 *
 * Handles:
 *   1. push event     — Receives push payload from server, displays notification
 *   2. notificationclick — Opens/focuses Weather page, deep-links to alerts
 *   3. notificationclose — Records dismissal for analytics
 *
 * This service worker runs in the background even when Feldrix is closed.
 * Notifications are received from the Supabase Edge Function (weather-push)
 * via the Web Push protocol.
 *
 * Device support:
 *   - Desktop browsers (Chrome, Edge, Firefox, Safari 16+)
 *   - Android Browser & PWA
 *   - iPhone PWA (iOS 16.4+)
 *   - Smart watches receive via paired phone's notification system
 *
 * NO third-party services. Uses Web Push API only.
 *
 * Built via VitePWA `injectManifest`: this is the SINGLE service worker for
 * the farmer app. It provides BOTH the PWA precache (below) AND weather push
 * handling, so there is no competing second service worker at scope "/".
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PWA PRECACHE — Workbox manifest injected at build time by VitePWA.
// Guarded so the file still works if opened without an injected manifest.
// ═══════════════════════════════════════════════════════════════════════════════

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// self.__WB_MANIFEST is replaced at build time with the precache manifest.
precacheAndRoute(self.__WB_MANIFEST || []);

// Runtime caching (parity with the previous generateSW config).
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "gstatic-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);
registerRoute(
  ({ url }) => /\.supabase\.co$/.test(url.hostname),
  new NetworkFirst({
    cacheName: "supabase-api-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 5 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH EVENT — Receive and display notification
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // If not JSON, treat as plain text
    payload = {
      title: "Feldrix Weather Alert",
      body: event.data.text(),
    };
  }

  const title = payload.title || "Feldrix Weather Alert";
  const options = {
    body: payload.body || "Tap to view weather details.",
    icon: payload.icon || "/Branding/app-icon-1024.png",
    badge: payload.badge || "/Branding/app-icon-1024.png",
    tag: payload.tag || "feldrix-weather-alert",
    renotify: payload.renotify !== false,
    requireInteraction: payload.requireInteraction || false,
    vibrate: payload.vibrate || [200, 100, 200],
    timestamp: payload.timestamp || Date.now(),
    data: {
      url: payload.data?.url || "/weather#alerts",
      alertType: payload.data?.alertType || "weather",
      farmName: payload.data?.farmName || "",
      timestamp: payload.data?.timestamp || Date.now(),
    },
    actions: payload.actions || [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CLICK — Open/focus Weather page with deep-link
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle "dismiss" action — just record and close
  if (action === "dismiss") {
    // Send message to any open client to record dismissal
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({
            type: "NOTIFICATION_DISMISS",
            alertType: data.alertType,
            timestamp: data.timestamp,
          });
        }
      })
    );
    return;
  }

  // Handle "view" action or default click — open Weather page
  const targetUrl = data.url || "/weather#alerts";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if Feldrix is already open in a window/tab
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Focus the existing window
          client.focus();
          // Tell the app to navigate and scroll
          client.postMessage({
            type: "NOTIFICATION_CLICK",
            url: targetUrl,
            alertType: data.alertType,
            farmName: data.farmName,
            timestamp: data.timestamp,
          });
          return;
        }
      }

      // No existing window — open a new one
      return self.clients.openWindow(self.location.origin + targetUrl);
    })
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CLOSE — Record dismissal (user swiped away)
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener("notificationclose", (event) => {
  const data = event.notification.data || {};

  // Notify any open client about the dismissal
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({
          type: "NOTIFICATION_DISMISS",
          alertType: data.alertType,
          timestamp: data.timestamp,
        });
      }
    })
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALL & ACTIVATE — Standard lifecycle events
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener("install", (event) => {
  // Activate immediately (don't wait for existing tabs to close)
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of all open tabs immediately
  event.waitUntil(self.clients.claim());
});
