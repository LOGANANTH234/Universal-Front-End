import type { Employee, ValidationError } from "./employee-types"
import type { Shift } from "./types"

export const validateEmployee = (employee: Partial<Employee>): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!employee.name?.trim()) {
    errors.push({ field: "name", message: "Employee Name is required." })
  }

  if (!employee.employeeId?.trim()) {
    errors.push({ field: "employeeId", message: "Employee ID is required." })
  }

  if (!employee.phone?.trim()) {
    errors.push({ field: "phone", message: "Phone number is required." })
  } else if (!/^\d{10}$/.test(employee.phone.replace(/\D/g, ""))) {
    errors.push({ field: "phone", message: "Phone number must be 10 digits." })
  }

  if (!employee.gender?.trim()) {
    errors.push({ field: "gender", message: "Gender is required." })
  }

  if (!employee.status?.trim()) {
    errors.push({ field: "status", message: "Status is required." })
  }

  if (!employee.salaryConfig?.frequency?.trim()) {
    errors.push({ field: "salaryFrequency", message: "Salary Frequency is required." })
  }

  if (!employee.salaryConfig?.workdayPolicy?.trim()) {
    errors.push({ field: "workdayPolicy", message: "Workday Policy is required." })
  }

  if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    errors.push({ field: "email", message: "Invalid email format." })
  }

  if (employee.pan && !/^[A-Z0-9]{10}$/.test(employee.pan)) {
    errors.push({ field: "pan", message: "PAN must be 10 alphanumeric characters." })
  }

  if (employee.aadhaar && !/^\d{12}$/.test(employee.aadhaar.replace(/\D/g, ""))) {
    errors.push({ field: "aadhaar", message: "Aadhaar must be 12 digits." })
  }

  if (employee.regularShifts && employee.regularShifts.length > 0) {
    employee.regularShifts.forEach((shift, idx) => {
      if (!shift.shiftName) {
        errors.push({ field: `regularShift-${idx}`, message: "Shift name is required." })
      }
      if (!shift.amountType) {
        errors.push({ field: `regularShift-${idx}`, message: "Amount type is required." })
      }
      if (!shift.amount || shift.amount <= 0) {
        errors.push({ field: `regularShift-${idx}`, message: "Amount must be greater than 0." })
      }
    })

    const shiftNames = new Set(employee.regularShifts.map((s) => s.shiftName))
    if (shiftNames.size !== employee.regularShifts.length) {
      errors.push({ field: "regularShifts", message: "Duplicate shift not allowed." })
    }
  }

  if (employee.overtimeShifts && employee.overtimeShifts.length > 0) {
    employee.overtimeShifts.forEach((shift, idx) => {
      if (!shift.shiftName) {
        errors.push({ field: `overtimeShift-${idx}`, message: "Shift name is required." })
      }
      if (!shift.amountType) {
        errors.push({ field: `overtimeShift-${idx}`, message: "Amount type is required." })
      }
      if (!shift.amount || shift.amount <= 0) {
        errors.push({ field: `overtimeShift-${idx}`, message: "Amount must be greater than 0." })
      }
    })

    const regularShiftNames = new Set(employee.regularShifts?.map((s) => s.shiftName) || [])
    const overtimeShiftNames = new Set(employee.overtimeShifts.map((s) => s.shiftName))
    const duplicates = [...overtimeShiftNames].filter((name) => regularShiftNames.has(name))
    if (duplicates.length > 0) {
      errors.push({ field: "overtimeShifts", message: "Overtime shift names must not duplicate regular shifts." })
    }

    if (overtimeShiftNames.size !== employee.overtimeShifts.length) {
      errors.push({ field: "overtimeShifts", message: "Duplicate overtime shift not allowed." })
    }
  }

  return errors
}

export const getAvailableShiftsForRegular = (): string[] => {
  return ["Morning Shift", "Afternoon Shift", "Evening Shift", "Night Shift"]
}

export const getAvailableShiftsForOvertime = (regularShiftNames: string[]): string[] => {
  const allShifts = getAvailableShiftsForRegular()
  return allShifts.filter((shift) => !regularShiftNames.includes(shift))
}

export const getWorkingDaysForPolicy = (policy: string): number => {
  switch (policy) {
    case "Include All Days":
      return 30
    case "Exclude Sundays":
      return 26
    case "Exclude Saturdays & Sundays":
      return 22
    default:
      return 26
  }
}

export const checkShiftOverlap = (
  newShift: { startTime: string; endTime: string },
  existingShifts: { shiftName: string; startTime: string; endTime: string }[],
  shifts: Shift[],
): { overlaps: boolean; conflictingShift?: string } => {
  for (const existing of existingShifts) {
    const newStart = timeToMinutes(newShift.startTime)
    const newEnd = timeToMinutes(newShift.endTime)
    const existStart = timeToMinutes(existing.startTime)
    const existEnd = timeToMinutes(existing.endTime)

    if (newStart < existEnd && newEnd > existStart) {
      return { overlaps: true, conflictingShift: existing.shiftName }
    }
  }
  return { overlaps: false }
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export const checkGlobalShiftOverlap = (
  newShift: { startTime: string; endTime: string },
  regularShifts: any[],
  overtimeShifts: any[],
  shifts: Shift[],
): { overlaps: boolean; conflictingShift?: string } => {
  const allExistingShifts = [
    ...regularShifts.map((s) => {
      const shift = shifts.find((ms) => ms.name === s.shiftName)
      return shift ? { shiftName: s.shiftName, startTime: shift.startTime, endTime: shift.endTime } : null
    }),
    ...overtimeShifts.map((s) => {
      const shift = shifts.find((ms) => ms.name === s.shiftName)
      return shift ? { shiftName: s.shiftName, startTime: shift.startTime, endTime: shift.endTime } : null
    }),
  ].filter((s) => s !== null)

  return checkShiftOverlap(newShift, allExistingShifts, shifts)
}

export const calculateEstimatedMonthlyPay = (
  regularShifts: any[],
  frequency: string,
  workdayPolicy: string,
): number => {
  if (!regularShifts || regularShifts.length === 0) return 0

  const workingDays = getWorkingDaysForPolicy(workdayPolicy)
  const shiftsPerMonth = workingDays

  let totalPay = 0

  regularShifts.forEach((shift) => {
    if (!shift.amount || shift.amount <= 0) return

    switch (shift.amountType) {
      case "Per Day":
        totalPay += shift.amount * workingDays
        break
      case "Per Shift":
        totalPay += shift.amount * shiftsPerMonth
        break
      case "Per Hour":
        totalPay += shift.amount * shiftsPerMonth * 8
        break
      case "Per Month":
        totalPay += shift.amount
        break
    }
  })

  return Math.round(totalPay)
}
