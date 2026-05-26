// Mock attendance analytics data for employees
export interface DailyAttendance {
  date: string
  inTime: string
  outTime: string
  status: "present" | "absent" | "late" | "overtime" | "leave" | "holiday"
  overtimeMinutes: number
  lateMinutes: number
  earlyOutMinutes: number
  workingHours: number
}

export interface AttendanceAnalytics {
  employeeId: string
  month: string
  year: number
  totalWorkingDays: number
  presentDays: number
  absentDays: number
  lateArrivals: number
  earlyExits: number
  onTimeDays: number
  totalOvertimeHours: number
  maxOvertimeInDay: number
  totalWorkingHours: number
  weeklyBreakdown: {
    week: number
    hours: number
  }[]
  dailyRecords: DailyAttendance[]
  eligibleShift: string
}

export const generateMockAttendanceAnalytics = (
  employeeId: string,
  month: string,
  year: number,
): AttendanceAnalytics => {
  const daysInMonth = new Date(year, new Date(`${month} 1, ${year}`).getMonth() + 1, 0).getDate()
  const dailyRecords: DailyAttendance[] = []

  let totalWorkingDays = 0
  let presentDays = 0
  let absentDays = 0
  let lateArrivals = 0
  let earlyExits = 0
  let totalOvertimeHours = 0
  let maxOvertimeInDay = 0
  let totalWorkingHours = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, new Date(`${month} 1, ${year}`).getMonth(), day)
    const dayOfWeek = date.getDay()

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (Math.random() > 0.7) {
        dailyRecords.push({
          date: `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          inTime: "",
          outTime: "",
          status: "holiday",
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyOutMinutes: 0,
          workingHours: 0,
        })
      }
      continue
    }

    totalWorkingDays++
    const random = Math.random()
    let status: DailyAttendance["status"] = "present"
    let inTime = "09:00"
    let outTime = "18:00"
    let overtimeMinutes = 0
    let lateMinutes = 0
    let earlyOutMinutes = 0
    let workingHours = 9

    if (random < 0.05) {
      // 5% absent
      status = "absent"
      inTime = ""
      outTime = ""
      workingHours = 0
      absentDays++
    } else if (random < 0.15) {
      // 10% late
      const lateBy = Math.floor(Math.random() * 45) + 5
      inTime = `09:${String(lateBy).padStart(2, "0")}`
      lateMinutes = lateBy
      status = "late"
      lateArrivals++
      workingHours = 9 - lateMinutes / 60
    } else if (random < 0.2) {
      // 5% early exit
      const earlyBy = Math.floor(Math.random() * 45) + 15
      outTime = `${17 - Math.floor(earlyBy / 60)}:${String(60 - (earlyBy % 60)).padStart(2, "0")}`
      earlyOutMinutes = earlyBy
      status = "present"
      earlyExits++
      workingHours = 9 - earlyOutMinutes / 60
    } else if (random < 0.25) {
      // 5% overtime
      const overtimeHours = Math.floor(Math.random() * 3) + 1
      const overtimeMinutesCount = Math.floor(Math.random() * 60)
      outTime = `${18 + overtimeHours}:${String(overtimeMinutesCount).padStart(2, "0")}`
      overtimeMinutes = overtimeHours * 60 + overtimeMinutesCount
      status = "overtime"
      maxOvertimeInDay = Math.max(maxOvertimeInDay, overtimeMinutes)
      workingHours = 9 + overtimeMinutes / 60
      totalOvertimeHours += overtimeMinutes / 60
    } else {
      status = "present"
      presentDays++
    }

    totalWorkingHours += workingHours

    dailyRecords.push({
      date: `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      inTime,
      outTime,
      status,
      overtimeMinutes,
      lateMinutes,
      earlyOutMinutes,
      workingHours,
    })
  }

  // Calculate weekly breakdown
  const weeklyBreakdown = []
  let currentWeek = 1
  let weekHours = 0
  for (let i = 0; i < dailyRecords.length; i++) {
    const record = dailyRecords[i]
    if (record.status !== "holiday") {
      weekHours += record.workingHours
    }
    if ((i + 1) % 7 === 0 || i === dailyRecords.length - 1) {
      weeklyBreakdown.push({ week: currentWeek, hours: Math.round(weekHours * 100) / 100 })
      weekHours = 0
      currentWeek++
    }
  }

  const onTimeDays = presentDays + (totalWorkingDays - presentDays - absentDays - lateArrivals - earlyExits)

  return {
    employeeId,
    month,
    year,
    totalWorkingDays,
    presentDays,
    absentDays,
    lateArrivals,
    earlyExits,
    onTimeDays,
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    maxOvertimeInDay: Math.round((maxOvertimeInDay / 60) * 100) / 100,
    totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
    weeklyBreakdown,
    dailyRecords,
    eligibleShift: ["Morning", "Evening", "Night"][Math.floor(Math.random() * 3)],
  }
}
