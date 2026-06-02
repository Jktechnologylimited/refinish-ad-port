"use client"
// src/components/admin/ProductForm.tsx
// Shared form for creating and editing products

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import toast from "react-hot-toast"
import { Upload, X, Loader, Star } from "lucide-react"

const CATEGORIES = [
  { value: "WAX_AND_POLISH", label: "Wax & Polish" },
  { value: "INTERIOR_CARE", label: "Interior Care" },
  { value: "EXTERIOR_CARE", label: "Exterior Care" },
  { value: "PAINT_PROTECTION", label: "Paint Protection" },
  { value: "MICROFIBRE_AND_TOOLS", label: "Tools & Cloths" },
  { value: "TYRE_CARE", label: "Tyre Care" },
  { value: "GLASS_CARE", label: "Glass Care" },
  { value: "FRAGRANCE", label: "Fragrance" },
  { value: "KITS_AND_BUNDLES", label: "Kits & Bundles" },
  { value: "OTHER", label: "Other" },
]

type Product = {
  id?: string
  name: string
  slug: string
  description: string
  price: number | string
  comparePrice: number | string
  stock: number | string
  sku: string
  category: string
  images: string[]
  isActive: boolean
  isFeatured: boolean
  weight: number | string
}

type Props = {
  initialData?: Partial<Product>
  mode: "create" | "edit"
}

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

const inputStyle = {
  width: "100%", background: "#141414",
  border: "1px solid #222", borderRadius: 8,
  padding: "10px 14px", color: "#fff",
  fontSize: 14, outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
}

const labelStyle = {
  display: "block" as const,
  fontSize: 12, color: "#666",
  marginBottom: 6, letterSpacing: 0.3,
}

