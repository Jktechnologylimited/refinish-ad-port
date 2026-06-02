// public/sw.js
// Service Worker for AutoOps PWA
// Handles offline caching + background sync for worker job updates

importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js")

const { registerRoute, setDefaultHandler, setCatchHandler } = workbox.routing
const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies
const { BackgroundSyncPlugin } = workbox.backgroundSync
const { ExpirationPlugin } = workbox.expiration
const { CacheableResponsePlugin } = workbox.cacheableResponse

// ── Cache names ──────────────────────────────────────────────────────
const CACHE_NAMES = {
  static: "autoops-static-v1",
  pages: "autoops-pages-v1",
  api: "autoops-api-v1",
  images: "autoops-images-v1",
}

// ── Background sync queue for offline actions ────────────────────────
// When worker updates job status / saves intake offline
const bgSyncPlugin = new BackgroundSyncPlugin("autoops-sync-queue", {
  maxRetentionTime: 24 * 60, // retry for up to 24 hours
  onSync: async ({ queue }) => {
    let entry
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request)
        console.log("[SW] Synced queued request:", entry.request.url)
        // Notify the app that sync completed
        const clients = await self.clients.matchAll()
        clients.forEach((client) => {
          client.postMessage({ type: "SYNC_COMPLETE", url: entry.request.url })
        })
      } catch (error) {
        console.error("[SW] Sync failed, re-queuing:", error)
        await queue.unshiftRequest(entry)
        throw error
      }
    }
  },
})

// ── Install: cache core static assets ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll([
        "/worker/jobs",
        "/offline",
        "/manifest.json",
        "/icons/icon-192x192.png",
      ])
    })
  )
  self.skipWaiting()
})

// ── Activate: clean old caches ────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !Object.values(CACHE_NAMES).includes(name))
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// ── Routing strategies ────────────────────────────────────────────────

// Worker job pages — Network first, fall back to cache
registerRoute(
  ({ url }) => url.pathname.startsWith("/worker"),
  new NetworkFirst({
    cacheName: CACHE_NAMES.pages,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
)

// API routes for worker jobs — Network first, queue if offline
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/api/bookings") ||
    url.pathname.startsWith("/api/intake"),
  new NetworkFirst({
    cacheName: CACHE_NAMES.api,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 }),
    ],
    fetchOptions: { credentials: "include" },
  })
)

// POST/PATCH requests when offline — queue for background sync
self.addEventListener("fetch", (event) => {
  if (
    event.request.method === "POST" ||
    event.request.method === "PATCH" ||
    event.request.method === "PUT"
  ) {
    const url = new URL(event.request.url)
    if (
      url.pathname.startsWith("/api/bookings") ||
      url.pathname.startsWith("/api/intake") ||
      url.pathname.startsWith("/api/upload")
    ) {
      const bgSyncResponse = fetch(event.request.clone()).catch(() => {
        // Add to background sync queue when offline
        bgSyncPlugin._queue.pushRequest({ request: event.request })
        // Return optimistic response so UI doesn't break
        return new Response(
          JSON.stringify({ queued: true, message: "Saved offline, will sync when connected" }),
          { headers: { "Content-Type": "application/json" }, status: 202 }
        )
      })
      event.respondWith(bgSyncResponse)
      return
    }
  }
})

// Images — Cache first (Cloudinary images don't change)
registerRoute(
  ({ url }) =>
    url.hostname === "res.cloudinary.com" ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/),
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
)

// Static assets (JS, CSS, fonts) — Stale while revalidate
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font",
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.static,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
)

// ── Fallback for offline pages ────────────────────────────────────────
setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const cache = await caches.open(CACHE_NAMES.static)
    return (await cache.match("/offline")) || Response.error()
  }
  return Response.error()
})

// ── Listen for messages from the app ─────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
  if (event.data?.type === "CACHE_URLS") {
    const urls = event.data.payload
    caches.open(CACHE_NAMES.pages).then((cache) => cache.addAll(urls))
  }
})

// ── Push notifications (for job assignment alerts) ────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || "AutoOps", {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: data.tag || "autoops-notification",
      data: { url: data.url || "/worker/jobs" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/worker/jobs")
  )
})
