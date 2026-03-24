export type AttendanceType = 'office' | 'home' | 'off' | 'holiday' | 'sick'
export type TransportType = 'own_car' | 'company_car' | null

export interface AttendanceRecord {
  id: string
  userId: string
  date: Date
  type: AttendanceType
  transport: TransportType
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
}

export interface ExportParams {
  startDate: string
  endDate: string
  format: 'csv' | 'pdf'
}
