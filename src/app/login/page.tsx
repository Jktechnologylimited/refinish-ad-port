import { Suspense } from "react"
import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", background: "#080808",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e63c1e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}