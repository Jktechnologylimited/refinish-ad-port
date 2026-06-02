// src/app/admin/dashboard/products/page.tsx
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { formatNaira } from "@/lib/paystack"
import Link from "next/link"
import Image from "next/image"
import { Plus, Package, AlertTriangle, Edit, Eye, EyeOff } from "lucide-react"
import ProductActions from "@/components/admin/ProductActions"

type Props = {
  searchParams: Promise<{ search?: string; filter?: string; category?: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  WAX_AND_POLISH: "Wax & Polish", INTERIOR_CARE: "Interior Care",
  EXTERIOR_CARE: "Exterior Care", PAINT_PROTECTION: "Paint Protection",
  MICROFIBRE_AND_TOOLS: "Tools & Cloths", TYRE_CARE: "Tyre Care",
  GLASS_CARE: "Glass Care", FRAGRANCE: "Fragrance",
  KITS_AND_BUNDLES: "Kits & Bundles", OTHER: "Other",
}

export default async function ProductsPage({ searchParams }: Props) {
  const session = await auth()
  const params = await searchParams

  const where: any = { isActive: params.filter === "inactive" ? false : undefined }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { sku: { contains: params.search, mode: "insensitive" } },
    ]
  }
  if (params.category) where.category = params.category
  if (params.filter === "low-stock") { where.stock = { lte: 5, gt: 0 }; delete where.isActive }
  if (params.filter === "out-of-stock") { where.stock = 0; delete where.isActive }

  const products = await prisma.product.findMany({
    where, orderBy: { createdAt: "desc" },
  })

  const [total, lowStock, outOfStock] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: 5, gt: 0 } } }),
    prisma.product.count({ where: { isActive: true, stock: 0 } }),
  ])

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>Products</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{total} active products</p>
        </div>
        <Link href="/admin/dashboard/products/new" style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#e63c1e", color: "#fff",
          padding: "10px 18px", borderRadius: 8,
          textDecoration: "none", fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Active", value: total, color: "#4a9eff", filter: "" },
          { label: "Low Stock", value: lowStock, color: "#f5a623", filter: "low-stock" },
          { label: "Out of Stock", value: outOfStock, color: "#e63c1e", filter: "out-of-stock" },
        ].map((s) => (
          <Link key={s.filter} href={`/admin/dashboard/products?filter=${s.filter}`} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#0f0f0f", border: `1px solid ${params.filter === s.filter ? s.color : "#1c1c1c"}`,
            borderRadius: 10, padding: "12px 18px", textDecoration: "none",
            transition: "border-color 0.15s",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#555" }}>{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Search + filter */}
      <form method="GET" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input name="search" defaultValue={params.search} placeholder="Search products..."
          style={{
            flex: 1, minWidth: 200, background: "#0f0f0f",
            border: "1px solid #1c1c1c", borderRadius: 8,
            padding: "9px 14px", color: "#fff", fontSize: 13, outline: "none",
          }} />
        <select name="category" defaultValue={params.category || ""}
          style={{
            background: "#0f0f0f", border: "1px solid #1c1c1c",
            borderRadius: 8, padding: "9px 14px",
            color: params.category ? "#fff" : "#555", fontSize: 13, outline: "none",
          }}>
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" style={{
          background: "#1a1a1a", border: "1px solid #222",
          borderRadius: 8, padding: "9px 18px",
          color: "#888", fontSize: 13, cursor: "pointer",
        }}>
          Search
        </button>
        {(params.search || params.category || params.filter) && (
          <Link href="/admin/dashboard/products" style={{
            padding: "9px 14px", fontSize: 13, color: "#555",
            textDecoration: "none", alignSelf: "center",
          }}>
            Clear
          </Link>
        )}
      </form>

      {/* Products table */}
      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
          <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 15, color: "#666" }}>No products found</p>
        </div>
      ) : (
        <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "56px 1fr 120px 80px 80px 100px",
            padding: "12px 20px", borderBottom: "1px solid #141414",
            fontSize: 11, color: "#444", letterSpacing: 1, textTransform: "uppercase",
          }}>
            <span></span>
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {products.map((product, i) => (
            <div key={product.id} style={{
              display: "grid", gridTemplateColumns: "56px 1fr 120px 80px 80px 100px",
              padding: "14px 20px", alignItems: "center",
              borderBottom: i < products.length - 1 ? "1px solid #111" : "none",
            }}>
              {/* Image */}
              <div style={{
                width: 40, height: 40, background: "#141414",
                borderRadius: 6, overflow: "hidden", position: "relative",
              }}>
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, opacity: 0.2 }}>🚗</div>
                )}
              </div>

              {/* Name */}
              <div style={{ paddingRight: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: product.isActive ? "#ddd" : "#555" }}>
                    {product.name}
                  </p>
                  {product.isFeatured && (
                    <span style={{ fontSize: 9, padding: "2px 6px", background: "#e63c1e22", color: "#e63c1e", borderRadius: 4, border: "1px solid #e63c1e44" }}>
                      FEATURED
                    </span>
                  )}
                  {!product.isActive && (
                    <span style={{ fontSize: 9, padding: "2px 6px", background: "#1a1a1a", color: "#555", borderRadius: 4 }}>
                      INACTIVE
                    </span>
                  )}
                </div>
                {product.sku && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#444" }}>SKU: {product.sku}</p>}
              </div>

              {/* Category */}
              <p style={{ margin: 0, fontSize: 11, color: "#666" }}>
                {CATEGORY_LABELS[product.category] || product.category}
              </p>

              {/* Price */}
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                  {formatNaira(product.price)}
                </p>
                {product.comparePrice && (
                  <p style={{ margin: 0, fontSize: 10, color: "#444", textDecoration: "line-through" }}>
                    {formatNaira(product.comparePrice)}
                  </p>
                )}
              </div>

              {/* Stock */}
              <p style={{
                margin: 0, fontSize: 13, fontWeight: 600,
                color: product.stock === 0 ? "#e63c1e" : product.stock <= 5 ? "#f5a623" : "#00c896",
              }}>
                {product.stock}
              </p>

              {/* Actions */}
              <ProductActions
                productId={product.id}
                isActive={product.isActive}
                userRole={session!.user.role}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
