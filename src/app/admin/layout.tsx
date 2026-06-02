// src/app/admin/layout.tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"
import ServiceWorkerProvider from "@/components/ui/ServiceWorkerProvider"
import { Toaster } from "react-hot-toast"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role === "WORKER") redirect("/worker/jobs")

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808" }}>
      <AdminSidebar user={session.user} />
      <main style={{ flex: 1, marginLeft: 240, minHeight: "100vh", background: "#080808" }}>
        {children}
      </main>
      <ServiceWorkerProvider />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#111", color: "#f0f0f0", border: "1px solid #222", borderRadius: 8, fontSize: 13 },
          success: { iconTheme: { primary: "#00c896", secondary: "#111" } },
          error: { iconTheme: { primary: "#e63c1e", secondary: "#111" } },
        }}
      />
    </div>
  )
}
