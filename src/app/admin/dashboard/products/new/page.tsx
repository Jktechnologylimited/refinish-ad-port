// src/app/admin/dashboard/products/new/page.tsx
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import ProductForm from "@/components/admin/ProductForm"

export default function NewProductPage() {
  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      <Link href="/admin/dashboard/products" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#555", textDecoration: "none", marginBottom: 24,
      }}>
        <ChevronLeft size={14} /> Products
      </Link>
      <h1 style={{ margin: "0 0 28px", fontSize: 22, fontWeight: 700, color: "#fff" }}>
        Add New Product
      </h1>
      <ProductForm mode="create" />
    </div>
  )
}
