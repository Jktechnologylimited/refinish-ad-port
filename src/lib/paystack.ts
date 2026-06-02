// src/lib/paystack.ts
// Paystack integration helpers

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE = "https://api.paystack.co"

type PaystackHeaders = {
  Authorization: string
  "Content-Type": string
}

function headers(): PaystackHeaders {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  }
}

// ── Initialize a transaction ─────────────────────────────────────────
export async function initializeTransaction({
  email,
  amount, // in Naira — we convert to kobo
  reference,
  metadata,
  callbackUrl,
}: {
  email: string
  amount: number
  reference: string
  metadata?: Record<string, unknown>
  callbackUrl?: string
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // kobo
      reference,
      metadata,
      callback_url:
        callbackUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/verify`,
    }),
  })

  const data = await res.json()
  if (!data.status) throw new Error(data.message || "Paystack init failed")
  return data.data as { authorization_url: string; access_code: string; reference: string }
}

// ── Verify a transaction ─────────────────────────────────────────────
export async function verifyTransaction(reference: string) {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: headers() }
  )
  const data = await res.json()
  if (!data.status) throw new Error(data.message || "Verification failed")
  return data.data as {
    status: "success" | "failed" | "abandoned"
    amount: number // in kobo
    reference: string
    channel: string
    paid_at: string
    customer: { email: string; name: string }
    metadata: Record<string, unknown>
  }
}

// ── Validate webhook signature ───────────────────────────────────────
import crypto from "crypto"

export function validateWebhookSignature(
  body: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(body)
    .digest("hex")
  return hash === signature
}

// ── Format amount from kobo to Naira ────────────────────────────────
export function fromKobo(kobo: number): number {
  return kobo / 100
}

// ── Format Naira for display ─────────────────────────────────────────
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}
