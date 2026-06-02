// src/app/admin/dashboard/customers/page.tsx
import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/paystack"
import Link from "next/link"
import { Users, ChevronRight } from "lucide-react"

type Props = {
  searchParams: Promise<{ search?: string }>
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams

  const where: any = {}
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
      { carPlate: { contains: params.search, mode: "insensitive" } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where, orderBy: { totalSpend: "desc" },
    include: { _count: { select: { bookings: true, orders: true } } },
  })

  const totalCustomers = await prisma.customer.count()
  const totalSpend = await prisma.customer.aggregate({ _sum: { totalSpend: true } })
  const newThisMonth = await prisma.customer.count({
    where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
  })

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>Customers</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{totalCustomers} total customers</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Customers", value: totalCustomers, color: "#4a9eff" },
          { label: "New This Month", value: newThisMonth, color: "#00c896" },
          { label: "Total Lifetime Value", value: formatNaira(totalSpend._sum.totalSpend || 0), color: "#e63c1e" },
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

      {/* Search */}
      <form method="GET" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input name="search" defaultValue={params.search}
          placeholder="Search by name, email, phone, plate..."
          style={{
            flex: 1, background: "#0f0f0f", border: "1px solid #1c1c1c",
            borderRadius: 8, padding: "9px 14px", color: "#fff",
            fontSize: 13, outline: "none",
          }} />
        <button type="submit" style={{
          background: "#1a1a1a", border: "1px solid #222",
          borderRadius: 8, padding: "9px 18px",
          color: "#888", fontSize: 13, cursor: "pointer",
        }}>Search</button>
        {params.search && (
          <Link href="/admin/dashboard/customers" style={{
            padding: "9px 14px", fontSize: 13, color: "#555",
            textDecoration: "none", alignSelf: "center",
          }}>Clear</Link>
        )}
      </form>

      {/* Customers list */}
      {customers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
          <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 15, color: "#666" }}>No customers found</p>
        </div>
      ) : (
        <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 140px 80px 80px 100px 40px",
            padding: "12px 20px", borderBottom: "1px solid #141414",
            fontSize: 11, color: "#444", letterSpacing: 1, textTransform: "uppercase",
          }}>
            <span>Customer</span>
            <span>Vehicle</span>
            <span>Bookings</span>
            <span>Orders</span>
            <span>Total Spend</span>
            <span></span>
          </div>

          {customers.map((customer, i) => (
            <Link key={customer.id} href={`/admin/dashboard/customers/${customer.id}`}
              style={{
                display: "grid", gridTemplateColumns: "1fr 140px 80px 80px 100px 40px",
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < customers.length - 1 ? "1px solid #111" : "none",
                textDecoration: "none", transition: "background 0.1s",
              }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#ddd" }}>{customer.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>{customer.phone}</p>
                {customer.email && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#444" }}>{customer.email}</p>}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                {customer.carMake && customer.carModel
                  ? `${customer.carMake} ${customer.carModel}`
                  : customer.carPlate || "—"}
              </p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#4a9eff" }}>
                {customer._count.bookings}
              </p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#9b59b6" }}>
                {customer._count.orders}
              </p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#00c896" }}>
                {formatNaira(customer.totalSpend)}
              </p>
              <ChevronRight size={14} color="#333" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
