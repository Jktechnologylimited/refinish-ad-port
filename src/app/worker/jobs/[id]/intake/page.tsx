"use client"
// src/app/worker/jobs/[id]/intake/page.tsx
// Full offline-capable car intake form with photo capture

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { Camera, ChevronLeft, Trash2, CheckCircle, Loader } from "lucide-react"
import { saveIntakeLocally, queueSync } from "@/lib/offline"

type Photo = { id: string; base64: string; caption: string; preview: string }

const FUEL_OPTIONS = [
  { value: "EMPTY", label: "Empty", icon: "▱▱▱▱" },
  { value: "QUARTER", label: "1/4", icon: "▰▱▱▱" },
  { value: "HALF", label: "1/2", icon: "▰▰▱▱" },
  { value: "THREE_QUARTER", label: "3/4", icon: "▰▰▰▱" },
  { value: "FULL", label: "Full", icon: "▰▰▰▰" },
]

const FLUID_OPTIONS = [
  { value: "LOW", label: "Low ⚠️", color: "#e63c1e" },
  { value: "OK", label: "OK", color: "#f5a623" },
  { value: "FULL", label: "Full", color: "#00c896" },
]

const TYRE_OPTIONS = [
  { value: "POOR", label: "Poor", sub: "Needs replacement" },
  { value: "FAIR", label: "Fair", sub: "Worn but OK" },
  { value: "GOOD", label: "Good", sub: "" },
  { value: "EXCELLENT", label: "Excellent", sub: "" },
]

