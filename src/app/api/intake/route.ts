// src/app/api/intake/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { uploadImage } from "@/lib/cloudinary"
import { z } from "zod"

const intakeSchema = z.object({
  bookingId: z.string(),
  fuelLevel: z.enum(["EMPTY", "QUARTER", "HALF", "THREE_QUARTER", "FULL"]),
  engineOilLevel: z.enum(["LOW", "OK", "FULL"]),
  coolantLevel: z.enum(["LOW", "OK", "FULL"]),
  tyreCondition: z.enum(["POOR", "FAIR", "GOOD", "EXCELLENT"]),
  mileage: z.string().optional(),
  existingDamage: z.string().optional(),
  customerAgreed: z.boolean().default(false),
  photos: z.array(z.object({
    base64: z.string(),
    caption: z.string().optional(),
    photoType: z.enum(["INTAKE", "PROGRESS", "COMPLETION"]).default("INTAKE"),
  })).optional().default([]),
})

// POST /api/intake — worker submits car intake
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = intakeSchema.parse(body)

    // Verify booking exists and is assigned to this worker
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (
      session.user.role === "WORKER" &&
      booking.assignedWorkerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Not your job" }, { status: 403 })
    }

    // Upload photos to Cloudinary
    const uploadedPhotos: { url: string; publicId: string; caption?: string; photoType: string }[] = []

    for (const photo of data.photos) {
      try {
        const result = await uploadImage(photo.base64, "intake")
        uploadedPhotos.push({
          url: result.url,
          publicId: result.publicId,
          caption: photo.caption,
          photoType: photo.photoType,
        })
      } catch (photoErr) {
        console.error("[INTAKE] Photo upload failed:", photoErr)
        // Continue — don't fail entire intake for one photo
      }
    }

    // Create intake record
    const intake = await prisma.jobIntake.create({
      data: {
        bookingId: data.bookingId,
        workerId: session.user.id,
        fuelLevel: data.fuelLevel,
        engineOilLevel: data.engineOilLevel,
        coolantLevel: data.coolantLevel,
        tyreCondition: data.tyreCondition,
        mileage: data.mileage,
        existingDamage: data.existingDamage,
        customerAgreed: data.customerAgreed,
        photos: {
          create: uploadedPhotos.map((p) => ({
            url: p.url,
            publicId: p.publicId,
            caption: p.caption,
            photoType: p.photoType as any,
          })),
        },
      },
      include: { photos: true },
    })

    // Auto-advance booking to CAR_RECEIVED
    await prisma.booking.update({
      where: { id: data.bookingId },
      data: {
        stage: "CAR_RECEIVED",
        stageHistory: {
          create: {
            stage: "CAR_RECEIVED",
            note: "Car checked in by worker",
            changedBy: session.user.name,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: intake }, { status: 201 })
  } catch (err: any) {
    console.error("[INTAKE CREATE]", err)
    if (err.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Invalid data", details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to save intake" }, { status: 500 })
  }
}

// GET /api/intake?bookingId=xxx
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const bookingId = new URL(req.url).searchParams.get("bookingId")
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 })

  const intake = await prisma.jobIntake.findUnique({
    where: { bookingId },
    include: {
      photos: { orderBy: { takenAt: "asc" } },
      worker: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ success: true, data: intake })
}
