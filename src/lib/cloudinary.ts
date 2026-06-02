// src/lib/cloudinary.ts
// Cloudinary image upload helpers for product + intake photos

import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

// ── Upload a single image ────────────────────────────────────────────
export async function uploadImage(
  file: string, // base64 or URL
  folder: "products" | "intake" | "completion" | "progress" | "avatars",
  options?: { publicId?: string }
) {
  const result = await cloudinary.uploader.upload(file, {
    folder: `autoops/${folder}`,
    public_id: options?.publicId,
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      ...(folder === "products"
        ? [{ width: 800, height: 800, crop: "limit" }]
        : [{ width: 1200, height: 900, crop: "limit" }]),
    ],
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  }
}

// ── Delete an image ──────────────────────────────────────────────────
export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId)
}

// ── Generate signed upload URL for client-side uploads ───────────────
export function generateSignedUploadUrl(folder: string) {
  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: `autoops/${folder}` },
    process.env.CLOUDINARY_API_SECRET!
  )
  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder: `autoops/${folder}`,
  }
}

export default cloudinary
