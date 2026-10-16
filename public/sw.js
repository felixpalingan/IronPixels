// IronPixels Service Worker - Background Rest Timer & Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

let restTimerTimeout = null;

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SCHEDULE_REST_TIMER") {
    if (restTimerTimeout) {
      clearTimeout(restTimerTimeout);
      restTimerTimeout = null;
    }

    const { targetTimestamp, title, body } = data;
    const delayMs = Math.max(0, (targetTimestamp || 0) - Date.now());

    restTimerTimeout = setTimeout(() => {
      self.registration.showNotification(title || "REST TIMER SELESAI! 🏋️", {
        body: body || "Waktu istirahat selesai! Masuk ke set berikutnya untuk menyerang boss!",
        icon: "/icon.png",
        badge: "/icon.png",
        vibrate: [200, 100, 200, 100, 400],
        tag: "ironpixels-rest-timer",
        renotify: true,
        data: { url: "/" },
      });
      restTimerTimeout = null;
    }, delayMs);
  }

  if (data.type === "CANCEL_REST_TIMER") {
    if (restTimerTimeout) {
      clearTimeout(restTimerTimeout);
      restTimerTimeout = null;
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
  );
});
