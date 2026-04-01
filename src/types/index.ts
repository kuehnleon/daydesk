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

export interface ReminderTimeEntry {
  id: string
  time: string
  timezone: string
}

export interface UserSettings {
  id: string
  email: string
  name?: string
  country: string
  defaultState: string
  workDays: string // "1,2,3,4,5" for Mon-Fri
  weekStartDay: number
  locale: string
  reminderEnabled: boolean
  reminders: ReminderTimeEntry[]
  reminderWorkDaysOnly: boolean
}

export interface AttendanceWithRelations {
  id: string
  date: Date
  type: string
  transportId: string | null
  transport: Transport | null
  locationId: string | null
  location: (Location & { transport: Transport | null }) | null
  notes: string | null
}

export interface ExportParams {
  startDate: string
  endDate: string
  format: 'csv' | 'pdf'
}

export interface ReminderSettings {
  enabled: boolean
  times: ReminderTimeEntry[]
  workDaysOnly: boolean
}

export interface ImportRow {
  date: string
  type: string
  location: string
  transport: string
  distance: string
  notes: string
}

export interface CalendarAttendance {
  id: string
  date: string
  type: string
  transportId: string | null
  transport: Transport | null
  locationId: string | null
  location: (Location & { transport: Transport | null }) | null
  notes: string | null
}

export interface AvailableCountry {
  countryCode: string
  name: string
}

export interface Region {
  code: string
  name: string
}

export interface TransportFormData {
  name: string
}

export interface LocationFormData {
  name: string
  transportId: string
  distance: string
  color: string
}
