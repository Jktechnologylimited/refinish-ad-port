"use client"
// src/components/ui/ServiceWorkerProvider.tsx
// Registers the service worker and shows offline/sync status

import { useEffect, useState } from "react"

export default function ServiceWorkerProvider() {
  const [isOffline, setIsOffline] = useState(false)
  const [syncPending, setSyncPending] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA] Service worker registered:", registration.scope)

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setUpdateAvailable(true)
                }
              })
            }
          })
        })
        .catch((err) => console.error("[PWA] SW registration failed:", err))

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_COMPLETE") {
          setSyncPending(false)
          console.log("[PWA] Background sync complete:", event.data.url)
        }
      })
    }

    // Online/offline detection
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => {
      setIsOffline(false)
      // Check if there are pending syncs
      checkPendingSyncs()
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  async function checkPendingSyncs() {
    try {
      const { hasPendingSyncs } = await import("@/lib/offline")
      const pending = await hasPendingSyncs()
      setSyncPending(pending)
    } catch {}
  }

  function handleUpdate() {
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" })
    window.location.reload()
  }

  return (
    <>
      {/* Offline banner */}
      {isOffline && (
        <div className="offline-badge">
          ⚡ Offline — changes will sync when connected
        </div>
      )}

      {/* Sync pending indicator */}
      {syncPending && !isOffline && (
        <div
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            background: "#f5a623",
            color: "#000",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: 12,
            fontWeight: 600,
            zIndex: 9999,
          }}
        >
          ↑ Syncing...
        </div>
      )}

      {/* Update available banner */}
      {updateAvailable && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            border: "1px solid #e63c1e",
            borderRadius: 10,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 9999,
            fontSize: 13,
          }}
        >
          <span style={{ color: "#ccc" }}>Update available</span>
          <button
            onClick={handleUpdate}
            style={{
              background: "#e63c1e",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>
      )}
    </>
  )
}
