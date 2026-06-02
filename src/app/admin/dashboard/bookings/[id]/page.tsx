// src/app/admin/dashboard/bookings/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { formatNaira } from "@/lib/paystack"
import BookingActions from "@/components/admin/BookingActions"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Car, User, Calendar, Camera, Clock } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  BOOKED: { label: "Booked", color: "#4a9eff" },
  CAR_RECEIVED: { label: "Car Received", color: "#f5a623" },
  IN_PROGRESS: { label: "In Progress", color: "#9b59b6" },
  QUALITY_CHECK: { label: "Quality Check", color: "#e67e22" },
  COMPLETED: { label: "Completed", color: "#00c896" },
  CANCELLED: { label: "Cancelled", color: "#555" },
}

const FUEL_LABELS: Record<string, string> = {
  EMPTY: "Empty", QUARTER: "1/4", HALF: "1/2", THREE_QUARTER: "3/4", FULL: "Full",
}
const FLUID_LABELS: Record<string, string> = { LOW: "Low ⚠️", OK: "OK", FULL: "Full" }
const TYRE_LABELS: Record<string, string> = {
  POOR: "Poor", FAIR: "Fair", GOOD: "Good", EXCELLENT: "Excellent",
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedWorker: { select: { id: true, name: true, email: true } },
      intake: {
        include: {
          photos: { orderBy: { takenAt: "asc" } },
          worker: { select: { id: true, name: true } },
        },
      },
      stageHistory: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!booking) notFound()

  const workers = await prisma.user.findMany({
    where: { role: "WORKER", isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const stage = STAGE_CONFIG[booking.stage] || STAGE_CONFIG.BOOKED

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #141414" }}>
        <span style={{ fontSize: 12, color: "#555", width: 130, flexShrink: 0 }}>{label}</span>
        <span style={{ fontSize: 13, color: "#ccc" }}>{value}</span>
      </div>
    ) : null

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>
      {/* Back */}
      <Link href="/admin/dashboard/bookings" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#555", textDecoration: "none", marginBottom: 24,
      }}>
        <ChevronLeft size={14} /> Back to pipeline
      </Link>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>
              {booking.customerName}
            </h1>
            <span style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 6,
              background: stage.color + "22", color: stage.color,
              border: `1px solid ${stage.color}44`, fontWeight: 600,
            }}>
              {stage.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
            {booking.carMake} {booking.carModel} · {booking.serviceName}
          </p>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
          {formatNaira(booking.servicePrice)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "flex-start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Customer info */}
          <Section title="Customer" icon={<User size={14} />}>
            <InfoRow label="Name" value={booking.customerName} />
            <InfoRow label="Phone" value={booking.customerPhone} />
            <InfoRow label="Email" value={booking.customerEmail} />
            {booking.customer && (
              <div style={{ paddingTop: 8 }}>
                <Link href={`/admin/dashboard/customers/${booking.customer.id}`}
                  style={{ fontSize: 12, color: "#e63c1e", textDecoration: "none" }}>
                  View CRM profile →
                </Link>
              </div>
            )}
          </Section>

          {/* Vehicle */}
          <Section title="Vehicle" icon={<Car size={14} />}>
            <InfoRow label="Make & Model" value={`${booking.carMake} ${booking.carModel}`} />
            <InfoRow label="Year" value={booking.carYear} />
            <InfoRow label="Colour" value={booking.carColour} />
            <InfoRow label="Plate Number" value={booking.carPlate} />
          </Section>

          {/* Service */}
          <Section title="Service & Schedule" icon={<Calendar size={14} />}>
            <InfoRow label="Service" value={booking.serviceName} />
            <InfoRow label="Price" value={formatNaira(booking.servicePrice)} />
            <InfoRow
              label="Scheduled"
              value={new Date(booking.scheduledDate).toLocaleDateString("en-NG", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            />
            <InfoRow
              label="Est. Completion"
              value={booking.estimatedCompletion
                ? new Date(booking.estimatedCompletion).toLocaleDateString("en-NG")
                : "Not set"}
            />
            <InfoRow label="Assigned to"
              value={booking.assignedWorker?.name || "Unassigned"} />
            {booking.customerNotes && (
              <div style={{ padding: "10px 0", borderTop: "1px solid #141414", marginTop: 4 }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555" }}>Customer notes</p>
                <p style={{ margin: 0, fontSize: 13, color: "#888" }}>{booking.customerNotes}</p>
              </div>
            )}
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <PayBadge label="Deposit" amount={booking.depositAmount} paid={booking.depositPaid} />
              <PayBadge label="Balance" amount={booking.balanceAmount} paid={booking.balancePaid} />
            </div>
            <InfoRow label="Total Paid" value={formatNaira(booking.totalPaid)} />
            <InfoRow label="Deposit Ref" value={booking.depositPaystackRef} />
            <InfoRow label="Balance Ref" value={booking.balancePaystackRef} />
          </Section>

          {/* Car Intake */}
          {booking.intake ? (
            <Section title="Car Intake" icon={<Camera size={14} />}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <IntakeStat label="Fuel Level" value={FUEL_LABELS[booking.intake.fuelLevel]} />
                <IntakeStat label="Engine Oil" value={FLUID_LABELS[booking.intake.engineOilLevel]} />
                <IntakeStat label="Coolant" value={FLUID_LABELS[booking.intake.coolantLevel]} />
                <IntakeStat label="Tyres" value={TYRE_LABELS[booking.intake.tyreCondition]} />
                {booking.intake.mileage && (
                  <IntakeStat label="Mileage" value={booking.intake.mileage} />
                )}
              </div>
              {booking.intake.existingDamage && (
                <div style={{
                  background: "#1a0808", border: "1px solid #e63c1e22",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555" }}>Existing Damage Noted</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#ccc" }}>{booking.intake.existingDamage}</p>
                </div>
              )}
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#555" }}>
                Checked in by <strong style={{ color: "#888" }}>{booking.intake.worker.name}</strong>
                {" · "}
                {new Date(booking.intake.receivedAt).toLocaleString("en-NG")}
                {" · "}
                Customer agreed:{" "}
                <span style={{ color: booking.intake.customerAgreed ? "#00c896" : "#f5a623" }}>
                  {booking.intake.customerAgreed ? "Yes" : "No"}
                </span>
              </p>

              {/* Photos */}
              {booking.intake.photos.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#555" }}>
                    {booking.intake.photos.length} photo{booking.intake.photos.length !== 1 ? "s" : ""}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                    {booking.intake.photos.map((photo) => (
                      <div key={photo.id} style={{
                        borderRadius: 8, overflow: "hidden",
                        aspectRatio: "4/3", position: "relative",
                        background: "#141414",
                      }}>
                        <Image src={photo.url} alt={photo.caption || "Intake photo"}
                          fill style={{ objectFit: "cover" }} />
                        {photo.caption && (
                          <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            background: "rgba(0,0,0,0.7)",
                            padding: "4px 6px", fontSize: 10, color: "#ccc",
                          }}>
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          ) : (
            <Section title="Car Intake" icon={<Camera size={14} />}>
              <p style={{ margin: 0, fontSize: 13, color: "#444" }}>
                No intake recorded yet. Worker will complete this when the car is received.
              </p>
            </Section>
          )}

          {/* Stage history */}
          <Section title="Timeline" icon={<Clock size={14} />}>
            {booking.stageHistory.map((h, i) => (
              <div key={h.id} style={{
                display: "flex", gap: 12,
                paddingBottom: i < booking.stageHistory.length - 1 ? 12 : 0,
              }}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: STAGE_CONFIG[h.stage]?.color || "#555",
                    flexShrink: 0, marginTop: 4,
                  }} />
                  {i < booking.stageHistory.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: "#1a1a1a", margin: "4px 0" }} />
                  )}
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, color: "#ccc", fontWeight: 500 }}>
                    {STAGE_CONFIG[h.stage]?.label || h.stage}
                  </p>
                  {h.note && (
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "#666" }}>{h.note}</p>
                  )}
                  <p style={{ margin: 0, fontSize: 11, color: "#444" }}>
                    {h.changedBy ? `By ${h.changedBy} · ` : ""}
                    {new Date(h.createdAt).toLocaleString("en-NG")}
                  </p>
                </div>
              </div>
            ))}
          </Section>
        </div>

        {/* Right column — actions */}
        <BookingActions
          booking={{
            id: booking.id,
            stage: booking.stage,
            assignedWorkerId: booking.assignedWorkerId,
            internalNotes: booking.internalNotes,
            depositPaid: booking.depositPaid,
            balancePaid: booking.balancePaid,
            depositAmount: booking.depositAmount,
            balanceAmount: booking.balanceAmount,
          }}
          workers={workers}
          userRole={session!.user.role}
        />
      </div>
    </div>
  )
}

