export interface RegularShift {
  id: string
  shiftId?: string // Added shiftId to store the backend shift ID
  shiftName: string
  amountType: "Per Shift" | "Per Day" | "Per Hour" | "Per Month"
  amount: number
  extraAllowance?: number
}

export interface OvertimeShift {
  id: string
  shiftId?: string // Added shiftId to store the backend shift ID
  shiftName: string
  amountType: "Per Shift" | "Per Hour" | "Per Day" | "Per Month"
  amount: number
  extraAllowance?: number
}

export type WorkdayPolicy = "Include All Days" | "Exclude Sundays" | "Exclude Saturdays & Sundays"

export interface SalaryConfiguration {
  frequency: "By Day" | "By Week" | "By Month"
  workdayPolicy: WorkdayPolicy
}

export interface Employee {
  id: string
  name: string
  employeeId: string
  phone: string
  email?: string
  pan?: string
  aadhaar?: string
  profileImage?: string
  gender?: "Male" | "Female" | "Other"
  role: string
  status: "Active" | "Inactive"
  regularShifts: RegularShift[]
  overtimeShifts: OvertimeShift[]
  salaryConfig: SalaryConfiguration
  createdAt: string
  updatedAt: string
}

export interface ValidationError {
  field: string
  message: string
}

export interface EmployeeVersion {
  version: number
  timestamp: string
  endTimestamp?: string // Added optional end timestamp for date range display
  changedBy: string
  employee: Employee
}
