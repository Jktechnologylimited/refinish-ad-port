import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC = ["/login", "/offline", "/api/auth", "/api/bookings", "/api/paystack", "/api/products", "/api/orders", "/api/intake", "/sw.js", "/manifest.json", "/icons", "/favicon.ico", "/_next"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff2?|ttf|eot)$/)) return NextResponse.next()

  const token =
    await getToken({ req, secret: process.env.NEXTAUTH_SECRET!, cookieName: "next-auth.session-token" }) ||
    await getToken({ req, secret: process.env.NEXTAUTH_SECRET!, cookieName: "__Secure-next-auth.session-token" }) ||
    await getToken({ req, secret: process.env.AUTH_SECRET!, cookieName: "authjs.session-token" }) ||
    await getToken({ req, secret: process.env.AUTH_SECRET!, cookieName: "__Secure-authjs.session-token" })

  if (!token) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url))
  }

  const role = token.role as string

  if (pathname === "/") {
    return NextResponse.redirect(new URL(role === "WORKER" ? "/worker/jobs" : "/admin/dashboard", req.url))
  }

  if (pathname.startsWith("/admin/dashboard") && role === "WORKER") {
    return NextResponse.redirect(new URL("/worker/jobs", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