function Section({ title, icon, children }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div style={{
      background: "#0f0f0f", border: "1px solid #1c1c1c",
      borderRadius: 12, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid #141414",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {icon && <span style={{ color: "#e63c1e" }}>{icon}</span>}
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#888", letterSpacing: 0.5 }}>
          {title.toUpperCase()}
        </h3>
      </div>
      <div style={{ padding: "14px 20px" }}>{children}</div>
    </div>
  )
}

function PayBadge({ label, amount, paid }: { label: string; amount: number; paid: boolean }) {
  return (
    <div style={{
      flex: 1, background: paid ? "#0a1a0f" : "#0f0f0f",
      border: `1px solid ${paid ? "#00c89644" : "#222"}`,
      borderRadius: 8, padding: "10px 14px",
    }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: "#555" }}>{label}</p>
      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff" }}>
        {formatNaira(amount)}
      </p>
      <span style={{
        fontSize: 10, color: paid ? "#00c896" : "#f5a623",
        fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
      }}>
        {paid ? "✓ Paid" : "Pending"}
      </span>
    </div>
  )
}

function IntakeStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: "#141414", borderRadius: 8,
      padding: "10px 12px",
    }}>
      <p style={{ margin: "0 0 2px", fontSize: 10, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#ccc" }}>{value}</p>
    </div>
  )
}
