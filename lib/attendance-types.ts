export type AttendanceStatus = "WORKING" | "ON_BREAK" | "LEFT" | "ABSENT"

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  status: AttendanceStatus
  clockInTime: string
  latestPunchTime: string
  workedHours: number
  workedMinutes: number
  pay: number
  shiftStartTime: string
  shiftEndTime: string
}

export interface PunchDetail {
  id: string
  employeeId: string
  employeeName: string
  attendanceDate: string
  punchType: "IN" | "OUT"
  punchTime: string
  source: string
}

export interface LiveAttendanceEmployee {
  employeeId: string
  employeeName: string
  role: string
  status: AttendanceStatus
  inside: boolean
  shiftTiming: string
  overtimeShift: boolean
  latestIn: string
  latestOut: string
  workedHours: string
  remainingHours: string
  lateBy: string
  punchDetails: PunchDetail[]
}

export interface LiveAttendanceStats {
  totalEmployees: number
  working: number
  onBreak: number
  left: number
  absent: number
}

export interface LiveAttendanceResponse {
  stats: LiveAttendanceStats
  employees: LiveAttendanceEmployee[]
}

// Legacy type for backwards compatibility
export interface LiveAttendanceData {
  employeeId: string
  employeeName: string
  employeeRole: string
  profileImage?: string
  status: AttendanceStatus
  clockInTime: string
  latestPunchTime: string
  workedHours: number
  workedMinutes: number
  pay: number
  remainingHours: number
  remainingMinutes: number
  shiftStartTime: string
  shiftEndTime: string
  inside: boolean
  lateBy: string
  punchDetails?: PunchDetail[]
}
