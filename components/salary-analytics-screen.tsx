"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, parseISO, isSameMonth } from "date-fns"
import {
  Calendar as CalendarIcon, Loader2, IndianRupee, Clock,
  Fingerprint, Monitor, Pencil, Bot, Edit2, Trash2, Plus, TrendingUp, X,
  ChevronLeft, ChevronRight
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchableComboBox } from "./searchable-combo-box"
import { useAuth } from "@/lib/contexts/auth-context"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MonthYearCalendar } from "./month-year-calendar"
import PunchAddModal from "./punch-add-modal"
import PunchEditModal from "./punch-edit-modal"
import PunchDeleteModal from "./punch-delete-modal"
import { ModuleTrialBanner } from "./module-trial-banner"

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return "—"
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function isZeroTime(t?: string | null): boolean {
  if (!t) return true
  const s = t.trim()
  return s === "0h 0m" || s === "0h:0m" || s === "0m" || s === "0" || s === "00:00" || s === "00:00:00"
}

function SourceIcon({ source }: { source: string }) {
  if (source === "MANUAL") return <Pencil className="h-3.5 w-3.5 text-blue-500" />
  if (source === "SYSTEM_AUTO") return <Bot className="h-3.5 w-3.5 text-purple-500" />
  return <Monitor className="h-3.5 w-3.5 text-gray-400" />
}

function SourceLabel({ source }: { source: string }): string {
  if (source === "MANUAL") return "Manual"
  if (source === "SYSTEM_AUTO") return "System auto"
  return "Hikvision"
}

// Custom Calendar since Shadcn Calendar might be hard to style per-day for v9
// We will build a simple CSS Grid calendar for analytics

type DailyStatus = {
  date: string
  status: "FULL_DAY" | "HALF_DAY" | "SHORTAGE" | "ABSENT" | "HOLIDAY" | "SUNDAY" | "SATURDAY"
  earned: number
  deduction: number
  workedMinutes?: number
  expectedMinutes?: number
  shortageMinutes?: number
  expectedPay?: number
  overtimePay?: number
}

type SalaryAnalytics = {
  totalEarned: number
  expectedSalary: number
  expectedRegularSalary?: number
  earnedRegularSalary?: number
  earnedOvertimeSalary?: number
  totalRegularAndOt?: number
  perDaySalary?: number
  totalDeductions: number
  workingDays: number
  presentDays: number
  halfDays: number
  absentDays: number
  dailyStatuses: DailyStatus[]
}

const STATUS_COLORS = {
  FULL_DAY: "bg-emerald-500",
  HALF_DAY: "bg-yellow-400",
  SHORTAGE: "bg-orange-400",
  ABSENT: "bg-red-500",
  HOLIDAY: "bg-slate-300",
  SUNDAY: "bg-slate-300"
}

const STATUS_CARD_STYLES: Record<string, { bg: string; border: string; text: string; subtext: string; badge: string }> = {
  FULL_DAY: {
    bg: "bg-gradient-to-br from-emerald-100/95 via-emerald-200/90 to-emerald-200 dark:from-emerald-950/75 dark:via-emerald-900/40 dark:to-teal-950/60",
    border: "border-emerald-300/80 dark:border-emerald-500/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[0_0_14px_rgba(16,185,129,0.15)]",
    text: "text-emerald-950 dark:text-emerald-200",
    subtext: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50"
  },
  HALF_DAY: {
    bg: "bg-gradient-to-br from-amber-100/95 via-yellow-200/90 to-yellow-200 dark:from-amber-950/80 dark:via-yellow-950/50 dark:to-amber-900/40",
    border: "border-yellow-300/80 dark:border-amber-400/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    text: "text-yellow-950 dark:text-amber-200",
    subtext: "text-yellow-700 dark:text-amber-300",
    badge: "bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-400/60"
  },
  SHORTAGE: {
    bg: "bg-gradient-to-br from-orange-100/95 via-orange-200/90 to-orange-200 dark:from-purple-950/80 dark:via-violet-950/55 dark:to-indigo-950/60",
    border: "border-orange-300/80 dark:border-purple-500/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[0_0_16px_rgba(168,85,247,0.22)]",
    text: "text-orange-950 dark:text-purple-200",
    subtext: "text-orange-700 dark:text-purple-300",
    badge: "bg-orange-500/15 dark:bg-purple-500/25 text-orange-900 dark:text-purple-200 border-orange-300 dark:border-purple-400/60"
  },
  ABSENT: {
    bg: "bg-gradient-to-br from-rose-100/95 via-red-200/90 to-red-200 dark:from-rose-950/85 dark:via-red-950/60 dark:to-rose-950/75",
    border: "border-red-300/80 dark:border-red-500/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[0_0_16px_rgba(239,68,68,0.22)]",
    text: "text-red-950 dark:text-rose-200",
    subtext: "text-red-700 dark:text-rose-400",
    badge: "bg-rose-500/15 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-500/60"
  },
  HOLIDAY: {
    bg: "bg-gradient-to-br from-slate-100/95 via-slate-200/80 to-slate-200 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-800/70",
    border: "border-slate-300/80 dark:border-slate-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none",
    text: "text-slate-700 dark:text-slate-400",
    subtext: "text-slate-500 dark:text-slate-500",
    badge: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700"
  },
  SUNDAY: {
    bg: "bg-gradient-to-br from-slate-100/95 via-slate-200/80 to-slate-200 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-800/70",
    border: "border-slate-300/80 dark:border-slate-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none",
    text: "text-slate-600 dark:text-slate-500",
    subtext: "text-slate-400 dark:text-slate-500",
    badge: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
  },
  SATURDAY: {
    bg: "bg-gradient-to-br from-slate-100/95 via-slate-200/80 to-slate-200 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-800/70",
    border: "border-slate-300/80 dark:border-slate-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none",
    text: "text-slate-600 dark:text-slate-500",
    subtext: "text-slate-400 dark:text-slate-500",
    badge: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
  },
}

