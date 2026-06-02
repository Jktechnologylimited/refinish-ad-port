// src/app/admin/dashboard/workers/page.tsx
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AddWorkerForm from "@/components/admin/AddWorkerForm"
import WorkerCard from "@/components/admin/WorkerCard"
import { UserCog } from "lucide-react"

export default async function WorkersPage() {
  const session = await auth()
  if (session?.user.role !== "OWNER") redirect("/admin/dashboard")

  const workers = await prisma.user.findMany({
    where: { role: { in: ["WORKER", "MANAGER"] } },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, isActive: true, createdAt: true,
      assignedBookings: {
        where: { stage: { notIn: ["COMPLETED", "CANCELLED"] } },
        select: { id: true, stage: true, customerName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>Workers & Staff</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
          {workers.filter((w) => w.isActive).length} active staff members
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "flex-start" }}>
        {/* Workers list */}
        <div>
          {workers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
              <UserCog size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 15, color: "#666" }}>No workers added yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {workers.map((worker) => (
                <WorkerCard key={worker.id} worker={worker as any} />
              ))}
            </div>
          )}
        </div>

        {/* Add worker form */}
        <div style={{ position: "sticky", top: 84 }}>
          <AddWorkerForm />
        </div>
      </div>
    </div>
  )
}
