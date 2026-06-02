// src/app/api/admin/workers/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["WORKER", "MANAGER"]).default("WORKER"),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const users = await prisma.user.findMany({
    where: { role: { in: ["WORKER", "MANAGER"] } },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: users })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, phone: data.phone, role: data.role },
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
    })
    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}
