// src/components/admin/OrderStatusBadge.tsx
// Works for both payment status and fulfilment status

const PAYMENT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PAID:      { bg: "#00c89622", color: "#00c896", label: "Paid" },
  PENDING:   { bg: "#f5a62322", color: "#f5a623", label: "Pending" },
  FAILED:    { bg: "#e63c1e22", color: "#e63c1e", label: "Failed" },
  REFUNDED:  { bg: "#9b59b622", color: "#9b59b6", label: "Refunded" },
  CANCELLED: { bg: "#1a1a1a",   color: "#555",    label: "Cancelled" },
}

const FULFILMENT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  UNFULFILLED: { bg: "#e63c1e22", color: "#e63c1e", label: "Unfulfilled" },
  PROCESSING:  { bg: "#f5a62322", color: "#f5a623", label: "Processing" },
  SHIPPED:     { bg: "#4a9eff22", color: "#4a9eff", label: "Shipped" },
  DELIVERED:   { bg: "#00c89622", color: "#00c896", label: "Delivered" },
}

export default function OrderStatusBadge({
  status,
  type = "payment",
}: {
  status: string
  type?: "payment" | "fulfilment"
}) {
  const map = type === "payment" ? PAYMENT_COLORS : FULFILMENT_COLORS
  const config = map[status] || { bg: "#1a1a1a", color: "#555", label: status }

  return (
    <span style={{
      display: "inline-block",
      fontSize: 10, fontWeight: 600,
      padding: "3px 8px", borderRadius: 4,
      background: config.bg, color: config.color,
      letterSpacing: 0.5, textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {config.label}
    </span>
  )
}
