// src/app/admin/dashboard/bookings/page.tsx
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import BookingKanban from "@/components/admin/BookingKanban"
import Link from "next/link"
import { Plus, CalendarCheck } from "lucide-react"

async function getBookings() {
  return prisma.booking.findMany({
    where: { stage: { not: "CANCELLED" } },
    orderBy: { scheduledDate: "asc" },
    include: {
      assignedWorker: { select: { id: true, name: true, avatar: true } },
      intake: { select: { id: true } },
    },
  })
}

async function getWorkers() {
  return prisma.user.findMany({
    where: { role: "WORKER", isActive: true },
    select: { id: true, name: true, avatar: true },
    orderBy: { name: "asc" },
  })
}

export default async function BookingsPage() {
  const session = await auth()
  const [bookings, workers] = await Promise.all([getBookings(), getWorkers()])

  const byStage = {
    BOOKED: bookings.filter((b) => b.stage === "BOOKED"),
    CAR_RECEIVED: bookings.filter((b) => b.stage === "CAR_RECEIVED"),
    IN_PROGRESS: bookings.filter((b) => b.stage === "IN_PROGRESS"),
    QUALITY_CHECK: bookings.filter((b) => b.stage === "QUALITY_CHECK"),
    COMPLETED: bookings.filter((b) => b.stage === "COMPLETED"),
  }

  return (
    <div style={{ padding: "32px 32px 32px" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 28,
      }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>
            Booking Pipeline
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
            {bookings.length} active booking{bookings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/dashboard/bookings/new" style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#e63c1e", color: "#fff",
          padding: "10px 18px", borderRadius: 8,
          textDecoration: "none", fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={16} /> New Booking
        </Link>
      </div>

      {/* Stage summary pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Booked", count: byStage.BOOKED.length, color: "#4a9eff" },
          { label: "Car Received", count: byStage.CAR_RECEIVED.length, color: "#f5a623" },
          { label: "In Progress", count: byStage.IN_PROGRESS.length, color: "#9b59b6" },
          { label: "Quality Check", count: byStage.QUALITY_CHECK.length, color: "#e67e22" },
          { label: "Completed", count: byStage.COMPLETED.length, color: "#00c896" },
        ].map((s) => (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#0f0f0f", border: "1px solid #1a1a1a",
            borderRadius: 999, padding: "5px 12px",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: 12, color: "#666" }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <BookingKanban
        initialBookings={bookings as any}
        workers={workers}
        userRole={session!.user.role}
      />
    </div>
  )
}
