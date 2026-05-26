export interface Payslip {
  id: string
  employeeId: string
  employeeName: string
  employeeRole: string
  month: string
  year: number
  basicPay: number
  shiftPay: number
  overtime: number
  allowances: number
  lunchAllowance: number
  lateDeduction: number
  leaveDeduction: number
  totalEarnings: number
  totalDeductions: number
  netSalary: number
  status: 'generated' | 'pending'
  generatedDate: string
}

export interface Employee {
  id: string
  name: string
  role: string
  profilePicture: string
  status: 'active' | 'inactive'
}