export default function IntakePage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const fileRef = useRef<HTMLInputElement>(null)

  const [fuelLevel, setFuelLevel] = useState("HALF")
  const [engineOilLevel, setEngineOilLevel] = useState("OK")
  const [coolantLevel, setCoolantLevel] = useState("OK")
  const [tyreCondition, setTyreCondition] = useState("GOOD")
  const [mileage, setMileage] = useState("")
  const [existingDamage, setExistingDamage] = useState("")
  const [customerAgreed, setCustomerAgreed] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [captionInput, setCaptionInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [step, setStep] = useState(1) // 1: condition, 2: photos, 3: confirm

  useEffect(() => {
    setIsOnline(navigator.onLine)
    window.addEventListener("online", () => setIsOnline(true))
    window.addEventListener("offline", () => setIsOnline(false))
    return () => {
      window.removeEventListener("online", () => setIsOnline(true))
      window.removeEventListener("offline", () => setIsOnline(false))
    }
  }, [])

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        setPhotos((prev) => [...prev, {
          id: crypto.randomUUID(),
          base64,
          caption: captionInput,
          preview: base64,
        }])
      }
      reader.readAsDataURL(file)
    })
    setCaptionInput("")
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSubmit() {
    if (!customerAgreed) {
      toast.error("Please confirm customer has agreed")
      return
    }
    if (photos.length === 0) {
      toast.error("Please take at least 1 photo")
      return
    }

    setSubmitting(true)

    const intakeData = {
      bookingId,
      fuelLevel,
      engineOilLevel,
      coolantLevel,
      tyreCondition,
      mileage,
      existingDamage,
      customerAgreed,
      photos: photos.map((p) => ({
        base64: p.base64,
        caption: p.caption,
        photoType: "INTAKE",
      })),
    }

    // Save locally first (works offline)
    await saveIntakeLocally({
      bookingId,
      fuelLevel,
      engineOilLevel,
      coolantLevel,
      tyreCondition,
      mileage,
      existingDamage,
      customerAgreed,
      photos: photos.map((p) => ({
        id: p.id,
        base64: p.base64,
        caption: p.caption,
        photoType: "INTAKE" as const,
        takenAt: Date.now(),
        synced: false,
      })),
      savedAt: Date.now(),
      synced: false,
    })

    if (!isOnline) {
      // Queue for background sync
      await queueSync({
        action: "SAVE_INTAKE",
        endpoint: "/api/intake",
        method: "POST",
        payload: JSON.stringify(intakeData),
        bookingId,
      })
      toast.success("Saved offline — will sync when connected")
      setSubmitting(false)
      router.push(`/worker/jobs/${bookingId}`)
      return
    }

    // Submit to server
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intakeData),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success("Vehicle checked in successfully!")
      router.push(`/worker/jobs/${bookingId}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to submit. Saved locally.")
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: "100%", background: "#141414",
    border: "1px solid #222", borderRadius: 8,
    padding: "10px 12px", color: "#fff",
    fontSize: 14, outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href={`/worker/jobs/${bookingId}`} style={{ color: "#555", display: "flex" }}>
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
            Vehicle Check-In
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: isOnline ? "#00c896" : "#f5a623" }}>
            {isOnline ? "● Online" : "● Offline — will sync later"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: s <= step ? "#e63c1e" : "#1a1a1a",
            transition: "background 0.2s",
          }} />
        ))}
      </div>

      {/* Step 1: Condition */}
      {step === 1 && (
        <div>
          <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "#fff" }}>
            Vehicle Condition
          </h2>

          {/* Fuel level */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#888" }}>Fuel Level</p>
            <div style={{ display: "flex", gap: 8 }}>
              {FUEL_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setFuelLevel(opt.value)}
                  style={{
                    flex: 1, padding: "10px 4px",
                    background: fuelLevel === opt.value ? "#e63c1e22" : "#141414",
                    border: `1px solid ${fuelLevel === opt.value ? "#e63c1e" : "#222"}`,
                    borderRadius: 8, cursor: "pointer",
                    color: fuelLevel === opt.value ? "#e63c1e" : "#666",
                    textAlign: "center",
                  }}>
                  <div style={{ fontSize: 9, letterSpacing: -1, marginBottom: 4 }}>{opt.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Engine oil */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#888" }}>Engine Oil</p>
            <div style={{ display: "flex", gap: 8 }}>
              {FLUID_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setEngineOilLevel(opt.value)}
                  style={{
                    flex: 1, padding: "10px",
                    background: engineOilLevel === opt.value ? opt.color + "22" : "#141414",
                    border: `1px solid ${engineOilLevel === opt.value ? opt.color : "#222"}`,
                    borderRadius: 8, cursor: "pointer",
                    color: engineOilLevel === opt.value ? opt.color : "#666",
                    fontSize: 13, fontWeight: 600,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coolant */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#888" }}>Coolant</p>
            <div style={{ display: "flex", gap: 8 }}>
              {FLUID_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setCoolantLevel(opt.value)}
                  style={{
                    flex: 1, padding: "10px",
                    background: coolantLevel === opt.value ? opt.color + "22" : "#141414",
                    border: `1px solid ${coolantLevel === opt.value ? opt.color : "#222"}`,
                    borderRadius: 8, cursor: "pointer",
                    color: coolantLevel === opt.value ? opt.color : "#666",
                    fontSize: 13, fontWeight: 600,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tyres */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#888" }}>Tyre Condition</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {TYRE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setTyreCondition(opt.value)}
                  style={{
                    padding: "12px",
                    background: tyreCondition === opt.value ? "#e63c1e22" : "#141414",
                    border: `1px solid ${tyreCondition === opt.value ? "#e63c1e" : "#222"}`,
                    borderRadius: 8, cursor: "pointer",
                    color: tyreCondition === opt.value ? "#e63c1e" : "#666",
                    textAlign: "left",
                  }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                  {opt.sub && <p style={{ margin: "2px 0 0", fontSize: 10, opacity: 0.7 }}>{opt.sub}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* Mileage */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}>Mileage (optional)</p>
            <input
              type="number" value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="e.g. 45000" style={inputStyle}
            />
          </div>

          {/* Damage */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}>
              Existing Damage / Notes
            </p>
            <textarea
              value={existingDamage}
              onChange={(e) => setExistingDamage(e.target.value)}
              rows={3}
              placeholder="Describe any existing scratches, dents, or damage..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <button onClick={() => setStep(2)} style={{
            width: "100%", background: "#e63c1e", color: "#fff",
            border: "none", borderRadius: 10, padding: "14px",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>
            Next: Take Photos →
          </button>
        </div>
      )}

      {/* Step 2: Photos */}
      {step === 2 && (
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "#fff" }}>
            Take Photos
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#666" }}>
            Document all angles and any damage areas. At least 1 photo required.
          </p>

          {/* Caption input */}
          <div style={{ marginBottom: 12 }}>
            <input
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              placeholder="Photo label (e.g. Front bumper scratch)"
              style={inputStyle}
            />
          </div>

          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
              background: "#0f0f0f", border: "2px dashed #2a2a2a",
              borderRadius: 12, padding: "20px",
              color: "#666", cursor: "pointer", fontSize: 14,
              marginBottom: 20,
            }}>
            <Camera size={22} color="#e63c1e" />
            Take Photo or Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoCapture}
            style={{ display: "none" }}
          />

          {/* Photo grid */}
          {photos.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8, marginBottom: 24,
            }}>
              {photos.map((photo) => (
                <div key={photo.id} style={{ position: "relative", aspectRatio: "1" }}>
                  <img src={photo.preview} alt={photo.caption}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                  {photo.caption && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "rgba(0,0,0,0.75)",
                      padding: "3px 5px", fontSize: 9, color: "#ccc",
                      borderRadius: "0 0 8px 8px",
                    }}>
                      {photo.caption}
                    </div>
                  )}
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      background: "rgba(0,0,0,0.7)", border: "none",
                      borderRadius: "50%", width: 22, height: 22,
                      cursor: "pointer", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{
              flex: 1, background: "#1a1a1a", color: "#888",
              border: "1px solid #222", borderRadius: 10, padding: "13px",
              fontSize: 14, cursor: "pointer",
            }}>
              ← Back
            </button>
            <button
              onClick={() => { if (photos.length === 0) { toast.error("Take at least 1 photo"); return; } setStep(3) }}
              style={{
                flex: 2, background: "#e63c1e", color: "#fff",
                border: "none", borderRadius: 10, padding: "13px",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
              Next: Confirm →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div>
          <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "#fff" }}>
            Confirm & Submit
          </h2>

          {/* Summary */}
          <div style={{
            background: "#0f0f0f", border: "1px solid #1c1c1c",
            borderRadius: 12, padding: "16px", marginBottom: 20,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Fuel", fuelLevel.replace("_", " ")],
                ["Engine Oil", engineOilLevel],
                ["Coolant", coolantLevel],
                ["Tyres", tyreCondition],
                ["Photos", `${photos.length} taken`],
                ...(mileage ? [["Mileage", mileage + " km"]] : []),
              ].map(([l, v]) => (
                <div key={l} style={{ padding: "8px", background: "#141414", borderRadius: 6 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>{l}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#ccc", fontWeight: 600 }}>{v}</p>
                </div>
              ))}
            </div>
            {existingDamage && (
              <div style={{ marginTop: 10, padding: "8px 10px", background: "#1a0808", borderRadius: 6 }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#555" }}>DAMAGE NOTED</p>
                <p style={{ margin: 0, fontSize: 12, color: "#ccc" }}>{existingDamage}</p>
              </div>
            )}
          </div>

          {/* Customer agreement */}
          <button
            onClick={() => setCustomerAgreed(!customerAgreed)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              background: customerAgreed ? "#0a1a0f" : "#0f0f0f",
              border: `1px solid ${customerAgreed ? "#00c89644" : "#222"}`,
              borderRadius: 12, padding: "16px",
              cursor: "pointer", marginBottom: 20, textAlign: "left",
            }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: customerAgreed ? "#00c896" : "#1a1a1a",
              border: `1px solid ${customerAgreed ? "#00c896" : "#333"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {customerAgreed && <CheckCircle size={14} color="#000" />}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>
              Customer has been shown this report and agrees with the documented condition
            </p>
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(2)} style={{
              flex: 1, background: "#1a1a1a", color: "#888",
              border: "1px solid #222", borderRadius: 10, padding: "13px",
              fontSize: 14, cursor: "pointer",
            }}>
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !customerAgreed}
              style={{
                flex: 2, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
                background: submitting || !customerAgreed ? "#3a1a14" : "#e63c1e",
                color: submitting || !customerAgreed ? "#666" : "#fff",
                border: "none", borderRadius: 10, padding: "13px",
                fontSize: 14, fontWeight: 700,
                cursor: submitting || !customerAgreed ? "not-allowed" : "pointer",
              }}>
              {submitting ? (
                <><Loader size={16} /> Submitting...</>
              ) : (
                <><CheckCircle size={16} /> Check In Vehicle</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
