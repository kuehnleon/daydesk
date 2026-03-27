import { z } from 'zod'

// --- Shared primitives ---

export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')

export const yearMonthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format')

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color (e.g. #ff0000)')

export const attendanceTypeSchema = z.enum(['office', 'home', 'off', 'holiday', 'sick'])

export const germanStateCodeSchema = z.enum([
  'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
  'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH',
])

// --- Route schemas ---

export const createAttendanceSchema = z.object({
  date: dateStringSchema,
  type: attendanceTypeSchema,
  transportId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  notes: z.string().max(500).optional(),
})

export const getAttendanceQuerySchema = z.object({
  month: yearMonthSchema.optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && !data.endDate) return false
    if (!data.startDate && data.endDate) return false
    return true
  },
  { message: 'startDate and endDate must be provided together' }
)

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  transportId: z.string().nullable().optional(),
  distance: z.coerce.number().int().nonnegative().nullable().optional(),
  color: hexColorSchema,
})

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  transportId: z.string().nullable().optional(),
  distance: z.coerce.number().int().nonnegative().nullable().optional(),
  color: hexColorSchema.optional(),
  sortOrder: z.number().int().nonnegative().optional(),
})

export const createTransportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export const updateTransportSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
})

export const updateSettingsSchema = z.object({
  defaultState: germanStateCodeSchema.optional(),
  workDays: z.string().regex(/^[0-6](,[0-6])*$/, 'Must be comma-separated days 0-6').optional(),
  weekStartDay: z.number().int().min(0).max(6).optional(),
})

export const exportQuerySchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  format: z.enum(['csv', 'pdf']).default('csv'),
})

export const holidaysQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Must be a 4-digit year').optional(),
  state: germanStateCodeSchema.optional(),
})
