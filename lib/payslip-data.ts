// lib/payslip-data.ts
// All hardcoded mock payslip/employee data removed.
// Real data is served from the backend via /api/pdf/getEmployeesForPayslip

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Kept as empty arrays so existing imports don't break at compile time.
// Nothing in the app should read from these — they will always be empty.
export const mockPayslips: never[] = []
export const mockEmployees: never[] = []
