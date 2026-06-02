"use client"
// src/components/admin/OrderFulfilmentActions.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Truck, Package, CheckCircle } from "lucide-react"

const FULFILMENT_FLOW = ["UNFULFILLED", "PROCESSING", "SHIPPED", "DELIVERED"] as const
const NEXT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  UNFULFILLED: { label: "Mark as Processing", icon: <Package size={16} />, color: "#f5a623" },
  PROCESSING:  { label: "Mark as Shipped", icon: <Truck size={16} />, color: "#4a9eff" },
  SHIPPED:     { label: "Mark as Delivered", icon: <CheckCircle size={16} />, color: "#00c896" },
}

export default function OrderFulfilmentActions({
  orderId, currentStatus, trackingNumber: initialTracking, notes: initialNotes,
}: {
  orderId: string; currentStatus: string
  trackingNumber: string; notes: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState(initialTracking)
  const [notes, setNotes] = useState(initialNotes)

  const currentIdx = FULFILMENT_FLOW.indexOf(currentStatus as any)
  const nextStatus = currentIdx < FULFILMENT_FLOW.length - 1 ? FULFILMENT_FLOW[currentIdx + 1] : null
  const nextConfig = nextStatus ? NEXT_LABELS[currentStatus] : null

  async function patch(data: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success("Order updated")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%", background: "#141414",
    border: "1px solid #222", borderRadius: 8,
    padding: "9px 12px", color: "#fff",
    fontSize: 13, outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 84 }}>
      {/* Advance fulfilment */}
      {nextConfig && nextStatus && (
        <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "18px 20px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
            Fulfilment
          </p>
          <button
            onClick={() => patch({ fulfilmentStatus: nextStatus })}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: "space-between",
              background: nextConfig.color + "22",
              border: `1px solid ${nextConfig.color}44`,
              borderRadius: 8, padding: "12px 14px",
              color: nextConfig.color,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {nextConfig.icon}
              {nextConfig.label}
            </div>
          </button>

          {/* Progress bar */}
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {FULFILMENT_FLOW.map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 999,
                background: i <= currentIdx ? nextConfig.color : "#1a1a1a",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#444" }}>
            Step {currentIdx + 1} of {FULFILMENT_FLOW.length}
          </p>
        </div>
      )}

      {currentStatus === "DELIVERED" && (
        <div style={{
          background: "#0a1a0f", border: "1px solid #00c89644",
          borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <CheckCircle size={18} color="#00c896" />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#00c896" }}>Delivered</p>
            <p style={{ margin: 0, fontSize: 11, color: "#555" }}>Order complete</p>
          </div>
        </div>
      )}

      {/* Tracking number */}
      <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "18px 20px" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
          Tracking Number
        </p>
        <input value={tracking} onChange={(e) => setTracking(e.target.value)}
          placeholder="e.g. GIG-12345678"
          style={{ ...inputStyle, marginBottom: 8 }} />
        <button onClick={() => patch({ trackingNumber: tracking })} disabled={loading}
          style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #222",
            borderRadius: 8, padding: "8px", color: "#888",
            fontSize: 12, cursor: "pointer",
          }}>
          Save Tracking
        </button>
      </div>

      {/* Notes */}
      <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "18px 20px" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
          Internal Notes
        </p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={3} placeholder="Internal notes..."
          style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
        <button onClick={() => patch({ notes })} disabled={loading}
          style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #222",
            borderRadius: 8, padding: "8px", color: "#888",
            fontSize: 12, cursor: "pointer",
          }}>
          Save Notes
        </button>
      </div>
    </div>
  )
}
