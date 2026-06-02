// src/app/offline/page.tsx
export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: 24,
          filter: "grayscale(1)",
          opacity: 0.5,
        }}
      >
        ⚡
      </div>
      <h1 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 700, color: "#fff" }}>
        You're offline
      </h1>
      <p style={{ margin: "0 0 32px", fontSize: 14, color: "#555", maxWidth: 300, lineHeight: 1.7 }}>
        No internet connection. If you're a worker, open your jobs from the cached
        version — any changes will sync when you're back online.
      </p>
      <a
        href="/worker/jobs"
        style={{
          background: "#e63c1e",
          color: "#fff",
          padding: "12px 28px",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Go to My Jobs
      </a>
    </div>
  )
}
