// src/app/worker/jobs/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import WorkerJobList from "@/components/worker/WorkerJobList"

async function getWorkerJobs(workerId: string) {
  return prisma.booking.findMany({
    where: {
      assignedWorkerId: workerId,
      stage: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    orderBy: { scheduledDate: "asc" },
    include: { intake: { select: { id: true } } },
  })
}

export default async function WorkerJobsPage() {
  const session = await auth()
  if (!session) redirect("/admin/login")

  const jobs = await getWorkerJobs(session.user.id)

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{
        padding: "24px 20px 16px",
        borderBottom: "1px solid #1a1a1a",
        background: "#080808",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#e63c1e",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 900, color: "#fff",
          }}>R</div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>My Jobs</p>
            <p style={{ margin: 0, fontSize: 10, color: "#555" }}>
              {session.user.name} · Refinish PHC
            </p>
          </div>
        </div>
      </div>
      <WorkerJobList initialJobs={jobs as any} workerId={session.user.id} />
    </div>
  )
}
