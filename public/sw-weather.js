/**
 * Feldrix — Weather Push Notification Service Worker
 * Version 1.1 — Farm Weather Intelligence Platform
 *
 * Handles notification click events for weather alerts.
 * Works alongside the main service worker from vite-plugin-pwa.
 *
 * When a weather notification is clicked:
 *   - "View Checklist" action → opens /weather page
 *   - Default click → opens /weather page
 *   - "Dismiss" action → closes the notification
 */

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (action === "dismiss") {
    return;
  }

  // Open or focus the weather page
  const targetUrl = data.url || "/weather";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If there's already an open window, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({
            type: "NOTIFICATION_CLICK",
            url: targetUrl,
            alertType: data.alertType,
          });
          return;
        }
      }

      // No window open — open a new one
      return clients.openWindow(targetUrl);
    })
  );
});

// Handle notification close (dismiss without action)
self.addEventListener("notificationclose", (event) => {
  // Analytics could be added here in future
});
