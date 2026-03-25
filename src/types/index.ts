export type AttendanceType = 'office' | 'home' | 'off' | 'holiday' | 'sick'

export interface Transport {
  id: string
  userId: string
  name: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface Location {
  id: string
  userId: string
  name: string
  transportId: string | null
  transport: Transport | null
  distance: number | null
  color: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceRecord {
  id: string
  userId: string
  date: Date
  type: AttendanceType
  transportId?: string | null
  transport?: Transport | null
  locationId?: string | null
  location?: Location | null
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  id: string
  email: string
  name?: string
  defaultState: string
  workDays: string // "1,2,3,4,5" for Mon-Fri
  weekStartDay: number
}

export interface ExportParams {
  startDate: string
  endDate: string
  format: 'csv' | 'pdf'
}
