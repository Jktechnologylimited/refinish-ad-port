"use client"
// src/components/admin/AdminSidebar.tsx

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { Role } from "@prisma/client"
import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  Package,
  Users,
  UserCog,
  Settings,
  LogOut,
  Wrench,
  BarChart3,
} from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  roles: Role[]
  badge?: number
}

const NAV: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/admin/dashboard/bookings",
    label: "Bookings",
    icon: <CalendarCheck size={18} />,
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/admin/dashboard/orders",
    label: "Shop Orders",
    icon: <ShoppingBag size={18} />,
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/admin/dashboard/products",
    label: "Products",
    icon: <Package size={18} />,
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/admin/dashboard/customers",
    label: "Customers",
    icon: <Users size={18} />,
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/admin/dashboard/workers",
    label: "Workers",
    icon: <UserCog size={18} />,
    roles: ["OWNER"],
  },
  {
    href: "/admin/dashboard/analytics",
    label: "Analytics",
    icon: <BarChart3 size={18} />,
    roles: ["OWNER"],
  },
  {
    href: "/admin/dashboard/settings",
    label: "Settings",
    icon: <Settings size={18} />,
    roles: ["OWNER"],
  },
]

type Props = {
  user: { name: string; email: string; role: Role; avatar?: string | null }
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()

  const visibleNav = NAV.filter((item) => item.roles.includes(user.role))

  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: "#0a0a0a",
        borderRight: "1px solid #1a1a1a",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "#e63c1e",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wrench size={16} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 0.5,
              }}
            >
              Refinish PHC
            </div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>
              ADMIN
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        {visibleNav.map((item) => {
          const isActive =
            item.href === "/admin/dashboard"
              ? pathname === "/admin/dashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#fff" : "#555",
                background: isActive ? "#1a1a1a" : "transparent",
                borderLeft: isActive
                  ? "2px solid #e63c1e"
                  : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <span style={{ color: isActive ? "#e63c1e" : "#444" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + sign out */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #1a1a1a",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>
            {user.name}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#e63c1e",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {user.role}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "1px solid #1a1a1a",
            borderRadius: 6,
            padding: "7px 12px",
            color: "#555",
            cursor: "pointer",
            fontSize: 12,
            width: "100%",
            transition: "all 0.15s",
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
        <div style={{ marginTop: 12, fontSize: 10, color: "#2a2a2a", textAlign: "center" }}>
          Built by{" "}
          <a href="https://jktl.com.ng" style={{ color: "#333", textDecoration: "none" }}>
            JKTL
          </a>
        </div>
      </div>
    </aside>
  )
}
