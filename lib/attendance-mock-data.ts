import type { LiveAttendanceData } from "./attendance-types"

export const MOCK_LIVE_ATTENDANCE: LiveAttendanceData[] = [
  {
    employeeId: "ab324031",
    employeeName: "Rajesh Kumar",
    employeeRole: "Operator",
    status: "clocked-in",
    clockInTime: "07:55 AM",
    latestPunchTime: "02:38 PM",
    workedHours: 4,
    workedMinutes: 22,
    pay: 95.40,
    remainingHours: 4,
    remainingMinutes: 38,
    shiftStartTime: "08:00 AM",
    shiftEndTime: "05:00 PM",
    inside: true,
    lateBy: "0m",
    punchDetails: [
      {
        id: "punch-1",
        employeeId: "ab324031",
        employeeName: "Rajesh Kumar",
        attendanceDate: "2026-02-08",
        punchType: "IN",
        punchTime: "07:55 AM",
        source: "MOBILE_APP"
      },
      {
        id: "punch-2",
        employeeId: "ab324031",
        employeeName: "Rajesh Kumar",
        attendanceDate: "2026-02-08",
        punchType: "OUT",
        punchTime: "02:38 PM",
        source: "BIOMETRIC"
      }
    ]
  },
  {
    employeeId: "bded89ff",
    employeeName: "Vignesh",
    employeeRole: "Operator",
    status: "on-break",
    clockInTime: "08:45 AM",
    latestPunchTime: "02:30 PM",
    workedHours: 4,
    workedMinutes: 22,
    pay: 95.40,
    remainingHours: 4,
    remainingMinutes: 38,
    shiftStartTime: "08:00 AM",
    shiftEndTime: "05:00 PM",
    inside: false,
    lateBy: "45m",
    punchDetails: [
      {
        id: "punch-3",
        employeeId: "bded89ff",
        employeeName: "Vignesh",
        attendanceDate: "2026-02-08",
        punchType: "IN",
        punchTime: "08:45 AM",
        source: "BIOMETRIC"
      }
    ]
  },
  {
    employeeId: "emp-3",
    employeeName: "Amit Verma",
    employeeRole: "Operator",
    status: "missing-punch",
    clockInTime: "09:00 AM",
    latestPunchTime: "12:00 PM",
    workedHours: 3,
    workedMinutes: 0,
    pay: 75.00,
    remainingHours: 6,
    remainingMinutes: 0,
    shiftStartTime: "08:00 AM",
    shiftEndTime: "05:00 PM",
    inside: false,
    lateBy: "1h",
    punchDetails: [
      {
        id: "punch-4",
        employeeId: "emp-3",
        employeeName: "Amit Verma",
        attendanceDate: "2026-02-08",
        punchType: "IN",
        punchTime: "09:00 AM",
        source: "MOBILE_APP"
      }
    ]
  },
  {
    employeeId: "emp-4",
    employeeName: "Neha Sharma",
    employeeRole: "Office Staff",
    status: "not-clocked",
    clockInTime: "--",
    latestPunchTime: "--",
    workedHours: 0,
    workedMinutes: 0,
    pay: 0,
    remainingHours: 8,
    remainingMinutes: 30,
    shiftStartTime: "08:30 AM",
    shiftEndTime: "05:00 PM",
    inside: false,
    lateBy: "--",
    punchDetails: []
  },
  {
    employeeId: "emp-5",
    employeeName: "Vikram Singh",
    employeeRole: "Operator",
    status: "clocked-in",
    clockInTime: "08:30 AM",
    latestPunchTime: "01:15 PM",
    workedHours: 4,
    workedMinutes: 45,
    pay: 118.75,
    remainingHours: 4,
    remainingMinutes: 15,
    shiftStartTime: "08:00 AM",
    shiftEndTime: "05:00 PM",
    inside: true,
    lateBy: "30m",
    punchDetails: [
      {
        id: "punch-5",
        employeeId: "emp-5",
        employeeName: "Vikram Singh",
        attendanceDate: "2026-02-08",
        punchType: "IN",
        punchTime: "08:30 AM",
        source: "BIOMETRIC"
      }
    ]
  },
  {
    employeeId: "emp-late-1",
    employeeName: "Priya Patel",
    employeeRole: "Operator",
    status: "clocked-in",
    clockInTime: "09:15 AM",
    latestPunchTime: "02:45 PM",
    workedHours: 5,
    workedMinutes: 30,
    pay: 137.50,
    remainingHours: 3,
    remainingMinutes: 30,
    shiftStartTime: "09:00 AM",
    shiftEndTime: "06:00 PM",
    inside: true,
    lateBy: "15m",
    punchDetails: [
      {
        id: "punch-6",
        employeeId: "emp-late-1",
        employeeName: "Priya Patel",
        attendanceDate: "2026-02-08",
        punchType: "IN",
        punchTime: "09:15 AM",
        source: "MOBILE_APP"
      }
    ]
  },
]

export const getStatusColor = (status: string) => {
  switch (status) {
    case "clocked-in":
      return "border-green-400 bg-green-50 dark:bg-green-950"
    case "on-break":
      return "border-red-400 bg-red-50 dark:bg-red-950"
    case "missing-punch":
      return "border-red-400 bg-red-50 dark:bg-red-950"
    case "not-clocked":
      return "border-gray-400 bg-gray-50 dark:bg-gray-950"
    default:
      return "border-gray-400 bg-gray-50 dark:bg-gray-950"
  }
}

export const getStatusBgColor = (status: string) => {
  switch (status) {
    case "clocked-in":
      return "#E8F8EF"
    case "on-break":
      return "#FDECEC"
    case "missing-punch":
      return "#FDECEC"
    case "not-clocked":
      return "#F5F5F5"
    default:
      return "#F5F5F5"
  }
}
