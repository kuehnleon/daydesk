import {
  dateStringSchema,
  yearMonthSchema,
  hexColorSchema,
  attendanceTypeSchema,
  germanStateCodeSchema,
  createAttendanceSchema,
  getAttendanceQuerySchema,
  createLocationSchema,
  updateLocationSchema,
  createTransportSchema,
  updateTransportSchema,
  updateSettingsSchema,
  exportQuerySchema,
  holidaysQuerySchema,
} from '@/lib/validations'

// --- Primitive schemas ---

describe('dateStringSchema', () => {
  it('accepts valid YYYY-MM-DD', () => {
    expect(dateStringSchema.safeParse('2024-01-15').success).toBe(true)
    expect(dateStringSchema.safeParse('2024-12-31').success).toBe(true)
  })
  it('rejects invalid formats', () => {
    expect(dateStringSchema.safeParse('2024/01/15').success).toBe(false)
    expect(dateStringSchema.safeParse('2024-1-5').success).toBe(false)
    expect(dateStringSchema.safeParse('Jan 15 2024').success).toBe(false)
    expect(dateStringSchema.safeParse('').success).toBe(false)
  })
})

describe('yearMonthSchema', () => {
  it('accepts valid YYYY-MM', () => {
    expect(yearMonthSchema.safeParse('2024-01').success).toBe(true)
    expect(yearMonthSchema.safeParse('2024-12').success).toBe(true)
  })
  it('rejects invalid formats', () => {
    expect(yearMonthSchema.safeParse('2024').success).toBe(false)
    expect(yearMonthSchema.safeParse('2024-1').success).toBe(false)
    expect(yearMonthSchema.safeParse('2024-01-01').success).toBe(false)
  })
})

describe('hexColorSchema', () => {
  it('accepts valid hex colors', () => {
    expect(hexColorSchema.safeParse('#ff0000').success).toBe(true)
    expect(hexColorSchema.safeParse('#FF00AA').success).toBe(true)
    expect(hexColorSchema.safeParse('#000000').success).toBe(true)
  })
  it('rejects invalid hex colors', () => {
    expect(hexColorSchema.safeParse('ff0000').success).toBe(false)
    expect(hexColorSchema.safeParse('#fff').success).toBe(false)
    expect(hexColorSchema.safeParse('#GGGGGG').success).toBe(false)
    expect(hexColorSchema.safeParse('').success).toBe(false)
  })
})

describe('attendanceTypeSchema', () => {
  it.each(['office', 'home', 'off', 'holiday', 'sick'])('accepts "%s"', (type) => {
    expect(attendanceTypeSchema.safeParse(type).success).toBe(true)
  })
  it('rejects invalid types', () => {
    expect(attendanceTypeSchema.safeParse('invalid').success).toBe(false)
    expect(attendanceTypeSchema.safeParse('').success).toBe(false)
    expect(attendanceTypeSchema.safeParse('OFFICE').success).toBe(false)
  })
})

describe('germanStateCodeSchema', () => {
  const validStates = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH']
  it.each(validStates)('accepts "%s"', (state) => {
    expect(germanStateCodeSchema.safeParse(state).success).toBe(true)
  })
  it('has exactly 16 states', () => {
    expect(validStates).toHaveLength(16)
  })
  it('rejects invalid codes', () => {
    expect(germanStateCodeSchema.safeParse('XX').success).toBe(false)
    expect(germanStateCodeSchema.safeParse('bw').success).toBe(false)
    expect(germanStateCodeSchema.safeParse('').success).toBe(false)
  })
})

// --- Route schemas ---

