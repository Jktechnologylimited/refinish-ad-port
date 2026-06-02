"use client"
// src/components/admin/AddWorkerForm.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { UserPlus } from "lucide-react"

const inputStyle = {
  width: "100%", background: "#141414",
  border: "1px solid #222", borderRadius: 8,
  padding: "10px 12px", color: "#fff",
  fontSize: 13, outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
}

export default function AddWorkerForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", role: "WORKER",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error("Fill in all required fields")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(`${form.role === "MANAGER" ? "Manager" : "Worker"} account created`)
      setForm({ name: "", email: "", password: "", phone: "", role: "WORKER" })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <UserPlus size={16} color="#e63c1e" />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>Add Staff Account</h3>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Full Name *</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)}
            required placeholder="e.g. Chukwuemeka Johnson" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Email *</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
            required placeholder="worker@refinishphc.com" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Phone</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)}
            placeholder="08012345678" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Role *</label>
          <select value={form.role} onChange={(e) => update("role", e.target.value)}
            style={{ ...inputStyle, appearance: "none" as any }}>
            <option value="WORKER">Worker / Technician</option>
            <option value="MANAGER">Manager</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>
            Temporary Password *
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required placeholder="Min 6 characters"
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                color: "#555", cursor: "pointer", fontSize: 11,
              }}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>
            Share this with the staff member — they can change it later
          </p>
        </div>

        <button type="submit" disabled={loading}
          style={{
            background: loading ? "#8a2410" : "#e63c1e",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "12px", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4,
          }}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  )
}
