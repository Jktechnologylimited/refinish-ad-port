// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadImage } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { base64, folder = "products" } = body

    if (!base64) {
      return NextResponse.json({ error: "No image data" }, { status: 400 })
    }

    const result = await uploadImage(base64, folder as any)
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    console.error("[UPLOAD]", err)
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 })
  }
}
