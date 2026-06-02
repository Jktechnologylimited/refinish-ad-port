// src/app/worker/jobs/[id]/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import WorkerStageUpdate from "@/components/worker/WorkerStageUpdate"
import { ChevronLeft, Camera, Car, Calendar, CheckCircle } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

const FUEL_LABELS: Record<string, string> = {
  EMPTY: "Empty", QUARTER: "1/4", HALF: "1/2", THREE_QUARTER: "3/4", FULL: "Full",
}
const FLUID_LABELS: Record<string, string> = { LOW: "Low ⚠️", OK: "OK", FULL: "Full" }
const TYRE_LABELS: Record<string, string> = {
  POOR: "Poor", FAIR: "Fair", GOOD: "Good", EXCELLENT: "Excellent",
}

export default async function WorkerJobPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      intake: {
        include: { photos: { orderBy: { takenAt: "asc" } } },
      },
    },
  })

  if (!booking) notFound()

  // Workers can only see their own jobs
  if (session!.user.role === "WORKER" && booking.assignedWorkerId !== session!.user.id) {
    redirect("/worker/jobs")
  }

  const needsIntake = booking.stage === "BOOKED" && !booking.intake

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
      <Link href="/worker/jobs" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#555", textDecoration: "none", marginBottom: 20,
      }}>
        <ChevronLeft size={14} /> My Jobs
      </Link>

      {/* Job header */}
      <div style={{
        background: "#0f0f0f", border: "1px solid #1c1c1c",
        borderRadius: 14, padding: "20px", marginBottom: 16,
      }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#fff" }}>
          {booking.customerName}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#666", marginBottom: 12 }}>
          <Car size={13} />
          {booking.carMake} {booking.carModel}
          {booking.carColour ? ` · ${booking.carColour}` : ""}
          {booking.carPlate ? ` · ${booking.carPlate}` : ""}
        </div>

        <div style={{
          background: "#141414", borderRadius: 8,
          padding: "10px 12px", marginBottom: 12,
          fontSize: 13, color: "#888",
        }}>
          {booking.serviceName}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
          <Calendar size={12} />
          {new Date(booking.scheduledDate).toLocaleDateString("en-NG", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </div>
      </div>

      {/* Stage update */}
      <WorkerStageUpdate
        bookingId={booking.id}
        currentStage={booking.stage}
        hasIntake={!!booking.intake}
      />

      {/* Intake CTA */}
      {needsIntake && (
        <Link href={`/worker/jobs/${booking.id}/intake`} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#0f0808", border: "2px solid #e63c1e",
          borderRadius: 14, padding: "18px 20px",
          textDecoration: "none", marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: "#e63c1e",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Camera size={22} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>
                Check In Vehicle
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
                Record condition & take photos
              </p>
            </div>
          </div>
          <ChevronLeft size={18} color="#e63c1e" style={{ transform: "rotate(180deg)" }} />
        </Link>
      )}

      {/* Intake done */}
      {booking.intake && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            background: "#0a1a0f", border: "1px solid #00c89644",
            borderRadius: 12, padding: "14px 16px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <CheckCircle size={16} color="#00c896" />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#00c896" }}>
                Vehicle Checked In
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>
                {new Date(booking.intake.receivedAt).toLocaleString("en-NG")}
              </p>
            </div>
          </div>

          {/* Intake summary */}
          <div style={{
            background: "#0f0f0f", border: "1px solid #1c1c1c",
            borderRadius: 12, padding: "16px", marginBottom: 12,
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
              Condition Report
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Fuel", FUEL_LABELS[booking.intake.fuelLevel]],
                ["Engine Oil", FLUID_LABELS[booking.intake.engineOilLevel]],
                ["Coolant", FLUID_LABELS[booking.intake.coolantLevel]],
                ["Tyres", TYRE_LABELS[booking.intake.tyreCondition]],
                ...(booking.intake.mileage ? [["Mileage", booking.intake.mileage]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ background: "#141414", borderRadius: 8, padding: "8px 10px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#ccc" }}>{value}</p>
                </div>
              ))}
            </div>
            {booking.intake.existingDamage && (
              <div style={{
                marginTop: 10, padding: "10px 12px",
                background: "#1a0808", border: "1px solid #e63c1e22",
                borderRadius: 8,
              }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#555", textTransform: "uppercase" }}>Existing Damage</p>
                <p style={{ margin: 0, fontSize: 12, color: "#ccc" }}>{booking.intake.existingDamage}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          {booking.intake.photos.length > 0 && (
            <div style={{
              background: "#0f0f0f", border: "1px solid #1c1c1c",
              borderRadius: 12, padding: "16px",
            }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
                Photos ({booking.intake.photos.length})
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)", gap: 6,
              }}>
                {booking.intake.photos.map((photo) => (
                  <div key={photo.id} style={{
                    aspectRatio: "1", borderRadius: 8, overflow: "hidden",
                    position: "relative", background: "#141414",
                  }}>
                    <Image src={photo.url} alt={photo.caption || ""}
                      fill style={{ objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer contact */}
      <div style={{
        background: "#0f0f0f", border: "1px solid #1c1c1c",
        borderRadius: 12, padding: "16px",
      }}>
        <p style={{ margin: "0 0 10px", fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
          Customer Contact
        </p>
        <p style={{ margin: "0 0 6px", fontSize: 14, color: "#ccc" }}>{booking.customerName}</p>
        <a href={`tel:${booking.customerPhone}`} style={{
          display: "inline-block", fontSize: 14, color: "#e63c1e",
          textDecoration: "none",
        }}>
          {booking.customerPhone}
        </a>
      </div>
    </div>
  )
}
