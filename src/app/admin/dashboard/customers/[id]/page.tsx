// src/app/admin/dashboard/customers/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatNaira } from "@/lib/paystack"
import Link from "next/link"
import { ChevronLeft, Car, Phone, Mail, MapPin } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

const STAGE_COLORS: Record<string, string> = {
  BOOKED: "#4a9eff", CAR_RECEIVED: "#f5a623", IN_PROGRESS: "#9b59b6",
  QUALITY_CHECK: "#e67e22", COMPLETED: "#00c896", CANCELLED: "#555",
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, serviceName: true, servicePrice: true,
          stage: true, scheduledDate: true, createdAt: true,
          depositPaid: true, balancePaid: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, reference: true, total: true,
          status: true, createdAt: true,
          items: { select: { quantity: true, product: { select: { name: true } } } },
        },
      },
    },
  })
  if (!customer) notFound()

  const totalBookingValue = customer.bookings.reduce((s, b) => s + b.servicePrice, 0)

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      <Link href="/admin/dashboard/customers" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#555", textDecoration: "none", marginBottom: 24,
      }}>
        <ChevronLeft size={14} /> Customers
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#fff" }}>
          {customer.name}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
          Customer since {new Date(customer.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long" })}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Bookings history */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #141414", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
                Bookings ({customer.bookings.length})
              </h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4a9eff" }}>
                {formatNaira(totalBookingValue)}
              </span>
            </div>
            {customer.bookings.length === 0 ? (
              <p style={{ margin: 0, padding: "20px", fontSize: 13, color: "#444" }}>No bookings yet</p>
            ) : (
              customer.bookings.map((booking, i) => (
                <Link key={booking.id} href={`/admin/dashboard/bookings/${booking.id}`}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: i < customer.bookings.length - 1 ? "1px solid #111" : "none",
                    textDecoration: "none",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: STAGE_COLORS[booking.stage] || "#555", flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: "#ccc", fontWeight: 500 }}>{booking.serviceName}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>
                        {new Date(booking.scheduledDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {formatNaira(booking.servicePrice)}
                  </p>
                </Link>
              ))
            )}
          </div>

          {/* Orders history */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #141414", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
                Shop Orders ({customer.orders.length})
              </h3>
            </div>
            {customer.orders.length === 0 ? (
              <p style={{ margin: 0, padding: "20px", fontSize: 13, color: "#444" }}>No orders yet</p>
            ) : (
              customer.orders.map((order, i) => (
                <Link key={order.id} href={`/admin/dashboard/orders/${order.id}`}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: i < customer.orders.length - 1 ? "1px solid #111" : "none",
                    textDecoration: "none",
                  }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: "#ccc", fontWeight: 500 }}>
                      #{order.reference.slice(-8).toUpperCase()}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>
                      {order.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#444" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {formatNaira(order.total)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Sidebar — contact + vehicle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Lifetime value */}
          <div style={{
            background: "#0f0808", border: "1px solid #e63c1e22",
            borderRadius: 12, padding: "20px", textAlign: "center",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>
              Lifetime Value
            </p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#e63c1e" }}>
              {formatNaira(customer.totalSpend)}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>
              {customer.bookings.length} booking{customer.bookings.length !== 1 ? "s" : ""} · {customer.orders.length} order{customer.orders.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Contact */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>Contact</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <Phone size={13} color="#555" />
                <a href={`tel:${customer.phone}`} style={{ color: "#ccc", textDecoration: "none" }}>{customer.phone}</a>
              </div>
              {customer.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <Mail size={13} color="#555" />
                  <a href={`mailto:${customer.email}`} style={{ color: "#e63c1e", textDecoration: "none" }}>{customer.email}</a>
                </div>
              )}
              {customer.address && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                  <MapPin size={13} color="#555" style={{ marginTop: 2 }} />
                  <span style={{ color: "#666" }}>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle */}
          {(customer.carMake || customer.carPlate) && (
            <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Car size={13} color="#555" />
                <p style={{ margin: 0, fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>Vehicle</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ["Make", customer.carMake],
                  ["Model", customer.carModel],
                  ["Year", customer.carYear],
                  ["Colour", customer.carColour],
                  ["Plate", customer.carPlate],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#555" }}>{label}</span>
                    <span style={{ color: "#ccc" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>Notes</p>
              <p style={{ margin: 0, fontSize: 13, color: "#888", lineHeight: 1.6 }}>{customer.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
