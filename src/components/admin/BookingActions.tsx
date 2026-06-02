"use client"
// src/components/admin/BookingActions.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ChevronRight, UserCheck, StickyNote, CheckCircle } from "lucide-react"

const STAGE_FLOW = [
  "BOOKED", "CAR_RECEIVED", "IN_PROGRESS", "QUALITY_CHECK", "COMPLETED",
] as const

const STAGE_LABELS: Record<string, string> = {
  BOOKED: "Booked", CAR_RECEIVED: "Car Received", IN_PROGRESS: "In Progress",
  QUALITY_CHECK: "Quality Check", COMPLETED: "Completed", CANCELLED: "Cancelled",
}

const STAGE_COLORS: Record<string, string> = {
  BOOKED: "#4a9eff", CAR_RECEIVED: "#f5a623", IN_PROGRESS: "#9b59b6",
  QUALITY_CHECK: "#e67e22", COMPLETED: "#00c896", CANCELLED: "#555",
}

type Props = {
  booking: {
    id: string; stage: string; assignedWorkerId?: string | null
    internalNotes?: string | null; depositPaid: boolean; balancePaid: boolean
    depositAmount: number; balanceAmount: number
  }
  workers: { id: string; name: string }[]
  userRole: string
}

export default function BookingActions({ booking, workers, userRole }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(booking.internalNotes || "")
  const [selectedWorker, setSelectedWorker] = useState(booking.assignedWorkerId || "")

  const currentIndex = STAGE_FLOW.indexOf(booking.stage as any)
  const nextStage = currentIndex < STAGE_FLOW.length - 1 ? STAGE_FLOW[currentIndex + 1] : null
  const isCompleted = booking.stage === "COMPLETED"

  async function patch(data: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success("Updated")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    } finally {
      setLoading(false)
    }
  }

  const canEdit = userRole === "OWNER" || userRole === "MANAGER"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 84 }}>
      {/* Advance stage */}
      {canEdit && nextStage && !isCompleted && (
        <div style={{
          background: "#0f0f0f", border: "1px solid #1c1c1c",
          borderRadius: 12, padding: "18px 20px",
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
            Advance Stage
          </p>
          <button
            onClick={() => patch({ stage: nextStage, note: `Advanced to ${STAGE_LABELS[nextStage]}` })}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: "space-between",
              background: STAGE_COLORS[nextStage] + "22",
              border: `1px solid ${STAGE_COLORS[nextStage]}44`,
              borderRadius: 8, padding: "12px 14px",
              color: STAGE_COLORS[nextStage],
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <span>Move to {STAGE_LABELS[nextStage]}</span>
            <ChevronRight size={16} />
          </button>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <div style={{
              height: 3, flex: currentIndex + 1, borderRadius: 999,
              background: STAGE_COLORS[booking.stage],
            }} />
            <div style={{
              height: 3, flex: STAGE_FLOW.length - currentIndex - 1,
              borderRadius: 999, background: "#1a1a1a",
            }} />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#444" }}>
            Step {currentIndex + 1} of {STAGE_FLOW.length}
          </p>
        </div>
      )}

      {isCompleted && (
        <div style={{
          background: "#0a1a0f", border: "1px solid #00c89644",
          borderRadius: 12, padding: "18px 20px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <CheckCircle size={18} color="#00c896" />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#00c896" }}>Job Completed</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>All stages done</p>
          </div>
        </div>
      )}

      {/* Assign worker */}
      {canEdit && (
        <div style={{
          background: "#0f0f0f", border: "1px solid #1c1c1c",
          borderRadius: 12, padding: "18px 20px",
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <UserCheck size={13} /> Assign Worker
          </p>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            style={{
              width: "100%", background: "#141414", border: "1px solid #222",
              borderRadius: 8, padding: "9px 12px",
              color: "#fff", fontSize: 13, outline: "none",
              marginBottom: 10, boxSizing: "border-box",
            }}
          >
            <option value="">Unassigned</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <button
            onClick={() => patch({ assignedWorkerId: selectedWorker || null })}
            disabled={loading}
            style={{
              width: "100%", background: "#1a1a1a",
              border: "1px solid #222", borderRadius: 8,
              padding: "9px", color: "#888", fontSize: 13,
              cursor: "pointer", fontWeight: 500,
            }}
          >
            {loading ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      )}

      {/* Payment actions */}
      {canEdit && (
        <div style={{
          background: "#0f0f0f", border: "1px solid #1c1c1c",
          borderRadius: 12, padding: "18px 20px",
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
            Mark Payment
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {!booking.depositPaid && (
              <button
                onClick={() => patch({ depositPaid: true })}
                disabled={loading}
                style={{
                  background: "#0a1200", border: "1px solid #00c89644",
                  borderRadius: 8, padding: "9px 14px",
                  color: "#00c896", fontSize: 12, cursor: "pointer", fontWeight: 500, textAlign: "left",
                }}
              >
                ✓ Mark Deposit Paid
              </button>
            )}
            {!booking.balancePaid && (
              <button
                onClick={() => patch({ balancePaid: true })}
                disabled={loading}
                style={{
                  background: "#0a1200", border: "1px solid #00c89644",
                  borderRadius: 8, padding: "9px 14px",
                  color: "#00c896", fontSize: 12, cursor: "pointer", fontWeight: 500, textAlign: "left",
                }}
              >
                ✓ Mark Balance Paid
              </button>
            )}
            {booking.depositPaid && booking.balancePaid && (
              <p style={{ margin: 0, fontSize: 12, color: "#00c896" }}>✓ Fully paid</p>
            )}
          </div>
        </div>
      )}

      {/* Internal notes */}
      {canEdit && (
        <div style={{
          background: "#0f0f0f", border: "1px solid #1c1c1c",
          borderRadius: 12, padding: "18px 20px",
        }}>
          <p style={{
            margin: "0 0 12px", fontSize: 12, color: "#555",
            letterSpacing: 1, textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <StickyNote size={13} /> Internal Notes
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes visible only to staff..."
            style={{
              width: "100%", background: "#141414",
              border: "1px solid #222", borderRadius: 8,
              padding: "10px 12px", color: "#fff",
              fontSize: 13, resize: "vertical",
              outline: "none", boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => patch({ internalNotes: notes })}
            disabled={loading}
            style={{
              marginTop: 8, width: "100%",
              background: "#1a1a1a", border: "1px solid #222",
              borderRadius: 8, padding: "9px",
              color: "#888", fontSize: 13, cursor: "pointer",
            }}
          >
            {loading ? "Saving..." : "Save Notes"}
          </button>
        </div>
      )}
    </div>
  )
}
