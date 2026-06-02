"use client"
// src/components/admin/BookingKanban.tsx
// Kanban board using @dnd-kit (React 19 compatible)

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"
import { formatNaira } from "@/lib/paystack"
import { Calendar, Car, User, Camera, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"

type Booking = {
  id: string
  customerName: string
  customerPhone: string
  carMake: string
  carModel: string
  carColour?: string | null
  carPlate?: string | null
  serviceName: string
  servicePrice: number
  scheduledDate: string
  stage: string
  depositPaid: boolean
  balancePaid: boolean
  assignedWorker?: { id: string; name: string; avatar?: string | null } | null
  intake?: { id: string } | null
}

type Worker = { id: string; name: string; avatar?: string | null }

type Props = {
  initialBookings: Booking[]
  workers: Worker[]
  userRole: string
}

const STAGES = [
  { id: "BOOKED",        label: "Booked",        color: "#4a9eff" },
  { id: "CAR_RECEIVED",  label: "Car Received",   color: "#f5a623" },
  { id: "IN_PROGRESS",   label: "In Progress",    color: "#9b59b6" },
  { id: "QUALITY_CHECK", label: "Quality Check",  color: "#e67e22" },
  { id: "COMPLETED",     label: "Completed",      color: "#00c896" },
]

export default function BookingKanban({ initialBookings, workers, userRole }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeBooking = activeId ? bookings.find((b) => b.id === activeId) : null
  const activeStage = activeBooking
    ? STAGES.find((s) => s.id === activeBooking.stage)
    : null

  const updateStage = useCallback(async (bookingId: string, newStage: string) => {
    setUpdating(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(`Moved to ${STAGES.find((s) => s.id === newStage)?.label}`)
    } catch (err: any) {
      // Revert optimistic update
      setBookings(initialBookings)
      toast.error(err.message || "Failed to update stage")
    } finally {
      setUpdating(null)
    }
  }, [initialBookings])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const bookingId = active.id as string
    const newStage = over.id as string
    const booking = bookings.find((b) => b.id === bookingId)

    if (!booking || booking.stage === newStage) return

    // Optimistic update
    setBookings((prev) =>
      prev.map((b) => b.id === bookingId ? { ...b, stage: newStage } : b)
    )

    updateStage(bookingId, newStage)
  }

  const byStage = (stage: string) => bookings.filter((b) => b.stage === stage)
  const canDrag = userRole === "OWNER" || userRole === "MANAGER"

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(240px, 1fr))",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 16,
      }}>
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            bookings={byStage(stage.id)}
            workers={workers}
            canDrag={canDrag}
            updating={updating}
          />
        ))}
      </div>

      {/* Drag overlay — shows card while dragging */}
      <DragOverlay>
        {activeBooking && activeStage ? (
          <BookingCard
            booking={activeBooking}
            stageColor={activeStage.color}
            isDragging
            workers={workers}
            canDrag={false}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ── Droppable column ──────────────────────────────────────────────────
function KanbanColumn({
  stage, bookings, workers, canDrag, updating,
}: {
  stage: { id: string; label: string; color: string }
  bookings: Booking[]
  workers: Worker[]
  canDrag: boolean
  updating: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div style={{ minWidth: 240 }}>
      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10, padding: "0 4px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 0.5 }}>
            {stage.label.toUpperCase()}
          </span>
        </div>
        <span style={{
          fontSize: 11, background: stage.color + "22",
          color: stage.color, padding: "1px 7px",
          borderRadius: 999, fontWeight: 700,
        }}>
          {bookings.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          minHeight: 120,
          background: isOver ? stage.color + "08" : "transparent",
          borderRadius: 10,
          border: isOver ? `1px dashed ${stage.color}44` : "1px dashed transparent",
          transition: "all 0.15s",
          padding: 4,
        }}
      >
        {bookings.map((booking) => (
          <div
            key={booking.id}
            style={{
              marginBottom: 10,
              opacity: updating === booking.id ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <DraggableCard
              booking={booking}
              stageColor={stage.color}
              workers={workers}
              canDrag={canDrag}
            />
          </div>
        ))}

        {bookings.length === 0 && (
          <div style={{
            padding: "24px 0", textAlign: "center",
            color: "#222", fontSize: 12,
          }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

// ── Draggable card wrapper ────────────────────────────────────────────
function DraggableCard({
  booking, stageColor, workers, canDrag,
}: {
  booking: Booking
  stageColor: string
  workers: Worker[]
  canDrag: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
    disabled: !canDrag,
  })

  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      style={{ opacity: isDragging ? 0.3 : 1, cursor: canDrag ? "grab" : "default" }}
    >
      <BookingCard
        booking={booking}
        stageColor={stageColor}
        isDragging={false}
        workers={workers}
        canDrag={canDrag}
      />
    </div>
  )
}

// ── Visual card ───────────────────────────────────────────────────────
function BookingCard({
  booking, stageColor, isDragging, canDrag,
}: {
  booking: Booking
  stageColor: string
  isDragging: boolean
  workers: Worker[]
  canDrag: boolean
}) {
  const date = new Date(booking.scheduledDate)

  return (
    <div style={{
      background: isDragging ? "#1a1a1a" : "#0f0f0f",
      border: `1px solid ${isDragging ? stageColor + "66" : "#1c1c1c"}`,
      borderLeft: `3px solid ${stageColor}`,
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: isDragging ? "0 8px 30px rgba(0,0,0,0.5)" : "none",
    }}>
      <div style={{ padding: "12px 14px" }}>
        {/* Customer */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 10,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e0e0e0" }}>
              {booking.customerName}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>
              {booking.customerPhone}
            </p>
          </div>
          {booking.intake && (
            <span title="Intake done" style={{ color: "#00c896" }}>
              <Camera size={14} />
            </span>
          )}
        </div>

        {/* Car */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, color: "#666", marginBottom: 6,
        }}>
          <Car size={12} color="#555" />
          <span>
            {booking.carMake} {booking.carModel}
            {booking.carColour ? ` · ${booking.carColour}` : ""}
            {booking.carPlate ? ` · ${booking.carPlate}` : ""}
          </span>
        </div>

        {/* Service */}
        <p style={{
          margin: "0 0 8px", fontSize: 11, color: "#888",
          background: "#141414", padding: "3px 8px",
          borderRadius: 4, display: "inline-block",
        }}>
          {booking.serviceName}
        </p>

        {/* Date + price */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#555" }}>
            <Calendar size={11} />
            {date.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
            {formatNaira(booking.servicePrice)}
          </span>
        </div>

        {/* Payment indicators */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          <span style={{
            fontSize: 10, padding: "2px 6px", borderRadius: 4,
            background: booking.depositPaid ? "#00c89622" : "#1a1a1a",
            color: booking.depositPaid ? "#00c896" : "#444",
            border: `1px solid ${booking.depositPaid ? "#00c89644" : "#222"}`,
          }}>
            Deposit {booking.depositPaid ? "✓" : "pending"}
          </span>
          <span style={{
            fontSize: 10, padding: "2px 6px", borderRadius: 4,
            background: booking.balancePaid ? "#00c89622" : "#1a1a1a",
            color: booking.balancePaid ? "#00c896" : "#444",
            border: `1px solid ${booking.balancePaid ? "#00c89644" : "#222"}`,
          }}>
            Balance {booking.balancePaid ? "✓" : "pending"}
          </span>
        </div>

        {/* Worker */}
        {booking.assignedWorker ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#666" }}>
            <User size={11} />
            {booking.assignedWorker.name}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "#333" }}>Unassigned</span>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #141414" }}>
        <Link
          href={`/admin/dashboard/bookings/${booking.id}`}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "8px 14px", fontSize: 11, color: "#555",
            textDecoration: "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          View details <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  )
}