describe('createAttendanceSchema', () => {
  it('accepts valid complete input', () => {
    const result = createAttendanceSchema.safeParse({
      date: '2024-01-15',
      type: 'office',
      transportId: 'abc123',
      locationId: 'def456',
      notes: 'Worked from HQ',
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal required fields', () => {
    const result = createAttendanceSchema.safeParse({
      date: '2024-01-15',
      type: 'home',
    })
    expect(result.success).toBe(true)
  })

  it('accepts null transportId and locationId', () => {
    const result = createAttendanceSchema.safeParse({
      date: '2024-01-15',
      type: 'off',
      transportId: null,
      locationId: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing date', () => {
    const result = createAttendanceSchema.safeParse({ type: 'office' })
    expect(result.success).toBe(false)
  })

  it('rejects missing type', () => {
    const result = createAttendanceSchema.safeParse({ date: '2024-01-15' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = createAttendanceSchema.safeParse({
      date: '2024/01/15',
      type: 'office',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid attendance type', () => {
    const result = createAttendanceSchema.safeParse({
      date: '2024-01-15',
      type: 'working',
    })
    expect(result.success).toBe(false)
  })

  it('rejects notes exceeding 500 chars', () => {
    const result = createAttendanceSchema.safeParse({
      date: '2024-01-15',
      type: 'office',
      notes: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('getAttendanceQuerySchema', () => {
  it('accepts empty query', () => {
    expect(getAttendanceQuerySchema.safeParse({}).success).toBe(true)
  })

  it('accepts month query', () => {
    expect(getAttendanceQuerySchema.safeParse({ month: '2024-01' }).success).toBe(true)
  })

  it('accepts date range query', () => {
    expect(getAttendanceQuerySchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    }).success).toBe(true)
  })

  it('rejects invalid month format', () => {
    expect(getAttendanceQuerySchema.safeParse({ month: '2024' }).success).toBe(false)
  })

  it('rejects startDate without endDate', () => {
    expect(getAttendanceQuerySchema.safeParse({ startDate: '2024-01-01' }).success).toBe(false)
  })

  it('rejects endDate without startDate', () => {
    expect(getAttendanceQuerySchema.safeParse({ endDate: '2024-01-31' }).success).toBe(false)
  })
})

describe('createLocationSchema', () => {
  it('accepts valid input', () => {
    const result = createLocationSchema.safeParse({
      name: 'Office HQ',
      color: '#ff0000',
      transportId: 'abc123',
      distance: 25,
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal required fields', () => {
    const result = createLocationSchema.safeParse({
      name: 'Home',
      color: '#00ff00',
    })
    expect(result.success).toBe(true)
  })

  it('coerces string distance to number', () => {
    const result = createLocationSchema.safeParse({
      name: 'Office',
      color: '#0000ff',
      distance: '30',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.distance).toBe(30)
    }
  })

  it('rejects missing name', () => {
    expect(createLocationSchema.safeParse({ color: '#ff0000' }).success).toBe(false)
  })

  it('rejects missing color', () => {
    expect(createLocationSchema.safeParse({ name: 'Office' }).success).toBe(false)
  })

  it('rejects invalid hex color', () => {
    expect(createLocationSchema.safeParse({
      name: 'Office',
      color: 'red',
    }).success).toBe(false)
  })

  it('rejects negative distance', () => {
    expect(createLocationSchema.safeParse({
      name: 'Office',
      color: '#ff0000',
      distance: -5,
    }).success).toBe(false)
  })
})

describe('updateLocationSchema', () => {
  it('accepts empty object (all optional)', () => {
    expect(updateLocationSchema.safeParse({}).success).toBe(true)
  })

  it('accepts partial update', () => {
    expect(updateLocationSchema.safeParse({ name: 'New Name' }).success).toBe(true)
  })

  it('rejects invalid color', () => {
    expect(updateLocationSchema.safeParse({ color: 'blue' }).success).toBe(false)
  })

  it('rejects negative sortOrder', () => {
    expect(updateLocationSchema.safeParse({ sortOrder: -1 }).success).toBe(false)
  })
})

describe('createTransportSchema', () => {
  it('accepts valid name', () => {
    expect(createTransportSchema.safeParse({ name: 'Car' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(createTransportSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('rejects missing name', () => {
    expect(createTransportSchema.safeParse({}).success).toBe(false)
  })

  it('rejects name over 100 chars', () => {
    expect(createTransportSchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false)
  })
})

describe('updateTransportSchema', () => {
  it('accepts empty object', () => {
    expect(updateTransportSchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid sortOrder', () => {
    expect(updateTransportSchema.safeParse({ sortOrder: 5 }).success).toBe(true)
  })

  it('rejects negative sortOrder', () => {
    expect(updateTransportSchema.safeParse({ sortOrder: -1 }).success).toBe(false)
  })
})

describe('updateSettingsSchema', () => {
  it('accepts empty object', () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid German state', () => {
    expect(updateSettingsSchema.safeParse({ defaultState: 'BY' }).success).toBe(true)
  })

  it('accepts valid workDays', () => {
    expect(updateSettingsSchema.safeParse({ workDays: '1,2,3,4,5' }).success).toBe(true)
  })

  it('accepts single workDay', () => {
    expect(updateSettingsSchema.safeParse({ workDays: '1' }).success).toBe(true)
  })

  it('accepts valid weekStartDay', () => {
    expect(updateSettingsSchema.safeParse({ weekStartDay: 0 }).success).toBe(true)
    expect(updateSettingsSchema.safeParse({ weekStartDay: 1 }).success).toBe(true)
  })

  it('rejects invalid state code', () => {
    expect(updateSettingsSchema.safeParse({ defaultState: 'XX' }).success).toBe(false)
  })

  it('rejects invalid workDays format', () => {
    expect(updateSettingsSchema.safeParse({ workDays: 'abc' }).success).toBe(false)
    expect(updateSettingsSchema.safeParse({ workDays: '1,2,8' }).success).toBe(false)
  })

  it('rejects weekStartDay out of range', () => {
    expect(updateSettingsSchema.safeParse({ weekStartDay: 7 }).success).toBe(false)
    expect(updateSettingsSchema.safeParse({ weekStartDay: -1 }).success).toBe(false)
  })
})

describe('exportQuerySchema', () => {
  it('accepts valid date range with default format', () => {
    const result = exportQuerySchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.format).toBe('csv')
    }
  })

  it('accepts pdf format', () => {
    const result = exportQuerySchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      format: 'pdf',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing startDate', () => {
    expect(exportQuerySchema.safeParse({ endDate: '2024-12-31' }).success).toBe(false)
  })

  it('rejects invalid format', () => {
    expect(exportQuerySchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      format: 'xlsx',
    }).success).toBe(false)
  })
})

describe('holidaysQuerySchema', () => {
  it('accepts empty query', () => {
    expect(holidaysQuerySchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid year and state', () => {
    expect(holidaysQuerySchema.safeParse({ year: '2024', state: 'BW' }).success).toBe(true)
  })

  it('rejects short year', () => {
    expect(holidaysQuerySchema.safeParse({ year: '24' }).success).toBe(false)
  })

  it('rejects invalid state', () => {
    expect(holidaysQuerySchema.safeParse({ state: 'XX' }).success).toBe(false)
  })
})
