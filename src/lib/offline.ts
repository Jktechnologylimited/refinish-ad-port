// src/lib/offline.ts
// IndexedDB store using Dexie for offline worker functionality
// Stores jobs, intake forms, and queued sync actions locally

import Dexie, { type Table } from "dexie"

// ── Types ────────────────────────────────────────────────────────────
export interface OfflineJob {
  id: string
  reference: string
  customerName: string
  customerPhone: string
  carMake: string
  carModel: string
  carYear?: string
  carColour?: string
  carPlate?: string
  serviceName: string
  serviceType: string
  scheduledDate: string
  stage: string
  assignedWorkerId: string
  internalNotes?: string
  intake?: OfflineIntake
  syncedAt?: number
  cachedAt: number
}

export interface OfflineIntake {
  id?: string
  bookingId: string
  fuelLevel: string
  engineOilLevel: string
  coolantLevel: string
  tyreCondition: string
  mileage?: string
  existingDamage?: string
  customerAgreed: boolean
  photos: OfflinePhoto[]
  savedAt: number
  synced: boolean
}

export interface OfflinePhoto {
  id: string
  base64: string        // stored locally until synced
  url?: string          // cloudinary URL after sync
  publicId?: string
  caption?: string
  photoType: "INTAKE" | "PROGRESS" | "COMPLETION"
  takenAt: number
  synced: boolean
}

export interface SyncQueueItem {
  id?: number           // auto-increment
  action: "UPDATE_STAGE" | "SAVE_INTAKE" | "UPLOAD_PHOTO" | "ADD_NOTE"
  endpoint: string
  method: "POST" | "PATCH" | "PUT"
  payload: string       // JSON stringified
  bookingId: string
  createdAt: number
  retryCount: number
  lastError?: string
}

// ── Dexie DB ─────────────────────────────────────────────────────────
class AutoOpsDB extends Dexie {
  jobs!: Table<OfflineJob>
  intakes!: Table<OfflineIntake>
  photos!: Table<OfflinePhoto>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super("AutoOpsDB")
    this.version(1).stores({
      jobs: "id, stage, assignedWorkerId, cachedAt",
      intakes: "bookingId, synced, savedAt",
      photos: "id, synced, takenAt",
      syncQueue: "++id, action, bookingId, createdAt",
    })
  }
}

export const db = new AutoOpsDB()

// ── Helper functions ─────────────────────────────────────────────────

// Cache jobs for offline access
export async function cacheJobs(jobs: OfflineJob[]) {
  await db.jobs.bulkPut(
    jobs.map((j) => ({ ...j, cachedAt: Date.now() }))
  )
}

// Get worker's assigned jobs
export async function getWorkerJobs(workerId: string) {
  return db.jobs
    .where("assignedWorkerId")
    .equals(workerId)
    .reverse()
    .sortBy("cachedAt")
}

// Save intake form locally (offline)
export async function saveIntakeLocally(intake: OfflineIntake) {
  await db.intakes.put({ ...intake, savedAt: Date.now(), synced: false })
}

// Get saved intake for a booking
export async function getIntake(bookingId: string) {
  return db.intakes.get(bookingId)
}

// Save photo locally
export async function savePhotoLocally(photo: OfflinePhoto) {
  await db.photos.put(photo)
}

// Queue an action for background sync
export async function queueSync(item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount">) {
  await db.syncQueue.add({
    ...item,
    createdAt: Date.now(),
    retryCount: 0,
  })
}

// Get all pending sync items
export async function getPendingSyncs() {
  return db.syncQueue.toArray()
}

// Mark sync item as done
export async function removeSyncItem(id: number) {
  await db.syncQueue.delete(id)
}

// Clear old cached data (>7 days)
export async function clearStaleCache() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  await db.jobs.where("cachedAt").below(sevenDaysAgo).delete()
}

// Check if there are pending unsynced items
export async function hasPendingSyncs(): Promise<boolean> {
  const count = await db.syncQueue.count()
  return count > 0
}
