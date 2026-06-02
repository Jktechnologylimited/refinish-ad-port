// src/app/worker/layout.tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import WorkerNav from "@/components/worker/WorkerNav"
import ServiceWorkerProvider from "@/components/ui/ServiceWorkerProvider"

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div style={{ background: "#080808", minHeight: "100vh", paddingBottom: 72 }}>
      <main>{children}</main>
      <WorkerNav role={session.user.role} userName={session.user.name} />
      <ServiceWorkerProvider />
    </div>
  )
}