export function SalaryAnalyticsScreen() {
  const { auth } = useAuth()
  const [employees, setEmployees] = useState<{ label: string; value: string }[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const [analytics, setAnalytics] = useState<SalaryAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const toggleFilter = (status: string) => {
    setSelectedFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const clearFilters = () => {
    setSelectedFilters([])
  }

  // Punch Details & Salary Breakdown state
  type AttendancePunch = {
    id: number
    attendanceDate: string
    punchTime: string
    punchType: string
    source: string
  }

  interface ShiftBreakdownDto {
    shiftName: string
    shiftTiming: string
    amountType: string
    type: string
    reqMinutes: string
    paidMinutes: string
    amountPerHour: number
    salary: number
    allowance: number
    penaltyMinutes: string
    penaltyAmount: number
    total: number
  }

  interface DailySalaryDetail {
    id?: number
    employeeId?: string
    employeeName?: string
    workDate?: string
    workDuration?: string
    salaryMinutes?: number
    payableMinutes?: string
    regularSalary?: number
    overtimeSalary?: number
    extraAllowance?: number
    warningCount?: number
    penaltyMinutes?: string
    penaltyAmount?: number
    netSalary?: number
    shiftBreakdown?: ShiftBreakdownDto[]
    punches?: AttendancePunch[]
  }

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayDetail, setDayDetail] = useState<DailySalaryDetail | null>(null)
  const [punches, setPunches] = useState<AttendancePunch[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [activeDetailTab, setActiveDetailTab] = useState<"ALL" | "PUNCHES" | "BREAKDOWN">("ALL")

  // Punch action modals
  const [selectedPunch, setSelectedPunch] = useState<AttendancePunch | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const canEditPunches = useHasAction(MODULES.VIEW_EDIT_PUNCHES, ACTIONS.PUNCHES_EDIT) ?? true

  // Fetch employees on mount
  useEffect(() => {
    async function fetchEmployees() {
      if (!auth?.token) return
      try {
        const res = await fetch("http://13.206.112.19:8080/api/employees/getAllPermittedEmployees", {
          headers: { Authorization: `Bearer ${auth.token}` }
        })
        if (!res.ok) throw new Error("Failed to fetch employees")
        const data = await res.json()
        const empList = data.map((e: any) => ({
          value: e.employeeId,
          label: `${e.employeeId} - ${e.employeeName}`
        }))
        setEmployees(empList)
        if (empList.length > 0) {
          setSelectedEmployee(prev => prev || empList[0].value)
        }
      } catch (err) {
        console.error("Error fetching employees", err)
      }
    }
    fetchEmployees()
  }, [auth?.token])

  // Fetch analytics when employee or month changes
  const fetchAnalytics = useCallback(async () => {
    if (!selectedEmployee || !auth?.token) return
    setLoading(true)
    setError(null)
    try {
      const monthStr = format(currentMonth, "yyyy-MM") // e.g. "2026-08"
      const res = await fetch(`http://13.206.112.19:8080/api/payrolls/getSalaryAnalytics?employeeId=${selectedEmployee}&month=${monthStr}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch salary analytics")
      const data = await res.json()
      setAnalytics(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedEmployee, currentMonth, auth?.token])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Reset selected date, punches, and filters when employee or month changes
  useEffect(() => {
    setSelectedDate(null)
    setDayDetail(null)
    setPunches([])
    setSelectedFilters([])
  }, [selectedEmployee, currentMonth])

  // Fetch day detail & punches for a clicked day
  const fetchDayDetails = useCallback(async (dateStr: string) => {
    if (!selectedEmployee || !auth?.token) return
    setDetailsLoading(true)
    try {
      const res = await fetch(
        `http://13.206.112.19:8080/api/payrolls/getDailySalaryDetail?employeeId=${selectedEmployee}&date=${dateStr}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setDayDetail(data)
        setPunches(data.punches || [])
      } else {
        setDayDetail(null)
        setPunches([])
      }
    } catch (err) {
      console.error("Failed to fetch day details", err)
      setDayDetail(null)
      setPunches([])
    } finally {
      setDetailsLoading(false)
    }
  }, [selectedEmployee, auth?.token])

  // Generate Calendar Days
  const daysInMonth = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = []

    // Fill leading empty days
    const startDay = start.getDay() // 0 = Sunday
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    // Fill days
    for (let d = 1; d <= end.getDate(); d++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))
    }
    return days
  }

  const handleDayClick = (day: Date, statusInfo: DailyStatus) => {
    setSelectedDate(statusInfo.date)
    fetchDayDetails(statusInfo.date)
  }

  const handleDeletePunch = async (punchId: string) => {
    if (!auth?.token) throw new Error("Unauthorized – please login again.")

    const response = await fetch(`http://13.206.112.19:8080/api/punch/delete/${punchId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const errorMsg =
        errorData?.message ||
        errorData?.validationMessages?.[0] ||
        `Delete failed: ${response.statusText}`
      throw new Error(errorMsg)
    }

    setIsDeleteModalOpen(false)
    if (selectedDate) {
      await fetchDayDetails(selectedDate)
    }
    await fetchAnalytics()
  }

  const toPunchModalShape = (p: AttendancePunch) => {
    const empName = employees.find(e => e.value === selectedEmployee)?.label?.split(" - ")[1] || ""
    return {
      id: p.id.toString(),
      employeeId: selectedEmployee ?? "",
      employeeName: empName,
      date: p.attendanceDate,
      time: p.punchTime,
      type: p.punchType as "IN" | "OUT",
      source: p.source,
      shift: "Morning",
      note: "",
      status: "valid" as const,
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-75px)] p-6 space-y-6 w-full bg-gradient-to-br from-slate-50 via-slate-100/70 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* 3D Ambient Mesh & Light Orbs */}
      <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-transparent dark:from-blue-600/10 dark:via-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/2 -left-28 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-400/15 via-teal-300/10 to-transparent dark:from-emerald-600/10 dark:via-teal-500/5 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-32 right-1/4 w-[450px] h-[450px] bg-gradient-to-t from-violet-400/10 via-amber-300/10 to-transparent dark:from-violet-600/10 dark:via-amber-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* 3D Dot Grid for spatial perspective */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-[0.22] dark:opacity-[0.18] pointer-events-none -z-0" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Salary Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Analyze salary deductions and attendance visually.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-[300px]">
              <SearchableComboBox
                options={employees}
                value={selectedEmployee || ""}
                onValueChange={(val: string) => setSelectedEmployee(val)}
                placeholder="Select employee..."
              />
            </div>

            {/* ── Month picker with prev / next navigation ── */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Previous month */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0"
                onClick={handlePrevMonth}
                title="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Calendar popover */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                    <span className="font-medium text-sm">{format(currentMonth, "MMMM yyyy")}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="start">
                  <MonthYearCalendar
                    selected={currentMonth}
                    onSelect={d => {
                      setCurrentMonth(d)
                      setIsCalendarOpen(false)
                    }}
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>

              {/* Next month */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0"
                onClick={handleNextMonth}
                title="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {!selectedEmployee ? (
          <Card className="border-dashed border-2 shadow-none bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center h-[400px] text-slate-400 dark:text-slate-500">
              <IndianRupee className="h-16 w-16 mb-4 opacity-20" />
              <p>Select an employee to view salary analytics.</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </CardContent>
          </Card>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 rounded-lg">{error}</div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Dashboard Strip */}
            {(() => {
              const expectedRegular = analytics.expectedRegularSalary ?? analytics.expectedSalary ?? 0
              const earnedRegular = analytics.earnedRegularSalary ?? (analytics.dailyStatuses || []).reduce((sum, s) => {
                const ot = s.overtimePay || 0
                const reg = Math.max(0, (s.earned || 0) - ot)
                return sum + reg
              }, 0)
              const earnedOt = analytics.earnedOvertimeSalary ?? (analytics.dailyStatuses || []).reduce((sum, s) => sum + (s.overtimePay || 0), 0)
              const otPlusRegular = analytics.totalRegularAndOt ?? (earnedRegular + earnedOt)

              return (
                <Card className="border-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-[0_12px_36px_-6px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.85)_inset,0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset] rounded-2xl overflow-hidden">
                  <CardContent className="p-0 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">

                    {/* 1: Expected Regular Salary */}
                    <div className="p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expected Regular</p>
                      <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-1">₹{expectedRegular.toFixed(2)}</p>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">Per-day: ₹{(analytics.perDaySalary || 0).toFixed(2)}</p>
                    </div>

                    {/* 2: Earned Regular Salary */}
                    <div className="p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Earned Regular</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">₹{earnedRegular.toFixed(2)}</p>
                      <p className="text-[10.5px] text-emerald-600/80 dark:text-emerald-500/80 font-medium mt-0.5">Base regular pay</p>
                    </div>

                    {/* 3: OT + Regular */}
                    <div className="p-4 flex flex-col justify-center bg-indigo-50/25 dark:bg-indigo-950/20">
                      <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">OT + Regular</p>
                      <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-0.5">₹{otPlusRegular.toFixed(2)}</p>
                      <p className="text-[10.5px] text-purple-700 dark:text-purple-400 font-semibold mt-0.5">
                        {earnedOt > 0 ? `Incl. OT: +₹${earnedOt.toFixed(2)}` : "No OT hours"}
                      </p>
                    </div>

                    {/* 4: Total Deductions */}
                    <div className="p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Deductions</p>
                      <p className="text-xl font-bold text-red-500 dark:text-red-400 mt-1">₹{analytics.totalDeductions.toFixed(2)}</p>
                      <p className="text-[10.5px] text-red-400 dark:text-red-500 mt-0.5">Shortage & penalties</p>
                    </div>

                    {/* 5: Per-Day Salary */}
                    <div className="p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Per-Day Salary</p>
                      <p className="text-xl font-semibold text-slate-600 dark:text-slate-300 mt-1">₹{(analytics.perDaySalary || 0).toFixed(2)}</p>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">Daily baseline rate</p>
                    </div>

                    {/* 6: Attendance Summary */}
                    <div className="p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Attendance Summary</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <span>{analytics.workingDays}</span><span className="text-[10px] font-normal uppercase">Days</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <span>{analytics.presentDays}</span><span className="text-[10px] font-normal uppercase">Pres</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <span>{analytics.halfDays}</span><span className="text-[10px] font-normal uppercase">Half</span>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <span>{analytics.absentDays}</span><span className="text-[10px] font-normal uppercase">Abs</span>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              )
            })()}

            {/* Master-Detail View: Calendar + Punch Details Side Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7">
                <Card className="h-full border-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-[0_20px_48px_-10px_rgba(15,23,42,0.09),0_0_0_1px_rgba(255,255,255,0.85)_inset] dark:shadow-[0_20px_48px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset] rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Monthly Breakdown</CardTitle>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Legend / Multi-filter Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium tracking-wide">
                          {[
                            { label: 'Full Day', status: 'FULL_DAY', dot: 'bg-emerald-500', activeRing: 'ring-2 ring-emerald-500/40 border-emerald-300 dark:border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold bg-emerald-50/80 dark:bg-emerald-950/70 shadow-xs' },
                            { label: 'Half Day', status: 'HALF_DAY', dot: 'bg-yellow-400 dark:bg-amber-400', activeRing: 'ring-2 ring-yellow-500/40 dark:ring-amber-500/40 border-yellow-300 dark:border-amber-400 text-yellow-950 dark:text-amber-200 font-bold bg-yellow-50/80 dark:bg-amber-950/70 shadow-xs' },
                            { label: 'Shortage', status: 'SHORTAGE', dot: 'bg-orange-400 dark:bg-purple-400', activeRing: 'ring-2 ring-orange-500/40 dark:ring-purple-500/40 border-orange-300 dark:border-purple-500 text-orange-950 dark:text-purple-200 font-bold bg-orange-50/80 dark:bg-purple-950/70 shadow-xs' },
                            { label: 'Absent', status: 'ABSENT', dot: 'bg-red-500', activeRing: 'ring-2 ring-red-500/40 border-red-300 dark:border-red-500 text-red-950 dark:text-rose-200 font-bold bg-red-50/80 dark:bg-red-950/70 shadow-xs' },
                            { label: 'Holiday', status: 'HOLIDAY', dot: 'bg-slate-400', activeRing: 'ring-2 ring-slate-400/40 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 font-bold bg-slate-100/90 dark:bg-slate-800/80 shadow-xs' }
                          ].map(filter => {
                            const isSelected = selectedFilters.includes(filter.status);
                            return (
                              <button
                                key={filter.status}
                                onClick={() => toggleFilter(filter.status)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${isSelected
                                    ? filter.activeRing
                                    : selectedFilters.length > 0
                                      ? 'opacity-40 hover:opacity-100 bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 shadow-2xs'
                                  }`}
                              >
                                <div className={`w-2.5 h-2.5 rounded-full ${filter.dot}`} />
                                {filter.label}
                              </button>
                            );
                          })}

                          {/* Clear Button */}
                          {selectedFilters.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                              className="h-8 px-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 gap-1 rounded-xl shadow-2xs transition-all"
                            >
                              <X className="w-3.5 h-3.5 text-rose-500" />
                              Clear
                            </Button>
                          )}
                        </div>

                        {/* Combo Box */}
                        <div className="w-[140px]">
                          <Select
                            value={selectedFilters.length === 0 ? "ALL" : selectedFilters.length === 1 ? selectedFilters[0] : "MULTIPLE"}
                            onValueChange={(val) => {
                              if (val === "ALL") {
                                clearFilters()
                              } else {
                                toggleFilter(val)
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl shadow-2xs">
                              <SelectValue placeholder="All Days">
                                {selectedFilters.length === 0
                                  ? "All Days"
                                  : selectedFilters.length === 1
                                    ? [
                                      { label: 'Full Day', status: 'FULL_DAY' },
                                      { label: 'Half Day', status: 'HALF_DAY' },
                                      { label: 'Shortage', status: 'SHORTAGE' },
                                      { label: 'Absent', status: 'ABSENT' },
                                      { label: 'Holiday', status: 'HOLIDAY' }
                                    ].find(o => o.status === selectedFilters[0])?.label
                                    : `${selectedFilters.length} Selected`}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              <SelectItem value="ALL">All Days (Clear)</SelectItem>
                              <SelectItem value="FULL_DAY">Full Day</SelectItem>
                              <SelectItem value="HALF_DAY">Half Day</SelectItem>
                              <SelectItem value="SHORTAGE">Shortage</SelectItem>
                              <SelectItem value="ABSENT">Absent</SelectItem>
                              <SelectItem value="HOLIDAY">Holiday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-7 gap-3">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-2">
                          {day}
                        </div>
                      ))}

                      {daysInMonth().map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} className="h-24 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl" />

                        const dateStr = format(date, "yyyy-MM-dd")
                        const statusInfo = analytics.dailyStatuses.find(d => d.date === dateStr) || {
                          date: dateStr, status: "HOLIDAY", earned: 0, deduction: 0
                        }

                        const isSelected = selectedDate === dateStr
                        const cardStyle = STATUS_CARD_STYLES[statusInfo.status] || STATUS_CARD_STYLES.HOLIDAY

                        const isFilteredOut = selectedFilters.length > 0 && !selectedFilters.some(filterStatus => {
                          if (filterStatus === "HOLIDAY") {
                            return statusInfo.status === "HOLIDAY" || statusInfo.status === "SUNDAY" || statusInfo.status === "SATURDAY"
                          }
                          return statusInfo.status === filterStatus
                        })

                        return (
                          <div
                            key={dateStr}
                            onClick={() => {
                              handleDayClick(date, statusInfo)
                            }}
                            className={`min-h-[7.5rem] border rounded-2xl p-2.5 cursor-pointer transition-all duration-200 ease-out flex flex-col ${isFilteredOut ? 'opacity-20 grayscale pointer-events-auto scale-[0.98]' : 'hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.13),0_4px_8px_-2px_rgba(0,0,0,0.06)] shadow-[0_2px_6px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]'
                              } ${isSelected
                                ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 -translate-y-1 shadow-[0_14px_28px_rgba(59,130,246,0.22)] border-blue-400'
                                : cardStyle.border
                              } ${cardStyle.bg}`}
                          >
                            <div className="flex justify-between items-start mb-2.5">
                              <span className={`text-sm font-semibold ${isSameMonth(date, new Date()) && date.getDate() === new Date().getDate()
                                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs'
                                  : cardStyle.text
                                }`}>
                                {date.getDate()}
                              </span>
                            </div>

                            {statusInfo.status !== 'HOLIDAY' && statusInfo.status !== 'SUNDAY' && statusInfo.status !== 'SATURDAY' && (() => {
                              const otPay = statusInfo.overtimePay || 0
                              const regularPay = Math.max(0, (statusInfo.earned || 0) - otPay)
                              return (
                                <div className="flex flex-col gap-[3px]">
                                  {/* Worked hours */}
                                  {(statusInfo.workedMinutes !== undefined && statusInfo.expectedMinutes !== undefined && statusInfo.expectedMinutes > 0) && (
                                    <div className="text-[11px] font-bold text-blue-700 dark:text-slate-200 truncate flex items-center gap-1 leading-none">
                                      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0 -translate-y-[1px]" />
                                      <span className="leading-none">{Math.floor(statusInfo.workedMinutes / 60)}h {statusInfo.workedMinutes % 60}m</span>
                                      <span className="text-slate-600 dark:text-slate-400 font-semibold leading-none"> / {Math.floor(statusInfo.expectedMinutes / 60)}h</span>
                                    </div>
                                  )}
                                  {/* Regular + OT pay - aligned */}
                                  {(regularPay > 0 || otPay > 0) && (
                                    <div className="flex flex-col gap-[1px]">
                                      {regularPay > 0 && (() => {
                                        const expectedPay = statusInfo.expectedPay || 0
                                        const trueDeduction = Math.round(expectedPay - regularPay)
                                        return (
                                          <div className="flex items-center text-[12px] font-bold text-emerald-800 dark:text-emerald-300">
                                            <span className="inline-block w-7">REG</span>
                                            <span className="mr-1">:</span>
                                            <span>₹{regularPay.toFixed(0)}</span>
                                            {trueDeduction > 0 && statusInfo.status !== 'ABSENT' && (
                                              <span className="ml-1 text-[11px] font-semibold text-red-600 dark:text-rose-400">(-{trueDeduction})</span>
                                            )}
                                          </div>
                                        )
                                      })()}
                                      {otPay > 0 && (
                                        <div className="flex items-center text-[12px] font-bold text-purple-700 dark:text-amber-300">
                                          <span className="inline-block w-7">OT</span>
                                          <span className="mr-1">:</span>
                                          <span>₹{otPay.toFixed(0)}</span>
                                        </div>
                                      )}
                                      {otPay > 0 && regularPay > 0 && (() => {
                                        const totalDayPay = Math.round(statusInfo.earned || (regularPay + otPay))
                                        return (
                                          <div className="flex items-center text-[12px] font-bold text-blue-600 dark:text-sky-300 mt-0.5">
                                            <span className="inline-block w-7">TOT</span>
                                            <span className="mr-1">:</span>
                                            <span className="font-extrabold text-blue-700 dark:text-sky-200">₹{totalDayPay}</span>
                                          </div>
                                        )
                                      })()}
                                    </div>
                                  )}

                                </div>
                              )
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side Panel: PUNCH DETAILS & SALARY BREAKDOWN */}
              <div className="xl:col-span-5 space-y-4">
                {!selectedDate ? (
                  <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_20px_48px_-10px_rgba(15,23,42,0.09),0_0_0_1px_rgba(255,255,255,0.85)_inset] dark:shadow-[0_20px_48px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset] rounded-2xl overflow-hidden p-8 min-h-[380px] flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100/80 dark:border-indigo-900/50 flex items-center justify-center mb-3 text-indigo-500 dark:text-indigo-400 shadow-sm">
                      <TrendingUp className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No day selected</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                      Click any day on the monthly calendar to view punch details and salary breakdown.
                    </p>
                  </Card>
                ) : detailsLoading ? (
                  <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_20px_48px_-10px_rgba(15,23,42,0.09),0_0_0_1px_rgba(255,255,255,0.85)_inset] dark:shadow-[0_20px_48px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset] rounded-2xl overflow-hidden p-10 min-h-[380px] flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Loading details for {fmtDate(selectedDate)}...</p>
                  </Card>
                ) : (
                  <>
                    {/* View Switcher Header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500">Date:</span>
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                          {fmtDate(selectedDate)}
                        </span>
                      </div>
                      <div className="inline-flex p-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 text-[11px] font-medium">
                        <button
                          onClick={() => setActiveDetailTab("ALL")}
                          className={`px-2.5 py-1 rounded-md transition-all ${activeDetailTab === "ALL"
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setActiveDetailTab("PUNCHES")}
                          className={`px-2.5 py-1 rounded-md transition-all ${activeDetailTab === "PUNCHES"
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                          Punches ({punches.length})
                        </button>
                        <button
                          onClick={() => setActiveDetailTab("BREAKDOWN")}
                          className={`px-2.5 py-1 rounded-md transition-all ${activeDetailTab === "BREAKDOWN"
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                          Breakdown ({dayDetail?.shiftBreakdown?.length || 0})
                        </button>
                      </div>
                    </div>

                    {/* ── CARD 1: PUNCH DETAILS ── */}
                    {(activeDetailTab === "ALL" || activeDetailTab === "PUNCHES") && (
                      <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_20px_48px_-10px_rgba(15,23,42,0.09),0_0_0_1px_rgba(255,255,255,0.85)_inset] dark:shadow-[0_20px_48px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset] rounded-2xl overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-gray-50/90 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-3.5 rounded-sm bg-purple-500" />
                            <Fingerprint className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">PUNCH DETAILS</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10.5px] text-gray-500 dark:text-slate-400 font-mono bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
                              {punches.length} punch{punches.length !== 1 ? "es" : ""}
                            </span>
                            {canEditPunches && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6.5 gap-1 px-2 text-xs bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                                onClick={() => setIsAddModalOpen(true)}
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-auto max-h-[260px]">
                          {punches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                              <p className="text-xs text-slate-500 dark:text-slate-400">No punches recorded for this day.</p>
                              {canEditPunches && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 gap-1 text-xs border-dashed h-6.5 px-2 bg-transparent border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                  onClick={() => setIsAddModalOpen(true)}
                                >
                                  <Plus className="w-3 h-3" /> Add first punch
                                </Button>
                              )}
                            </div>
                          ) : (
                            <table className="w-full border-collapse text-[12.5px]">
                              <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider uppercase">
                                  <th className="px-3.5 py-2.5 text-left font-medium">Employee</th>
                                  <th className="px-3.5 py-2.5 text-left font-medium">Date</th>
                                  <th className="px-3.5 py-2.5 text-center font-medium">Type</th>
                                  <th className="px-3.5 py-2.5 text-left font-medium">Time</th>
                                  <th className="px-3.5 py-2.5 text-left font-medium">Source</th>
                                  {canEditPunches && (
                                    <th className="px-3.5 py-2.5 text-center font-medium">Actions</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {punches.map((p) => {
                                  const isIn = p.punchType === "IN"
                                  const empName = employees.find(e => e.value === selectedEmployee)?.label?.split(" - ")[1] || "Employee"
                                  return (
                                    <tr key={p.id} className="hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-colors">
                                      <td className="px-3.5 py-2.5 text-[12px] font-semibold uppercase text-gray-800 dark:text-slate-200 tracking-wide whitespace-nowrap">
                                        {empName}
                                      </td>
                                      <td className="px-3.5 py-2.5 text-[12px] text-gray-600 dark:text-slate-400 whitespace-nowrap">
                                        {fmtDate(p.attendanceDate)}
                                      </td>
                                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                                        {isIn ? (
                                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                                            IN
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300">
                                            OUT
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3.5 py-2.5 text-[12px] font-mono font-medium text-gray-800 dark:text-slate-200 tracking-wider whitespace-nowrap">
                                        {p.punchTime}
                                      </td>
                                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400 text-[12px]">
                                          <SourceIcon source={p.source} />
                                          {SourceLabel({ source: p.source })}
                                        </span>
                                      </td>
                                      {canEditPunches && (
                                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="gap-1 h-6 px-2 text-[11px] text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700 shadow-2xs"
                                              onClick={() => {
                                                setSelectedPunch(p)
                                                setIsEditModalOpen(true)
                                              }}
                                            >
                                              <Edit2 className="w-2.5 h-2.5 text-gray-500 dark:text-slate-400" />
                                              Edit
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="gap-1 h-6 px-2 text-[11px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/30 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-2xs"
                                              onClick={() => {
                                                setSelectedPunch(p)
                                                setIsDeleteModalOpen(true)
                                              }}
                                            >
                                              <Trash2 className="w-2.5 h-2.5 text-red-500 dark:text-red-400" />
                                              Delete
                                            </Button>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* ── CARD 2: SALARY BREAKDOWN ── */}
                    {(activeDetailTab === "ALL" || activeDetailTab === "BREAKDOWN") && (() => {
                      const rows = dayDetail?.shiftBreakdown ?? []
                      const sumSalary = rows.reduce((a, r) => a + (Number(r.salary) || 0), 0)
                      const sumAllowance = rows.reduce((a, r) => a + (Number(r.allowance) || 0), 0)
                      const sumPenaltyMins = rows.reduce((a, r) => a + (Number(r.penaltyMinutes) || 0), 0)
                      const sumPenaltyAmt = rows.reduce((a, r) => a + (Number(r.penaltyAmount) || 0), 0)
                      const sumTotal = rows.reduce((a, r) => a + (Number(r.total) || 0), 0)

                      return (
                        <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_20px_48px_-10px_rgba(15,23,42,0.09),0_0_0_1px_rgba(255,255,255,0.85)_inset] dark:shadow-[0_20px_48px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset] rounded-2xl overflow-hidden flex flex-col">
                          {/* Header */}
                          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-gray-50/90 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="w-1 h-3.5 rounded-sm bg-blue-600" />
                              <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">SALARY BREAKDOWN</span>
                            </div>
                            <span className="text-[10.5px] text-gray-500 dark:text-slate-400 font-mono bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
                              {rows.length} shift{rows.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Table */}
                          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[300px]">
                            {rows.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                                <p className="text-xs text-slate-500 dark:text-slate-400">No shift breakdown available for this day.</p>
                              </div>
                            ) : (
                              <table className="w-full border-collapse text-[12px] min-w-[700px]">
                                <thead>
                                  <tr className="bg-gray-50/90 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider">
                                    <th className="px-3 py-2 text-left font-medium border-r border-gray-200/70 dark:border-slate-800">Shift name</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-gray-200/70 dark:border-slate-800">Type</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-gray-200/70 dark:border-slate-800">Req. hours</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-gray-200/70 dark:border-slate-800">Paid hours</th>
                                    <th className="px-3 py-2 text-right font-medium border-r border-gray-200/70 dark:border-slate-800">Amt / hr</th>
                                    <th className="px-3 py-2 text-right font-medium border-r border-gray-200/70 dark:border-slate-800">Salary</th>
                                    <th className="px-3 py-2 text-right font-medium border-r border-gray-200/70 dark:border-slate-800">Allowance</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-gray-200/70 dark:border-slate-800">Pen. mins</th>
                                    <th className="px-3 py-2 text-right font-medium border-r border-gray-200/70 dark:border-slate-800">Pen. amt</th>
                                    <th className="px-3 py-2 text-right font-medium">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                  {rows.map((row, i) => {
                                    const isOT = row.type === "OVERTIME"
                                    const hoursMatch = row.paidMinutes === row.reqMinutes
                                    return (
                                      <tr key={i} className={`transition-colors ${isOT ? "bg-emerald-50/20 dark:bg-emerald-950/20 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30" : "hover:bg-blue-50/20 dark:hover:bg-slate-800/50"}`}>
                                        <td className="px-3 py-2.5 text-left border-r border-gray-100 dark:border-slate-800">
                                          <p className="font-semibold text-gray-800 dark:text-slate-200 text-[11.5px] uppercase">{row.shiftName || "—"}</p>
                                          {row.shiftTiming && (
                                            <p className="text-[10.5px] font-mono text-gray-400 dark:text-slate-500 mt-0.5">{row.shiftTiming}</p>
                                          )}
                                        </td>
                                        <td className="px-3 py-2.5 text-center border-r border-gray-100 dark:border-slate-800 whitespace-nowrap">
                                          {isOT ? (
                                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                                              OVERTIME
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                                              REGULAR
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2.5 text-center border-r border-gray-100 dark:border-slate-800 font-mono text-gray-600 dark:text-slate-400 whitespace-nowrap">
                                          {!isZeroTime(row.reqMinutes) ? row.reqMinutes : "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-center border-r border-gray-100 dark:border-slate-800 font-mono whitespace-nowrap">
                                          {!isZeroTime(row.paidMinutes) ? (
                                            <span className={`font-semibold ${hoursMatch ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                              {row.paidMinutes}
                                            </span>
                                          ) : "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right border-r border-gray-100 dark:border-slate-800 font-mono text-gray-600 dark:text-slate-400 whitespace-nowrap">
                                          {Number(row.amountPerHour) > 0 ? fmt(row.amountPerHour) : "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right border-r border-gray-100 dark:border-slate-800 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                          {fmt(row.salary)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right border-r border-gray-100 dark:border-slate-800 font-mono whitespace-nowrap">
                                          {Number(row.allowance) > 0 ? (
                                            <span className="text-blue-600 dark:text-blue-400 font-medium">{fmt(row.allowance)}</span>
                                          ) : "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-center border-r border-gray-100 dark:border-slate-800 font-mono whitespace-nowrap">
                                          {!isZeroTime(String(row.penaltyMinutes)) ? (
                                            <span className="text-red-500 dark:text-red-400 font-medium">{row.penaltyMinutes}</span>
                                          ) : "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right border-r border-gray-100 dark:border-slate-800 font-mono whitespace-nowrap">
                                          {Number(row.penaltyAmount) > 0 ? (
                                            <span className="text-red-500 dark:text-red-400 font-medium">{fmt(row.penaltyAmount)}</span>
                                          ) : "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[12.5px] whitespace-nowrap">
                                          {fmt(row.total)}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50/90 dark:bg-slate-800/80 font-semibold">
                                    <td className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 border-r border-gray-200 dark:border-slate-800" colSpan={2}>
                                      TOTAL
                                    </td>
                                    <td className="px-3 py-2.5 text-center font-mono text-gray-600 dark:text-slate-400 border-r border-gray-200 dark:border-slate-800 whitespace-nowrap">
                                      {!isZeroTime(dayDetail?.payableMinutes) ? dayDetail?.payableMinutes : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-center font-mono font-semibold text-gray-800 dark:text-slate-200 border-r border-gray-200 dark:border-slate-800 whitespace-nowrap">
                                      {!isZeroTime(dayDetail?.workDuration) ? dayDetail?.workDuration : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-center border-r border-gray-200 dark:border-slate-800 font-mono text-gray-400 dark:text-slate-600">—</td>
                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-800 dark:text-slate-200 border-r border-gray-200 dark:border-slate-800 whitespace-nowrap">
                                      {fmt(sumSalary)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono font-medium text-blue-600 dark:text-blue-400 border-r border-gray-200 dark:border-slate-800 whitespace-nowrap">
                                      {sumAllowance > 0 ? fmt(sumAllowance) : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-center font-mono font-medium text-red-500 dark:text-red-400 border-r border-gray-200 dark:border-slate-800 whitespace-nowrap">
                                      {sumPenaltyMins > 0 ? sumPenaltyMins : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono font-medium text-red-500 dark:text-red-400 border-r border-gray-200 dark:border-slate-800 whitespace-nowrap">
                                      {sumPenaltyAmt > 0 ? fmt(sumPenaltyAmt) : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[13px] whitespace-nowrap">
                                      {fmt(sumTotal)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                          </div>
                        </Card>
                      )
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Punch Action Modals */}
      {selectedDate && (
        <PunchAddModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onAdd={async () => {
            setIsAddModalOpen(false)
            await fetchDayDetails(selectedDate)
            await fetchAnalytics()
          }}
          onAddPair={async () => {
            setIsAddModalOpen(false)
            await fetchDayDetails(selectedDate)
            await fetchAnalytics()
          }}
          allPunches={punches.map(toPunchModalShape)}
          workDate={selectedDate}
          employeeId={selectedEmployee ?? ""}
          authToken={auth?.token}
          onRefresh={async () => {
            await fetchDayDetails(selectedDate)
            await fetchAnalytics()
          }}
        />
      )}

      {selectedPunch && selectedDate && (
        <PunchEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          punch={toPunchModalShape(selectedPunch)}
          allPunches={punches.map(toPunchModalShape)}
          onSave={async () => {
            setIsEditModalOpen(false)
            await fetchDayDetails(selectedDate)
            await fetchAnalytics()
          }}
          onRefresh={async () => {
            await fetchDayDetails(selectedDate)
            await fetchAnalytics()
          }}
          workDate={selectedDate}
        />
      )}

      {selectedPunch && (
        <PunchDeleteModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          punch={toPunchModalShape(selectedPunch)}
          onConfirm={handleDeletePunch}
        />
      )}
    </div>
  )
}