export default function ProductForm({ initialData, mode }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<Product>({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    comparePrice: initialData?.comparePrice || "",
    stock: initialData?.stock ?? "",
    sku: initialData?.sku || "",
    category: initialData?.category || "WAX_AND_POLISH",
    images: initialData?.images || [],
    isActive: initialData?.isActive ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    weight: initialData?.weight || "",
  })

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  function update(key: keyof Product, value: any) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: mode === "create" ? slugify(name) : f.slug,
    }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64, folder: "products" }),
          })
          const data = await res.json()
          if (data.success) {
            setForm((f) => ({ ...f, images: [...f.images, data.data.url] }))
            toast.success("Image uploaded")
          } else {
            toast.error("Upload failed")
          }
        } catch {
          toast.error("Upload failed")
        }
      }
      reader.readAsDataURL(file)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  function removeImage(url: string) {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.slug || !form.price || !form.category) {
      toast.error("Fill in all required fields")
      return
    }

    setSaving(true)
    const payload = {
      ...form,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      stock: Number(form.stock) || 0,
      weight: form.weight ? Number(form.weight) : null,
    }

    try {
      const url = mode === "create"
        ? "/api/admin/products"
        : `/api/admin/products/${initialData?.id}`
      const method = mode === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      toast.success(mode === "create" ? "Product created!" : "Product updated!")
      router.push("/admin/dashboard/products")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "flex-start" }}>
        {/* Left — main details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Basic info */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "24px" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
              Basic Info
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Product Name *</label>
              <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                required placeholder="e.g. Refinish Pro Ceramic Wax" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Slug (URL) *</label>
              <input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))}
                required placeholder="refinish-pro-ceramic-wax" style={inputStyle} />
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>
                shop.refinishphc.com/shop/{form.slug || "product-slug"}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                rows={4} placeholder="Describe the product..."
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Category *</label>
                <select value={form.category} onChange={(e) => update("category", e.target.value)}
                  style={{ ...inputStyle, appearance: "none" as any }}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>SKU</label>
                <input value={form.sku} onChange={(e) => update("sku", e.target.value)}
                  placeholder="e.g. RPH-WAX-001" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "24px" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
              Pricing & Stock
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Price (₦) *</label>
                <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)}
                  required min={0} placeholder="8500" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Compare Price (₦)</label>
                <input type="number" value={form.comparePrice} onChange={(e) => update("comparePrice", e.target.value)}
                  min={0} placeholder="10000" style={inputStyle} />
                <p style={{ margin: "4px 0 0", fontSize: 10, color: "#444" }}>Shows as crossed-out original price</p>
              </div>
              <div>
                <label style={labelStyle}>Stock Qty *</label>
                <input type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)}
                  required min={0} placeholder="50" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Images */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
              Product Images
            </h3>

            {/* Upload button */}
            <button type="button" onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10,
                background: "#141414", border: "2px dashed #2a2a2a",
                borderRadius: 10, padding: "20px",
                color: "#555", cursor: "pointer", fontSize: 14,
                marginBottom: 16,
              }}>
              {uploading ? <Loader size={18} color="#e63c1e" /> : <Upload size={18} />}
              {uploading ? "Uploading..." : "Upload Images"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple
              onChange={handleImageUpload} style={{ display: "none" }} />

            {/* Image grid */}
            {form.images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
                {form.images.map((url, i) => (
                  <div key={url} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden" }}>
                    <Image src={url} alt="" fill style={{ objectFit: "cover" }} />
                    {i === 0 && (
                      <div style={{
                        position: "absolute", top: 4, left: 4,
                        background: "#e63c1e", color: "#fff",
                        fontSize: 9, padding: "2px 5px", borderRadius: 3, fontWeight: 700,
                      }}>MAIN</div>
                    )}
                    <button type="button" onClick={() => removeImage(url)}
                      style={{
                        position: "absolute", top: 4, right: 4,
                        background: "rgba(0,0,0,0.8)", border: "none",
                        borderRadius: "50%", width: 22, height: 22,
                        cursor: "pointer", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — status + submit */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 84 }}>
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
              Visibility
            </h3>

            <label style={{
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", padding: "10px 0",
              borderBottom: "1px solid #141414", marginBottom: 10,
            }}>
              <div style={{
                width: 40, height: 22, borderRadius: 11,
                background: form.isActive ? "#00c896" : "#1a1a1a",
                border: `1px solid ${form.isActive ? "#00c896" : "#333"}`,
                position: "relative", transition: "all 0.2s",
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#fff", position: "absolute",
                  top: 2, left: form.isActive ? 20 : 2,
                  transition: "left 0.2s",
                }} />
              </div>
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => update("isActive", e.target.checked)}
                style={{ display: "none" }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#ccc", fontWeight: 500 }}>Active</p>
                <p style={{ margin: 0, fontSize: 11, color: "#555" }}>Visible in shop</p>
              </div>
            </label>

            <label style={{
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", padding: "10px 0",
            }}>
              <div style={{
                width: 40, height: 22, borderRadius: 11,
                background: form.isFeatured ? "#e63c1e" : "#1a1a1a",
                border: `1px solid ${form.isFeatured ? "#e63c1e" : "#333"}`,
                position: "relative", transition: "all 0.2s",
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#fff", position: "absolute",
                  top: 2, left: form.isFeatured ? 20 : 2,
                  transition: "left 0.2s",
                }} />
              </div>
              <input type="checkbox" checked={form.isFeatured}
                onChange={(e) => update("isFeatured", e.target.checked)}
                style={{ display: "none" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#ccc", fontWeight: 500 }}>Featured</p>
                  <Star size={12} color="#e63c1e" />
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "#555" }}>Shows on homepage</p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving} style={{
            width: "100%", background: saving ? "#8a2410" : "#e63c1e",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "14px", fontSize: 15, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "Saving..." : mode === "create" ? "Create Product" : "Save Changes"}
          </button>

          <button type="button" onClick={() => router.push("/admin/dashboard/products")}
            style={{
              width: "100%", background: "transparent",
              color: "#555", border: "1px solid #222",
              borderRadius: 10, padding: "12px",
              fontSize: 14, cursor: "pointer",
            }}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
