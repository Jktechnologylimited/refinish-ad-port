"use client"
// src/components/worker/WorkerJobList.tsx
// Caches jobs to IndexedDB for offline access

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Car, ChevronRight, Camera, Wifi, WifiOff } from "lucide-react"
import { cacheJobs } from "@/lib/offline"

type Job = {
  id: string
  customerName: string
  carMake: string
  carModel: string
  carColour?: string | null
  carPlate?: string | null
  serviceName: string
  servicePrice: number
  scheduledDate: string
  stage: string
  intake?: { id: string } | null
}

const STAGE_COLORS: Record<string, string> = {
  BOOKED: "#4a9eff",
  CAR_RECEIVED: "#f5a623",
  IN_PROGRESS: "#9b59b6",
  QUALITY_CHECK: "#e67e22",
}

const STAGE_LABELS: Record<string, string> = {
  BOOKED: "Booked",
  CAR_RECEIVED: "Car Received",
  IN_PROGRESS: "In Progress",
  QUALITY_CHECK: "Quality Check",
}

type Props = { initialJobs: Job[]; workerId: string }

export default function WorkerJobList({ initialJobs, workerId }: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    window.addEventListener("online", () => setIsOnline(true))
    window.addEventListener("offline", () => setIsOnline(false))

    // Cache jobs to IndexedDB for offline access
    if (initialJobs.length > 0) {
      cacheJobs(initialJobs.map((j) => ({
        ...j,
        customerPhone: "",
        serviceType: "",
        assignedWorkerId: workerId,
        cachedAt: Date.now(),
        scheduledDate: j.scheduledDate,
      }))).catch(console.error)
    }

    return () => {
      window.removeEventListener("online", () => setIsOnline(true))
      window.removeEventListener("offline", () => setIsOnline(false))
    }
  }, [initialJobs, workerId])

  if (jobs.length === 0) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>🔧</div>
        <p style={{ margin: "0 0 6px", fontSize: 16, color: "#666", fontWeight: 600 }}>
          No active jobs
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#444" }}>
          You'll see jobs here when they're assigned to you
        </p>
      </div>
    )
  }

  const sortedJobs = [...jobs].sort((a, b) => {
    const stageOrder = { BOOKED: 0, CAR_RECEIVED: 1, IN_PROGRESS: 2, QUALITY_CHECK: 3 }
    return (stageOrder[a.stage as keyof typeof stageOrder] || 0) -
           (stageOrder[b.stage as keyof typeof stageOrder] || 0)
  })

  return (
    <div style={{ padding: "16px 16px 20px" }}>
      {/* Online status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, color: isOnline ? "#00c896" : "#f5a623",
        marginBottom: 16,
      }}>
        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
        {isOnline ? "Online — syncing" : "Offline — showing cached jobs"}
      </div>

      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
        {jobs.length} Active Job{jobs.length !== 1 ? "s" : ""}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sortedJobs.map((job) => (
          <Link key={job.id} href={`/worker/jobs/${job.id}`}
            style={{ textDecoration: "none" }}>
            <div style={{
              background: "#0f0f0f",
              border: `1px solid #1c1c1c`,
              borderLeft: `3px solid ${STAGE_COLORS[job.stage] || "#444"}`,
              borderRadius: 12, padding: "16px",
              transition: "border-color 0.1s",
            }}>
              {/* Stage badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 4,
                  background: (STAGE_COLORS[job.stage] || "#444") + "22",
                  color: STAGE_COLORS[job.stage] || "#666",
                  border: `1px solid ${(STAGE_COLORS[job.stage] || "#444")}44`,
                  fontWeight: 600, letterSpacing: 0.5,
                }}>
                  {STAGE_LABELS[job.stage] || job.stage}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {job.intake && (
                    <span title="Intake completed" style={{ color: "#00c896" }}>
                      <Camera size={14} />
                    </span>
                  )}
                  <ChevronRight size={16} color="#333" />
                </div>
              </div>

              {/* Customer */}
              <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {job.customerName}
              </p>

              {/* Car */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: "#666", marginBottom: 8,
              }}>
                <Car size={12} />
                <span>
                  {job.carMake} {job.carModel}
                  {job.carColour ? ` · ${job.carColour}` : ""}
                  {job.carPlate ? ` · ${job.carPlate}` : ""}
                </span>
              </div>

              {/* Service + date */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: 11, color: "#888",
                  background: "#141414", padding: "3px 8px",
                  borderRadius: 4,
                }}>
                  {job.serviceName}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555" }}>
                  <Calendar size={11} />
                  {new Date(job.scheduledDate).toLocaleDateString("en-NG", {
                    day: "numeric", month: "short",
                  })}
                </div>
              </div>

              {/* Intake CTA */}
              {job.stage === "BOOKED" && !job.intake && (
                <div style={{
                  marginTop: 12, padding: "8px 12px",
                  background: "#e63c1e22", border: "1px solid #e63c1e44",
                  borderRadius: 8, fontSize: 12, color: "#e63c1e", fontWeight: 500,
                }}>
                  📸 Tap to check in this vehicle
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
