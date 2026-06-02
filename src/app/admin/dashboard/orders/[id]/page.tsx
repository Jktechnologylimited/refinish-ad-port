// src/app/admin/dashboard/orders/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatNaira } from "@/lib/paystack"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import OrderStatusBadge from "@/components/admin/OrderStatusBadge"
import OrderFulfilmentActions from "@/components/admin/OrderFulfilmentActions"

type Props = { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, name: true, images: true, slug: true } } } },
      customer: true,
    },
  })
  if (!order) notFound()

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      <Link href="/admin/dashboard/orders" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#555", textDecoration: "none", marginBottom: 24,
      }}>
        <ChevronLeft size={14} /> Orders
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>
              #{order.reference.slice(-8).toUpperCase()}
            </h1>
            <OrderStatusBadge status={order.status} />
            <OrderStatusBadge status={order.fulfilmentStatus} type="fulfilment" />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
            {new Date(order.createdAt).toLocaleString("en-NG")}
            {order.paystackChannel && ` · Paid via ${order.paystackChannel}`}
          </p>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>
          {formatNaira(order.total)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Items */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #141414" }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
                Items ({order.items.length})
              </h3>
            </div>
            {order.items.map((item) => (
              <div key={item.id} style={{
                display: "flex", gap: 14, alignItems: "center",
                padding: "14px 20px", borderBottom: "1px solid #111",
              }}>
                <div style={{ width: 50, height: 50, background: "#141414", borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0 }}>
                  {item.product.images?.[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.name} fill style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.2 }}>🚗</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#ddd" }}>{item.product.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#555" }}>
                    {formatNaira(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  {formatNaira(item.total)}
                </p>
              </div>
            ))}
            <div style={{ padding: "14px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 6 }}>
                <span>Subtotal</span><span>{formatNaira(order.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 10 }}>
                <span>Shipping</span>
                <span style={{ color: order.shipping === 0 ? "#00c896" : "#ccc" }}>
                  {order.shipping === 0 ? "Free" : formatNaira(order.shipping)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "#fff", borderTop: "1px solid #1a1a1a", paddingTop: 10 }}>
                <span>Total</span>
                <span style={{ color: "#e63c1e" }}>{formatNaira(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>Customer</h3>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#ddd" }}>{order.customerName}</p>
            <a href={`mailto:${order.customerEmail}`} style={{ display: "block", fontSize: 13, color: "#e63c1e", textDecoration: "none", marginBottom: 4 }}>{order.customerEmail}</a>
            {order.customerPhone && <p style={{ margin: "0 0 10px", fontSize: 13, color: "#666" }}>{order.customerPhone}</p>}
            {order.address && (
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                {[order.address, order.city, order.state].filter(Boolean).join(", ")}
              </p>
            )}
            {order.customer && (
              <Link href={`/admin/dashboard/customers/${order.customer.id}`}
                style={{ display: "inline-block", marginTop: 10, fontSize: 12, color: "#e63c1e", textDecoration: "none" }}>
                View CRM profile →
              </Link>
            )}
          </div>
        </div>

        {/* Fulfilment actions */}
        <OrderFulfilmentActions
          orderId={order.id}
          currentStatus={order.fulfilmentStatus}
          trackingNumber={order.trackingNumber || ""}
          notes={order.notes || ""}
        />
      </div>
    </div>
  )
}
