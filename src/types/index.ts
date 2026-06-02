// src/types/index.ts
// Shared TypeScript types across the app

import type { 
  User, Booking, BookingStage, Product, Order, 
  Customer, JobIntake, IntakePhoto, Service,
  Role, ServiceType, OrderStatus, FulfilmentStatus,
  PhotoType, FuelLevel, FluidLevel, TyreCondition,
  ProductCategory
} from "@prisma/client"

// Re-export Prisma types
export type {
  User, Booking, BookingStage, Product, Order,
  Customer, JobIntake, IntakePhoto, Service,
  Role, ServiceType, OrderStatus, FulfilmentStatus,
  PhotoType, FuelLevel, FluidLevel, TyreCondition,
  ProductCategory
}

// ── Extended types with relations ────────────────────────────────────

export type BookingWithRelations = Booking & {
  customer?: Customer | null
  assignedWorker?: Pick<User, "id" | "name" | "email" | "avatar"> | null
  intake?: JobIntakeWithPhotos | null
  stageHistory?: StageHistory[]
}

export type JobIntakeWithPhotos = JobIntake & {
  photos: IntakePhoto[]
  worker: Pick<User, "id" | "name">
}

export type OrderWithItems = Order & {
  items: (Order["id"] & {
    product: Pick<Product, "id" | "name" | "images" | "slug">
    quantity: number
    unitPrice: number
    total: number
  })[]
  customer?: Customer | null
}

export type ProductWithStock = Product & {
  isLowStock: boolean
}

export type StageHistory = {
  id: string
  stage: BookingStage
  note?: string | null
  changedBy?: string | null
  createdAt: Date
}

// ── Cart (client-side only) ──────────────────────────────────────────

export type CartItem = {
  productId: string
  name: string
  price: number
  image?: string
  quantity: number
  slug: string
}

export type Cart = {
  items: CartItem[]
  total: number
  itemCount: number
}

// ── Dashboard stats ──────────────────────────────────────────────────

export type DashboardStats = {
  bookings: {
    total: number
    today: number
    byStage: Record<BookingStage, number>
  }
  orders: {
    total: number
    today: number
    revenue: number
    todayRevenue: number
  }
  customers: {
    total: number
    new: number // last 30 days
  }
  products: {
    total: number
    lowStock: number
    outOfStock: number
  }
}

// ── API response types ───────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true
  data: T
  message?: string
}

export type ApiError = {
  success: false
  error: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── Pipeline stage config ────────────────────────────────────────────

export const STAGE_CONFIG: Record<
  BookingStage,
  { label: string; color: string; next?: BookingStage }
> = {
  BOOKED: {
    label: "Booked",
    color: "#4a9eff",
    next: "CAR_RECEIVED",
  },
  CAR_RECEIVED: {
    label: "Car Received",
    color: "#f5a623",
    next: "IN_PROGRESS",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#9b59b6",
    next: "QUALITY_CHECK",
  },
  QUALITY_CHECK: {
    label: "Quality Check",
    color: "#e67e22",
    next: "COMPLETED",
  },
  COMPLETED: {
    label: "Completed",
    color: "#00c896",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#555555",
  },
}

// ── Fuel level labels ────────────────────────────────────────────────

export const FUEL_LABELS: Record<FuelLevel, string> = {
  EMPTY: "Empty",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTER: "3/4",
  FULL: "Full",
}

export const FLUID_LABELS: Record<FluidLevel, string> = {
  LOW: "Low ⚠️",
  OK: "OK",
  FULL: "Full",
}

export const TYRE_LABELS: Record<TyreCondition, string> = {
  POOR: "Poor — needs replacement",
  FAIR: "Fair — worn",
  GOOD: "Good",
  EXCELLENT: "Excellent",
}
