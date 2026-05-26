"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateMockAttendanceAnalytics } from "@/lib/attendance-analytics-data"

interface AttendanceAnalyticsPanelProps {
  employeeId: string
  employeeName: string
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function AttendanceAnalyticsPanel({ employeeId, employeeName }: AttendanceAnalyticsPanelProps) {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentDate.getMonth()])
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showTable, setShowTable] = useState(false)

  const analytics = useMemo(() => {
    return generateMockAttendanceAnalytics(employeeId, selectedMonth, selectedYear)
  }, [employeeId, selectedMonth, selectedYear])

  const monthIndex = MONTHS.indexOf(selectedMonth)

  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setSelectedMonth(MONTHS[11])
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(MONTHS[monthIndex - 1])
    }
  }

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setSelectedMonth(MONTHS[0])
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(MONTHS[monthIndex + 1])
    }
  }

  const getDaysInMonth = () => {
    return new Date(selectedYear, monthIndex + 1, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    return new Date(selectedYear, monthIndex, 1).getDay()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "absent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "late":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "overtime":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "leave":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "holiday":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calendarDays = []
  const daysInMonth = getDaysInMonth()
  const firstDay = getFirstDayOfMonth()

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Get record for a specific day
  const getRecordForDay = (day: number) => {
    const dateStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return analytics.dailyRecords.find((r) => r.date === dateStr)
  }

  const selectedDateRecord = selectedDate ? analytics.dailyRecords.find((r) => r.date === selectedDate) : null

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Attendance Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedMonth} {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-32 text-center">
            {selectedMonth} {selectedYear}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Section 1: Monthly Summary Cards */}
    <div>
  <h3 className="text-sm font-semibold text-foreground mb-2">Monthly Summary</h3>

  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
    <Card className="border border-border w-full">
      <CardContent className="p-2">
        <p className="text-[10px] text-muted-foreground">Total Working Days</p>
        <p className="text-base font-bold">{analytics.totalWorkingDays}</p>
      </CardContent>
    </Card>

    <Card className="border border-border w-full">
      <CardContent className="p-2">
        <p className="text-[10px] text-muted-foreground">Present Days</p>
        <p className="text-base font-bold text-green-600">
          {analytics.presentDays}
        </p>
      </CardContent>
    </Card>

    <Card className="border border-border w-full">
      <CardContent className="p-2">
        <p className="text-[10px] text-muted-foreground">Absent Days</p>
        <p className="text-base font-bold text-red-600">
          {analytics.absentDays}
        </p>
      </CardContent>
    </Card>

    <Card className="border border-border w-full">
      <CardContent className="p-2">
        <p className="text-[10px] text-muted-foreground">Late Arrivals</p>
        <p className="text-base font-bold text-yellow-600">
          {analytics.lateArrivals}
        </p>
      </CardContent>
    </Card>

    <Card className="border border-border w-full">
      <CardContent className="p-2">
        <p className="text-[10px] text-muted-foreground">Overtime Hours</p>
        <p className="text-base font-bold text-blue-600">
          {analytics.totalOvertimeHours}h
        </p>
      </CardContent>
    </Card>

    <Card className="border border-border w-full">
      <CardContent className="p-2">
        <p className="text-[10px] text-muted-foreground">Total Hours</p>
        <p className="text-base font-bold">
          {analytics.totalWorkingHours}h
        </p>
      </CardContent>
    </Card>
  </div>
</div>


      {/* Section 2: Attendance Calendar Heatmap */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Attendance Calendar</h3>
        <Card className="border border-border">
          <CardContent className="p-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const record = day ? getRecordForDay(day) : null
                const isSelected =
                  day &&
                  selectedDate ===
                    `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (day && record && record.status !== "holiday") {
                        setSelectedDate(
                          `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                        )
                      }
                    }}
                    disabled={!day || !record || record.status === "holiday"}
                    className={`
                      h-12 rounded-lg text-sm font-medium transition-all
                      ${!day ? "bg-transparent" : ""}
                      ${day && record && record.status === "holiday" ? "bg-gray-100 dark:bg-gray-900/30 text-gray-500 cursor-not-allowed" : ""}
                      ${day && record && record.status !== "holiday" ? `${getStatusColor(record.status)} cursor-pointer hover:opacity-80 ${isSelected ? "ring-2 ring-primary" : ""}` : ""}
                      ${!day ? "" : "cursor-default"}
                    `}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span className="text-xs text-muted-foreground">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                <span className="text-xs text-muted-foreground">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-xs text-muted-foreground">Overtime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <span className="text-xs text-muted-foreground">Holiday</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Daily Timeline View */}
      {selectedDateRecord && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Daily Timeline - {selectedDate}</h3>
          <Card className="border border-border">
            <CardContent className="p-6">
              {selectedDateRecord.status === "absent" ? (
                <p className="text-center text-muted-foreground py-4">No attendance record for this day</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">In Time</p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedDateRecord.inTime}{" "}
                        {selectedDateRecord.lateMinutes > 0 ? `(${selectedDateRecord.lateMinutes}m late)` : ""}
                      </p>
                    </div>
                    <div className="h-1 flex-1 mx-4 bg-gradient-to-r from-green-500 to-blue-500 rounded"></div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Out Time</p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedDateRecord.outTime}{" "}
                        {selectedDateRecord.earlyOutMinutes > 0 ? `(${selectedDateRecord.earlyOutMinutes}m early)` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border flex gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Working Hours</p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedDateRecord.workingHours.toFixed(2)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedDateRecord.status)}>
                        {selectedDateRecord.status.charAt(0).toUpperCase() + selectedDateRecord.status.slice(1)}
                      </Badge>
                    </div>
                    {selectedDateRecord.overtimeMinutes > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Overtime</p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {(selectedDateRecord.overtimeMinutes / 60).toFixed(2)}h
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section 4: Weekly Breakdown Chart */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Weekly Working Hours</h3>
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-end justify-between h-40 gap-2">
              {analytics.weeklyBreakdown.map((week) => (
                <div key={week.week} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 dark:from-blue-600 dark:to-blue-400 rounded-t"
                    style={{ height: `${(week.hours / 48) * 100}%`, minHeight: "20px" }}
                  ></div>
                  <p className="text-xs font-medium text-foreground">{week.hours}h</p>
                  <p className="text-xs text-muted-foreground">W{week.week}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 5: Overtime Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Overtime Breakdown</h3>
        <Card className="border border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Total Overtime</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {analytics.totalOvertimeHours} hrs {Math.floor((analytics.totalOvertimeHours % 1) * 60)} mins
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Max OT in a Single Day</span>
              <span className="text-lg font-bold text-foreground">{analytics.maxOvertimeInDay} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Eligible Shift</span>
              <Badge variant="outline">{analytics.eligibleShift} Shift</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 6: Attendance Statistics */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Attendance Statistics</h3>
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.lateArrivals}</p>
                <p className="text-xs text-muted-foreground mt-1">Late Arrivals</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.earlyExits}</p>
                <p className="text-xs text-muted-foreground mt-1">Early Exit</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.onTimeDays}</p>
                <p className="text-xs text-muted-foreground mt-1">On Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 7: Attendance Table (Collapsible) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Attendance Records</h3>
          <Button variant="outline" size="sm" onClick={() => setShowTable(!showTable)}>
            {showTable ? "Hide" : "Show"} Details
          </Button>
        </div>
        {showTable && (
          <Card className="border border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">In</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Out</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics.dailyRecords.map((record) => (
                      <tr key={record.date} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-foreground">{record.date}</td>
                        <td className="px-4 py-3 text-foreground">{record.inTime || "—"}</td>
                        <td className="px-4 py-3 text-foreground">{record.outTime || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(record.status)} variant="outline">
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium">
                          {record.workingHours > 0 ? `${record.workingHours.toFixed(2)}h` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
