"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Wrench, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: "#e63c1e", borderRadius: 14,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16, boxShadow: "0 0 40px rgba(230,60,30,0.3)",
          }}>
            <Wrench size={24} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>
            Refinish PHC
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#444" }}>Staff Portal</p>
        </div>

        <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 14, padding: "32px" }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 600, color: "#fff" }}>Sign in</h2>

          {error && (
            <div style={{
              background: "#1a0808", border: "1px solid #e63c1e44",
              borderRadius: 8, padding: "10px 14px", marginBottom: 20,
              fontSize: 13, color: "#e63c1e",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Email address</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
                placeholder="you@refinishphc.com"
                style={{
                  width: "100%", background: "#141414", border: "1px solid #222",
                  borderRadius: 8, padding: "11px 14px", color: "#fff",
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: "100%", background: "#141414", border: "1px solid #222",
                    borderRadius: 8, padding: "11px 44px 11px 14px", color: "#fff",
                    fontSize: 14, outline: "none", boxSizing: "border-box",
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#444", cursor: "pointer", padding: 0,
                  }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", background: loading ? "#8a2410" : "#e63c1e",
              color: "#fff", border: "none", borderRadius: 8,
              padding: "13px", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5,
            }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#2a2a2a" }}>
          Built by <a href="https://jktl.com.ng" style={{ color: "#333", textDecoration: "none" }}>JK Technology Limited</a>
        </p>
      </div>
    </div>
  )
}
