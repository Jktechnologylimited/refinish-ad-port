"use client"
// src/components/admin/WorkerCard.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { UserCheck, UserX, Briefcase } from "lucide-react"

type Worker = {
  id: string; name: string; email: string; role: string
  phone?: string | null; isActive: boolean; createdAt: string
  assignedBookings: { id: string; stage: string; customerName: string }[]
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  MANAGER: { bg: "#4a9eff22", color: "#4a9eff" },
  WORKER:  { bg: "#9b59b622", color: "#9b59b6" },
}

export default function WorkerCard({ worker }: { worker: Worker }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/workers/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !worker.isActive }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(worker.isActive ? "Worker deactivated" : "Worker activated")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = ROLE_COLORS[worker.role] || ROLE_COLORS.WORKER
  const activeJobs = worker.assignedBookings.filter((b) =>
    ["BOOKED", "CAR_RECEIVED", "IN_PROGRESS", "QUALITY_CHECK"].includes(b.stage)
  )

  return (
    <div style={{
      background: "#0f0f0f",
      border: `1px solid ${worker.isActive ? "#1c1c1c" : "#111"}`,
      borderRadius: 12, padding: "18px 20px",
      opacity: worker.isActive ? 1 : 0.6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Avatar placeholder */}
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: roleConfig.bg, border: `1px solid ${roleConfig.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: roleConfig.color,
          }}>
            {worker.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#ddd" }}>{worker.name}</p>
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 4,
                background: roleConfig.bg, color: roleConfig.color,
                border: `1px solid ${roleConfig.color}44`,
                letterSpacing: 1, textTransform: "uppercase",
              }}>
                {worker.role}
              </span>
              {!worker.isActive && (
                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "#1a1a1a", color: "#555" }}>
                  INACTIVE
                </span>
              )}
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#555" }}>{worker.email}</p>
            {worker.phone && <p style={{ margin: "1px 0 0", fontSize: 12, color: "#444" }}>{worker.phone}</p>}
          </div>
        </div>

        <button onClick={toggleActive} disabled={loading}
          title={worker.isActive ? "Deactivate" : "Activate"}
          style={{
            background: "none", border: "1px solid #222",
            borderRadius: 6, padding: "6px 10px",
            cursor: "pointer",
            color: worker.isActive ? "#555" : "#00c896",
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11,
          }}>
          {worker.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
          {worker.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>

      {/* Active jobs */}
      {activeJobs.length > 0 ? (
        <div style={{
          background: "#141414", borderRadius: 8, padding: "10px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Briefcase size={11} color="#555" />
            <p style={{ margin: 0, fontSize: 10, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
              Active Jobs ({activeJobs.length})
            </p>
          </div>
          {activeJobs.slice(0, 2).map((job) => (
            <p key={job.id} style={{ margin: "4px 0 0", fontSize: 12, color: "#777" }}>
              · {job.customerName}
            </p>
          ))}
          {activeJobs.length > 2 && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>
              +{activeJobs.length - 2} more
            </p>
          )}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: "#333" }}>No active jobs</p>
      )}
    </div>
  )
}
