// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendJobCompleted, sendWorkerAssignment } from "@/lib/resend"
import { z } from "zod"

type Params = { params: Promise<{ id: string }> }

// GET /api/bookings/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedWorker: { select: { id: true, name: true, email: true, avatar: true } },
      intake: {
        include: {
          photos: { orderBy: { takenAt: "asc" } },
          worker: { select: { id: true, name: true } },
        },
      },
      stageHistory: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Workers can only see their own bookings
  if (
    session.user.role === "WORKER" &&
    booking.assignedWorkerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: booking })
}

const updateSchema = z.object({
  stage: z.enum(["BOOKED", "CAR_RECEIVED", "IN_PROGRESS", "QUALITY_CHECK", "COMPLETED", "CANCELLED"]).optional(),
  assignedWorkerId: z.string().optional().nullable(),
  internalNotes: z.string().optional(),
  estimatedCompletion: z.string().optional(),
  note: z.string().optional(), // for stage history
  depositPaid: z.boolean().optional(),
  balancePaid: z.boolean().optional(),
  depositPaystackRef: z.string().optional(),
  balancePaystackRef: z.string().optional(),
})

// PATCH /api/bookings/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const data = updateSchema.parse(body)

  const existing = await prisma.booking.findUnique({
    where: { id },
    include: { assignedWorker: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Workers can only update stage (not assign workers or notes)
  if (session.user.role === "WORKER") {
    if (data.assignedWorkerId !== undefined || data.internalNotes !== undefined) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const updateData: any = {}
  if (data.stage) updateData.stage = data.stage
  if (data.assignedWorkerId !== undefined) updateData.assignedWorkerId = data.assignedWorkerId
  if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes
  if (data.estimatedCompletion) updateData.estimatedCompletion = new Date(data.estimatedCompletion)
  if (data.depositPaid !== undefined) {
    updateData.depositPaid = data.depositPaid
    if (data.depositPaid) updateData.totalPaid = { increment: existing.depositAmount }
  }
  if (data.balancePaid !== undefined) {
    updateData.balancePaid = data.balancePaid
    if (data.balancePaid) updateData.totalPaid = { increment: existing.balanceAmount }
  }
  if (data.depositPaystackRef) updateData.depositPaystackRef = data.depositPaystackRef
  if (data.balancePaystackRef) updateData.balancePaystackRef = data.balancePaystackRef

  // Add stage history entry if stage changed
  if (data.stage && data.stage !== existing.stage) {
    updateData.stageHistory = {
      create: {
        stage: data.stage,
        note: data.note || null,
        changedBy: session.user.name,
      },
    }

    // Send completion email
    if (data.stage === "COMPLETED" && existing.customerEmail) {
      sendJobCompleted({
        to: existing.customerEmail,
        customerName: existing.customerName,
        bookingRef: existing.id,
        serviceName: existing.serviceName,
        balanceDue: existing.balancePaid ? 0 : existing.balanceAmount,
      }).catch(console.error)
    }
  }

  // Send worker assignment email when worker is assigned
  if (
    data.assignedWorkerId &&
    data.assignedWorkerId !== existing.assignedWorkerId
  ) {
    const worker = await prisma.user.findUnique({ where: { id: data.assignedWorkerId } })
    if (worker?.email) {
      sendWorkerAssignment({
        to: worker.email,
        workerName: worker.name,
        bookingRef: existing.id,
        serviceName: existing.serviceName,
        carDetails: `${existing.carMake} ${existing.carModel} ${existing.carColour || ""}`.trim(),
        scheduledDate: existing.scheduledDate.toLocaleDateString("en-NG"),
      }).catch(console.error)
    }
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: updateData,
    include: {
      assignedWorker: { select: { id: true, name: true } },
      intake: { select: { id: true } },
    },
  })

  return NextResponse.json({ success: true, data: updated })
}

// DELETE /api/bookings/[id] — owner only, soft cancel
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  await prisma.booking.update({
    where: { id },
    data: {
      stage: "CANCELLED",
      stageHistory: { create: { stage: "CANCELLED", changedBy: session.user.name } },
    },
  })

  return NextResponse.json({ success: true })
}
