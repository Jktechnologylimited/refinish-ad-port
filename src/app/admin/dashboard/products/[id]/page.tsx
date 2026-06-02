// src/app/admin/dashboard/products/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import ProductForm from "@/components/admin/ProductForm"

type Props = { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      <Link href="/admin/dashboard/products" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#555", textDecoration: "none", marginBottom: 24,
      }}>
        <ChevronLeft size={14} /> Products
      </Link>
      <h1 style={{ margin: "0 0 28px", fontSize: 22, fontWeight: 700, color: "#fff" }}>
        Edit Product
      </h1>
      <ProductForm
        mode="edit"
        initialData={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          price: product.price,
          comparePrice: product.comparePrice || undefined,
          stock: product.stock,
          sku: product.sku || "",
          category: product.category,
          images: product.images,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          weight: product.weight || undefined,
        }}
      />
    </div>
  )
}
