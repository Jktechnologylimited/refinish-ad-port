"use client"
// src/components/worker/WorkerNav.tsx

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Briefcase, LayoutDashboard, LogOut } from "lucide-react"
import type { Role } from "@prisma/client"

export default function WorkerNav({ role, userName }: { role: Role; userName: string }) {
  const pathname = usePathname()

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(10,10,10,0.95)",
      backdropFilter: "blur(12px)",
      borderTop: "1px solid #1a1a1a",
      display: "flex", alignItems: "center",
      height: 64, padding: "0 8px",
      zIndex: 100,
    }}>
      <Link href="/worker/jobs" style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 4,
        textDecoration: "none",
        color: pathname.startsWith("/worker/jobs") ? "#e63c1e" : "#444",
        padding: "8px 0",
      }}>
        <Briefcase size={22} />
        <span style={{ fontSize: 10, letterSpacing: 0.5 }}>My Jobs</span>
      </Link>

      {(role === "OWNER" || role === "MANAGER") && (
        <Link href="/admin/dashboard" style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4,
          textDecoration: "none", color: "#444", padding: "8px 0",
        }}>
          <LayoutDashboard size={22} />
          <span style={{ fontSize: 10, letterSpacing: 0.5 }}>Dashboard</span>
        </Link>
      )}

      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4,
          background: "none", border: "none",
          color: "#444", cursor: "pointer", padding: "8px 0",
        }}
      >
        <LogOut size={22} />
        <span style={{ fontSize: 10, letterSpacing: 0.5 }}>Sign Out</span>
      </button>
    </nav>
  )
}
