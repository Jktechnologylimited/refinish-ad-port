"use client"
// src/components/admin/ProductActions.tsx
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"
import type { Role } from "@prisma/client"

export default function ProductActions({
  productId, isActive, userRole,
}: {
  productId: string; isActive: boolean; userRole: Role
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(isActive ? "Product hidden" : "Product visible")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct() {
    if (!confirm("Delete this product? This cannot be undone.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(data.message || "Product deleted")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
      <Link href={`/admin/dashboard/products/${productId}`} style={{
        width: 30, height: 30, borderRadius: 6,
        background: "#1a1a1a", border: "1px solid #222",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#666", textDecoration: "none",
      }}>
        <Edit size={13} />
      </Link>
      <button onClick={toggleActive} disabled={loading} style={{
        width: 30, height: 30, borderRadius: 6,
        background: "#1a1a1a", border: "1px solid #222",
        cursor: "pointer", color: "#666",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isActive ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      {userRole === "OWNER" && (
        <button onClick={deleteProduct} disabled={loading} style={{
          width: 30, height: 30, borderRadius: 6,
          background: "#1a0808", border: "1px solid #e63c1e22",
          cursor: "pointer", color: "#e63c1e",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}
