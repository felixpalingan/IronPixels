// IronPixels Service Worker - Background-Resilient Rest Timer & Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

let restTimerTimeout = null;
let restTimerInterval = null;
let activeTimerResolve = null;
let activeTimerState = null; // { timerId, targetTimestamp, title, body }
let lastFiredTimerId = null;

function clearActiveTimers() {
  if (restTimerTimeout) {
    clearTimeout(restTimerTimeout);
    restTimerTimeout = null;
  }
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  if (activeTimerResolve) {
    const resolve = activeTimerResolve;
    activeTimerResolve = null;
    resolve();
  }
  activeTimerState = null;
}

async function fireRestNotification(timerId, title, body) {
  const effectiveId = timerId || (activeTimerState && activeTimerState.timerId);
  if (effectiveId && lastFiredTimerId === effectiveId) {
    clearActiveTimers();
    return;
  }
  if (effectiveId) {
    lastFiredTimerId = effectiveId;
  }

  const notifTitle =
    title || (activeTimerState && activeTimerState.title) || "REST TIMER SELESAI! 🏋️";
  const notifBody =
    body ||
    (activeTimerState && activeTimerState.body) ||
    "Waktu istirahat selesai! Masuk ke set berikutnya untuk menyerang boss!";

  clearActiveTimers();

  try {
    await self.registration.showNotification(notifTitle, {
      body: notifBody,
      icon: "/icon.png",
      badge: "/icon.png",
      vibrate: [300, 100, 300, 100, 500],
      tag: "ironpixels-rest-timer",
      renotify: true,
      requireInteraction: true,
      silent: false,
      data: { url: "/", timerId: effectiveId },
    });
  } catch (err) {
    // Fallback for browsers with strict NotificationOptions support (e.g. iOS Safari PWA)
    try {
      await self.registration.showNotification(notifTitle, {
        body: notifBody,
        icon: "/icon.png",
        tag: "ironpixels-rest-timer",
        data: { url: "/" },
      });
    } catch (e) {}
  }

  // Notify any open/background clients that the rest timer has fired
  try {
    const clientList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    for (const client of clientList) {
      client.postMessage({
        type: "REST_TIMER_FIRED",
        timerId: effectiveId,
      });
    }
  } catch (e) {}
}

function scheduleInternalTimer(timerId, targetTimestamp, title, body) {
  clearActiveTimers();

  activeTimerState = { timerId, targetTimestamp, title, body };
  const delayMs = Math.max(0, targetTimestamp - Date.now());

  if (delayMs <= 150) {
    return fireRestNotification(timerId, title, body);
  }

  return new Promise((resolve) => {
    activeTimerResolve = resolve;

    restTimerTimeout = setTimeout(async () => {
      await fireRestNotification(timerId, title, body);
      resolve();
    }, delayMs);

    // Wall-clock 1s check in case setTimeout drifts during mobile CPU sleep
    restTimerInterval = setInterval(async () => {
      if (!activeTimerState) {
        clearInterval(restTimerInterval);
        restTimerInterval = null;
        resolve();
        return;
      }
      if (Date.now() >= activeTimerState.targetTimestamp) {
        const { timerId: id, title: t, body: b } = activeTimerState;
        await fireRestNotification(id, t, b);
        resolve();
      }
    }, 1000);
  });
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SCHEDULE_REST_TIMER") {
    const targetTimestamp = Number(data.targetTimestamp) || Date.now();
    const timerId = data.timerId || targetTimestamp;
    const title = data.title || "REST TIMER SELESAI! 🏋️";
    const body =
      data.body || "Waktu istirahat selesai! Masuk ke set berikutnya untuk menyerang boss!";

    event.waitUntil(scheduleInternalTimer(timerId, targetTimestamp, title, body));
    return;
  }

  if (data.type === "KEEP_ALIVE_PING") {
    const targetTimestamp = Number(data.targetTimestamp) || 0;
    const timerId = data.timerId || targetTimestamp;
    const title = data.title || "REST TIMER SELESAI! 🏋️";
    const body =
      data.body || "Waktu istirahat selesai! Masuk ke set berikutnya untuk menyerang boss!";

    if (targetTimestamp > 0 && lastFiredTimerId !== timerId) {
      if (Date.now() >= targetTimestamp) {
        event.waitUntil(fireRestNotification(timerId, title, body));
      } else if (!activeTimerState || activeTimerState.timerId !== timerId) {
        // Rehydrate timer if Service Worker was restarted by the OS while in background
        event.waitUntil(scheduleInternalTimer(timerId, targetTimestamp, title, body));
      } else {
        // Keep SW awake for another window
        event.waitUntil(new Promise((resolve) => setTimeout(resolve, 4000)));
      }
    }
    return;
  }

  if (data.type === "TRIGGER_REST_TIMER_NOW") {
    const timerId =
      data.timerId ||
      data.targetTimestamp ||
      (activeTimerState && activeTimerState.timerId) ||
      Date.now();
    const title = data.title || (activeTimerState && activeTimerState.title);
    const body = data.body || (activeTimerState && activeTimerState.body);
    event.waitUntil(fireRestNotification(timerId, title, body));
    return;
  }

  if (data.type === "CANCEL_REST_TIMER") {
    clearActiveTimers();
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
