/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope & {
  readonly __WB_MANIFEST: Array<{ url: string; revision: string | null | undefined }>;
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

const navigationHandler = createHandlerBoundToURL("/index.html");
registerRoute(new NavigationRoute(navigationHandler));

self.addEventListener("push", (event: PushEvent) => {
  let title = "LifeSync";
  let body = "Você tem uma atualização no LifeSync.";
  let url = "/habits";
  try {
    if (event.data) {
      const parsed = event.data.json() as { title?: string; body?: string; url?: string };
      if (typeof parsed.title === "string" && parsed.title.length > 0) title = parsed.title;
      if (typeof parsed.body === "string" && parsed.body.length > 0) body = parsed.body;
      if (typeof parsed.url === "string" && parsed.url.length > 0) url = parsed.url;
    }
  } catch {
    const t = event.data?.text();
    if (typeof t === "string" && t.length > 0) body = t;
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "lifesync-push",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const raw = event.notification.data as { url?: string } | undefined;
  const urlPath =
    typeof raw === "object" && raw !== null && typeof raw.url === "string" && raw.url.length > 0
      ? raw.url
      : "/habits";
  const urlToOpen = new URL(urlPath, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          await client.focus();
          if ("navigate" in client && typeof client.navigate === "function") {
            await client.navigate(urlToOpen);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })(),
  );
});
