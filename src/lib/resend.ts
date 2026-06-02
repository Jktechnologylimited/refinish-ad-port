// src/lib/resend.ts
// All transactional emails for AutoOps

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`

// ── Base email layout ────────────────────────────────────────────────
function baseLayout(content: string, businessName = "Refinish PHC") {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#080808;font-family:'Helvetica Neue',Arial,sans-serif;color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#e63c1e;padding:28px 40px;">
            <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;">${businessName}</h1>
          </td>
        </tr>
        <tr><td style="padding:36px 40px;">${content}</td></tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1a1a1a;text-align:center;">
            <p style="margin:0;font-size:12px;color:#444;">
              Questions? <a href="mailto:${process.env.RESEND_FROM_EMAIL}" style="color:#e63c1e;text-decoration:none;">${process.env.RESEND_FROM_EMAIL}</a>
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:#333;">Port Harcourt, Rivers State, Nigeria</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Booking confirmation ─────────────────────────────────────────────
export async function sendBookingConfirmation({
  to,
  customerName,
  bookingRef,
  serviceName,
  scheduledDate,
  depositAmount,
  carDetails,
}: {
  to: string
  customerName: string
  bookingRef: string
  serviceName: string
  scheduledDate: string
  depositAmount: number
  carDetails: string
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#fff;">Booking Confirmed ✓</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hi ${customerName}, your booking has been received.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:24px;">
      <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #1a1a1a;width:40%;">Reference</td>
          <td style="padding:8px 0;color:#e63c1e;font-weight:600;border-bottom:1px solid #1a1a1a;">#${bookingRef.slice(-8).toUpperCase()}</td></tr>
      <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #1a1a1a;">Service</td>
          <td style="padding:8px 0;color:#fff;border-bottom:1px solid #1a1a1a;">${serviceName}</td></tr>
      <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #1a1a1a;">Vehicle</td>
          <td style="padding:8px 0;color:#fff;border-bottom:1px solid #1a1a1a;">${carDetails}</td></tr>
      <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #1a1a1a;">Date</td>
          <td style="padding:8px 0;color:#fff;border-bottom:1px solid #1a1a1a;">${scheduledDate}</td></tr>
      <tr><td style="padding:8px 0;color:#555;">Deposit Paid</td>
          <td style="padding:8px 0;color:#00c896;font-weight:600;">₦${depositAmount.toLocaleString()}</td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:#666;line-height:1.7;">
      We'll send you updates as your vehicle moves through our process.
      Please arrive at our Port Harcourt location at your scheduled time.
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Booking Confirmed #${bookingRef.slice(-8).toUpperCase()} — Refinish PHC`,
    html: baseLayout(content),
  })
}

// ── Order confirmation ───────────────────────────────────────────────
export async function sendOrderConfirmation({
  to,
  customerName,
  orderRef,
  items,
  total,
}: {
  to: string
  customerName: string
  orderRef: string
  items: { name: string; quantity: number; price: number }[]
  total: number
}) {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #1a1a1a;color:#ccc;font-size:13px;">${item.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1a1a1a;text-align:center;color:#888;font-size:13px;">x${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#ccc;font-size:13px;">₦${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`
    )
    .join("")

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#fff;">Order Confirmed ✓</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hi ${customerName}, thanks for your order.</p>
    <p style="margin:0 0 6px;font-size:11px;color:#555;letter-spacing:2px;text-transform:uppercase;">Order ID</p>
    <p style="margin:0 0 24px;font-size:14px;color:#e63c1e;font-weight:700;">#${orderRef.slice(-8).toUpperCase()}</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th style="text-align:left;padding-bottom:8px;color:#555;font-size:11px;font-weight:500;border-bottom:1px solid #222;letter-spacing:1px;text-transform:uppercase;">Item</th>
          <th style="text-align:center;padding-bottom:8px;color:#555;font-size:11px;font-weight:500;border-bottom:1px solid #222;letter-spacing:1px;text-transform:uppercase;">Qty</th>
          <th style="text-align:right;padding-bottom:8px;color:#555;font-size:11px;font-weight:500;border-bottom:1px solid #222;letter-spacing:1px;text-transform:uppercase;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top:16px;font-weight:700;color:#fff;font-size:14px;">Total</td>
          <td style="padding-top:16px;text-align:right;font-weight:700;font-size:18px;color:#e63c1e;">₦${total.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Order Confirmed #${orderRef.slice(-8).toUpperCase()} — Refinish PHC`,
    html: baseLayout(content),
  })
}

// ── Job completed notification ───────────────────────────────────────
export async function sendJobCompleted({
  to,
  customerName,
  bookingRef,
  serviceName,
  balanceDue,
}: {
  to: string
  customerName: string
  bookingRef: string
  serviceName: string
  balanceDue: number
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#fff;">Your Vehicle is Ready 🎉</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hi ${customerName}, your ${serviceName} is complete.</p>
    ${
      balanceDue > 0
        ? `<div style="background:#1a0a08;border:1px solid #e63c1e44;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#888;">Balance due on collection</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#e63c1e;">₦${balanceDue.toLocaleString()}</p>
      </div>`
        : `<div style="background:#0a1a0f;border:1px solid #00c89644;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#00c896;font-weight:600;">✓ Fully paid — nothing due on collection</p>
      </div>`
    }
    <p style="margin:0;font-size:13px;color:#666;">Reference: <strong style="color:#ccc;">#${bookingRef.slice(-8).toUpperCase()}</strong></p>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your Vehicle is Ready — Refinish PHC`,
    html: baseLayout(content),
  })
}

// ── Worker job assignment ────────────────────────────────────────────
export async function sendWorkerAssignment({
  to,
  workerName,
  bookingRef,
  serviceName,
  carDetails,
  scheduledDate,
}: {
  to: string
  workerName: string
  bookingRef: string
  serviceName: string
  carDetails: string
  scheduledDate: string
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#fff;">New Job Assigned</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hi ${workerName}, a job has been assigned to you.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
      <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #1a1a1a;width:40%;">Job Ref</td>
          <td style="padding:8px 0;color:#e63c1e;font-weight:600;border-bottom:1px solid #1a1a1a;">#${bookingRef.slice(-8).toUpperCase()}</td></tr>
      <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #1a1a1a;">Service</td>
          <td style="padding:8px 0;color:#fff;border-bottom:1px solid #1a1a1a;">${serviceName}</td></tr>
      <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #1a1a1a;">Vehicle</td>
          <td style="padding:8px 0;color:#fff;border-bottom:1px solid #1a1a1a;">${carDetails}</td></tr>
      <tr><td style="padding:8px 0;color:#555;">Scheduled</td>
          <td style="padding:8px 0;color:#fff;">${scheduledDate}</td></tr>
    </table>
    <br>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/worker/jobs" style="display:inline-block;background:#e63c1e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Job →</a>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `New Job Assigned — #${bookingRef.slice(-8).toUpperCase()}`,
    html: baseLayout(content),
  })
}
