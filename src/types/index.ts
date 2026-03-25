export type AttendanceType = 'office' | 'home' | 'off' | 'holiday' | 'sick'
export type TransportType = 'own_car' | 'company_car' | null

export interface Location {
  id: string
  userId: string
  name: string
  transport: TransportType
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
  transport: TransportType
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
