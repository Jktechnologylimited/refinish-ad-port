// src/app/admin/dashboard/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/paystack"
import { 
  CalendarCheck, ShoppingBag, Users, 
  Package, TrendingUp, Clock, AlertTriangle
} from "lucide-react"
import Link from "next/link"

async function getStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalBookings, todayBookings, activeBookings,
    totalOrders, todayOrders, totalRevenue, todayRevenue,
    totalCustomers, newCustomers,
    totalProducts, lowStockProducts,
    recentBookings,
  ] = await Promise.all([
    prisma.booking.count({ where: { stage: { not: "CANCELLED" } } }),
    prisma.booking.count({ where: { createdAt: { gte: today } } }),
    prisma.booking.count({ where: { stage: { in: ["BOOKED", "CAR_RECEIVED", "IN_PROGRESS", "QUALITY_CHECK"] } } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PAID", paidAt: { gte: today } } }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: "PAID", paidAt: { gte: today } }, _sum: { total: true } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: 5, gt: 0 } } }),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { assignedWorker: { select: { name: true } } },
    }),
  ])

  return {
    bookings: { total: totalBookings, today: todayBookings, active: activeBookings },
    orders: {
      total: totalOrders, today: todayOrders,
      revenue: totalRevenue._sum.total || 0,
      todayRevenue: todayRevenue._sum.total || 0,
    },
    customers: { total: totalCustomers, new: newCustomers },
    products: { total: totalProducts, lowStock: lowStockProducts },
    recentBookings,
  }
}

const STAGE_COLORS: Record<string, string> = {
  BOOKED: "#4a9eff",
  CAR_RECEIVED: "#f5a623",
  IN_PROGRESS: "#9b59b6",
  QUALITY_CHECK: "#e67e22",
  COMPLETED: "#00c896",
  CANCELLED: "#555",
}

const STAGE_LABELS: Record<string, string> = {
  BOOKED: "Booked",
  CAR_RECEIVED: "Car Received",
  IN_PROGRESS: "In Progress",
  QUALITY_CHECK: "Quality Check",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export default async function DashboardPage() {
  const session = await auth()
  const stats = await getStats()

  const statCards = [
    {
      label: "Active Bookings",
      value: stats.bookings.active,
      sub: `${stats.bookings.today} today`,
      icon: <CalendarCheck size={20} />,
      color: "#4a9eff",
      href: "/admin/dashboard/bookings",
    },
    {
      label: "Total Revenue",
      value: formatNaira(stats.orders.revenue),
      sub: `${formatNaira(stats.orders.todayRevenue)} today`,
      icon: <TrendingUp size={20} />,
      color: "#00c896",
      href: "/admin/dashboard/orders",
      ownerOnly: true,
    },
    {
      label: "Shop Orders",
      value: stats.orders.total,
      sub: `${stats.orders.today} today`,
      icon: <ShoppingBag size={20} />,
      color: "#e67e22",
      href: "/admin/dashboard/orders",
    },
    {
      label: "Customers",
      value: stats.customers.total,
      sub: `+${stats.customers.new} this month`,
      icon: <Users size={20} />,
      color: "#9b59b6",
      href: "/admin/dashboard/customers",
    },
    {
      label: "Products",
      value: stats.products.total,
      sub: stats.products.lowStock > 0 ? `${stats.products.lowStock} low stock` : "All stocked",
      icon: <Package size={20} />,
      color: stats.products.lowStock > 0 ? "#f5a623" : "#555",
      href: "/admin/dashboard/products",
    },
  ]

  const visibleCards = statCards.filter(
    (c) => !c.ownerOnly || session?.user.role === "OWNER"
  )

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>
          Good {getGreeting()}, {session?.user.name?.split(" ")[0]}
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#555" }}>
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {visibleCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            style={{
              display: "block",
              background: "#0f0f0f",
              border: "1px solid #1c1c1c",
              borderRadius: 12,
              padding: "20px",
              textDecoration: "none",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.15s",
            }}
          >
            <div
              style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 2, background: card.color,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 12, color: "#555" }}>{card.label}</span>
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: "#444" }}>{card.sub}</div>
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1c1c1c",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #1a1a1a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>
            Recent Bookings
          </h2>
          <Link
            href="/admin/dashboard/bookings"
            style={{ fontSize: 12, color: "#e63c1e", textDecoration: "none" }}
          >
            View all →
          </Link>
        </div>

        <div>
          {stats.recentBookings.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "#444" }}>
              <Clock size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ margin: 0 }}>No bookings yet</p>
            </div>
          ) : (
            stats.recentBookings.map((booking, i) => (
              <Link
                key={booking.id}
                href={`/admin/dashboard/bookings/${booking.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 24px",
                  borderBottom: i < stats.recentBookings.length - 1 ? "1px solid #141414" : "none",
                  textDecoration: "none",
                  transition: "background 0.1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: STAGE_COLORS[booking.stage],
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, color: "#ddd", fontWeight: 500 }}>
                      {booking.customerName}
                    </div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                      {booking.carMake} {booking.carModel} · {booking.serviceName}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: STAGE_COLORS[booking.stage] + "22",
                      color: STAGE_COLORS[booking.stage],
                      border: `1px solid ${STAGE_COLORS[booking.stage]}44`,
                    }}
                  >
                    {STAGE_LABELS[booking.stage]}
                  </div>
                  <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                    {formatNaira(booking.servicePrice)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Low stock warning */}
      {stats.products.lowStock > 0 && (
        <div
          style={{
            marginTop: 16,
            background: "#1a1200",
            border: "1px solid #f5a62344",
            borderRadius: 10,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AlertTriangle size={18} color="#f5a623" />
          <span style={{ fontSize: 13, color: "#f5a623" }}>
            {stats.products.lowStock} product{stats.products.lowStock > 1 ? "s are" : " is"} running low on stock
          </span>
          <Link
            href="/admin/dashboard/products?filter=low-stock"
            style={{ fontSize: 12, color: "#f5a623", marginLeft: "auto", textDecoration: "underline" }}
          >
            View →
          </Link>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}
