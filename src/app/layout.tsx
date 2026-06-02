// src/app/layout.tsx
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Refinish PHC — Premium Auto Detailing",
    template: "%s | Refinish PHC",
  },
  description:
    "Port Harcourt's premier auto detailing, ceramic coating, chrome delete, and car painting specialists.",
  keywords: ["auto detailing", "car detailing", "Port Harcourt", "ceramic coating", "chrome delete"],
  authors: [{ name: "JK Technology Limited", url: "https://jktl.com.ng" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AutoOps",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Refinish PHC",
  },
}

export const viewport: Viewport = {
  themeColor: "#e63c1e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  )
}
