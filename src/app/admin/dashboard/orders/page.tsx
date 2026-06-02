// src/app/admin/dashboard/orders/page.tsx
import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/paystack"
import Link from "next/link"
import { ShoppingBag, ChevronRight } from "lucide-react"
import OrderStatusBadge from "@/components/admin/OrderStatusBadge"

type Props = {
  searchParams: Promise<{ search?: string; status?: string; fulfilment?: string }>
}

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams

  const where: any = {}
  if (params.search) {
    where.OR = [
      { customerName: { contains: params.search, mode: "insensitive" } },
      { customerEmail: { contains: params.search, mode: "insensitive" } },
      { reference: { contains: params.search, mode: "insensitive" } },
    ]
  }
  if (params.status) where.status = params.status
  if (params.fulfilment) where.fulfilmentStatus = params.fulfilment

  const orders = await prisma.order.findMany({
    where, orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
  })

  const [totalRevenue, todayRevenue, pending] = await Promise.all([
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.order.aggregate({
      where: { status: "PAID", paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { fulfilmentStatus: "UNFULFILLED", status: "PAID" } }),
  ])

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>Shop Orders</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{orders.length} orders</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Revenue", value: formatNaira(totalRevenue._sum.total || 0), color: "#00c896" },
          { label: "Today's Revenue", value: formatNaira(todayRevenue._sum.total || 0), color: "#4a9eff" },
          { label: "Awaiting Fulfilment", value: pending, color: "#f5a623" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#0f0f0f", border: "1px solid #1c1c1c",
            borderRadius: 10, padding: "14px 20px",
          }}>
            <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#555" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input name="search" defaultValue={params.search} placeholder="Search by name, email, reference..."
          style={{
            flex: 1, minWidth: 220, background: "#0f0f0f",
            border: "1px solid #1c1c1c", borderRadius: 8,
            padding: "9px 14px", color: "#fff", fontSize: 13, outline: "none",
          }} />
        <select name="status" defaultValue={params.status || ""}
          style={{
            background: "#0f0f0f", border: "1px solid #1c1c1c",
            borderRadius: 8, padding: "9px 14px",
            color: "#fff", fontSize: 13, outline: "none",
          }}>
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select name="fulfilment" defaultValue={params.fulfilment || ""}
          style={{
            background: "#0f0f0f", border: "1px solid #1c1c1c",
            borderRadius: 8, padding: "9px 14px",
            color: "#fff", fontSize: 13, outline: "none",
          }}>
          <option value="">All Fulfilment</option>
          <option value="UNFULFILLED">Unfulfilled</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
        </select>
        <button type="submit" style={{
          background: "#1a1a1a", border: "1px solid #222",
          borderRadius: 8, padding: "9px 18px",
          color: "#888", fontSize: 13, cursor: "pointer",
        }}>Filter</button>
      </form>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
          <ShoppingBag size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 15, color: "#666" }}>No orders found</p>
        </div>
      ) : (
        <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 140px 100px 120px 100px 40px",
            padding: "12px 20px", borderBottom: "1px solid #141414",
            fontSize: 11, color: "#444", letterSpacing: 1, textTransform: "uppercase",
          }}>
            <span>Customer</span>
            <span>Reference</span>
            <span>Total</span>
            <span>Payment</span>
            <span>Fulfilment</span>
            <span></span>
          </div>

          {orders.map((order, i) => (
            <Link key={order.id} href={`/admin/dashboard/orders/${order.id}`}
              style={{
                display: "grid", gridTemplateColumns: "1fr 140px 100px 120px 100px 40px",
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < orders.length - 1 ? "1px solid #111" : "none",
                textDecoration: "none", transition: "background 0.1s",
              }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#ddd" }}>{order.customerName}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>
                  {order.customerEmail} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#444" }}>
                  {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#e63c1e", fontWeight: 600, fontFamily: "monospace" }}>
                #{order.reference.slice(-8).toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {formatNaira(order.total)}
              </p>
              <OrderStatusBadge status={order.status} />
              <OrderStatusBadge status={order.fulfilmentStatus} type="fulfilment" />
              <ChevronRight size={14} color="#333" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
