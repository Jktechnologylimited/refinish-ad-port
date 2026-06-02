"use client"
// src/components/worker/WorkerStageUpdate.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ChevronRight } from "lucide-react"

const NEXT_STAGE: Record<string, { stage: string; label: string; color: string }> = {
  CAR_RECEIVED: { stage: "IN_PROGRESS", label: "Start Work", color: "#9b59b6" },
  IN_PROGRESS: { stage: "QUALITY_CHECK", label: "Ready for Quality Check", color: "#e67e22" },
  QUALITY_CHECK: { stage: "COMPLETED", label: "Mark Completed", color: "#00c896" },
}

export default function WorkerStageUpdate({
  bookingId, currentStage, hasIntake,
}: {
  bookingId: string; currentStage: string; hasIntake: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const next = NEXT_STAGE[currentStage]

  if (!next) return null
  if (currentStage === "BOOKED" && !hasIntake) return null // Must complete intake first

  async function advance() {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next.stage }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(`Updated to ${next.label}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={advance}
      disabled={loading}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between",
        background: next.color + "22",
        border: `2px solid ${next.color}44`,
        borderRadius: 14, padding: "16px 20px",
        color: next.color, cursor: loading ? "not-allowed" : "pointer",
        marginBottom: 16, transition: "all 0.15s",
      }}
    >
      <div style={{ textAlign: "left" }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
          {loading ? "Updating..." : next.label}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.7 }}>
          Tap to advance this job
        </p>
      </div>
      <ChevronRight size={20} />
    </button>
  )
}
