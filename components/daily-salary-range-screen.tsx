"use client"

import { API_BASE_URL } from "@/lib/branding-config"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  CalendarIcon,
  Download,
  RefreshCw,
  Wallet,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileText,
  Calendar,
  Filter,
  Check,
  X,
  SlidersHorizontal,
} from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { SearchableComboBox } from "./searchable-combo-box"
import { MultiViewCalendar } from "./multi-view-calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DailySalaryDrilldownModal } from "./daily-salary-drilldown-modal"
import { PageLoader } from "@/components/ui/page-loader"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DailySalaryRecord {
  id: number
  employeeId: string
  employeeName: string
  workDate: string
  workDuration: string      // paid hours e.g. "7h:57m"
  salaryMinutes: number     // raw paid minutes
  payableMinutes: string    // required shift hours e.g. "8h:0m"
  regularSalary: number
  OvertimeSalary: number
  extraAllowance: number
  warningCount: number
  penaltyMinutes: string    // e.g. "1h:0m"
  penaltyAmountDeducted: number
  totalPay: number          // net pay
  createdAt: string | null
  firstIn?: string | null
  lastOut?: string | null
}

type PaidHoursFilterType = "ALL" | "COMPLETE" | "GREATER_EQUAL_HALF" | "MORE_THAN_HALF" | "LESS_THAN_HALF" | "ZERO"
type SalaryOperatorType = "NONE" | "GREATER_THAN" | "EQUAL_TO" | "LESS_THAN"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "₹0.00"
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function hasPenalty(s: string | null | undefined): boolean {
  if (!s) return false
  return s !== "0h:0m" && s !== "0h:00m" && s !== "0"
}

function parseHrStr(s: string | null | undefined): number {
  if (!s) return 0
  const m = s.match(/(\d+)h(?::(\d+)m)?/)
  if (!m) return 0
  return parseInt(m[1]) * 60 + parseInt(m[2] || "0")
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DailySalaryRangeScreen() {
  const { auth } = useAuth()

  // Default date range: current month (1st of month to today)
  const [fromDate, setFromDate] = useState<Date>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [toDate, setToDate] = useState<Date>(() => new Date())

  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false)
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false)
  const [data, setData] = useState<DailySalaryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drilldownRecord, setDrilldownRecord] = useState<DailySalaryRecord | null>(null)

  // ── Column Filter States ───────────────────────────────────────────────────
  const [paidHoursFilter, setPaidHoursFilter] = useState<PaidHoursFilterType>("ALL")
  const [isPaidHoursFilterOpen, setIsPaidHoursFilterOpen] = useState(false)

  const [salaryOperator, setSalaryOperator] = useState<SalaryOperatorType>("NONE")
  const [salaryValue, setSalaryValue] = useState<string>("")
  const [salaryInputDraft, setSalaryInputDraft] = useState<string>("")
  const [isSalaryFilterOpen, setIsSalaryFilterOpen] = useState(false)

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = async () => {
    if (!auth?.token) {
      setError("Authentication token not available")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const fromStr = toIsoDate(fromDate)
      const toStr = toIsoDate(toDate)
      let url = `${API_BASE_URL}/api/payrolls/getDailySalaryRange?fromDate=${fromStr}&toDate=${toStr}`
      if (selectedEmployee) {
        url += `&employeeId=${encodeURIComponent(selectedEmployee)}`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`)
      }

      const records: DailySalaryRecord[] = await res.json()
      setData(records)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch daily salary details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (auth?.token) {
      fetchData()
    }
  }, [fromDate, toDate, selectedEmployee, auth?.token])

  // ── Preset Handlers ────────────────────────────────────────────────────────

  const setThisMonth = () => {
    const now = new Date()
    setFromDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setToDate(now)
  }

  const setLastMonth = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
    setFromDate(firstDay)
    setToDate(lastDay)
  }

  const setLast30Days = () => {
    const now = new Date()
    const past = new Date()
    past.setDate(past.getDate() - 30)
    setFromDate(past)
    setToDate(now)
  }

  const setThisYear = () => {
    const now = new Date()
    setFromDate(new Date(now.getFullYear(), 0, 1))
    setToDate(now)
  }

  // ── Employee List for ComboBox ─────────────────────────────────────────────

  const employees = useMemo(() => {
    const map = new Map<string, string>()
    data.forEach(r => {
      if (r.employeeId && r.employeeName) {
        map.set(r.employeeId, r.employeeName)
      }
    })
    const list = Array.from(map.entries()).map(([id, name]) => ({
      value: id,
      label: `${name} (${id})`,
    }))
    return [{ value: "", label: "All Employees" }, ...list]
  }, [data])

  // ── Filtered Data (Column-level filtering) ──────────────────────────────────

  const filteredData = useMemo(() => {
    return data.filter(r => {
      // 1. Regular Paid Hours filter
      if (paidHoursFilter !== "ALL") {
        const paidMins = r.salaryMinutes || 0
        const reqMins = parseHrStr(r.payableMinutes)
        const halfMins = reqMins > 0 ? reqMins / 2 : 240

        if (paidHoursFilter === "COMPLETE") {
          // Complete hours: paid >= req
          if (reqMins > 0 ? paidMins < reqMins : paidMins <= 0) return false
        } else if (paidHoursFilter === "GREATER_EQUAL_HALF") {
          // Greater or equal to half day: paid >= halfMins (>= 50%)
          if (paidMins < halfMins || paidMins <= 0) return false
        } else if (paidHoursFilter === "MORE_THAN_HALF") {
          // More than half: paid > req/2 and paid < req
          if (!(paidMins > halfMins && (reqMins > 0 ? paidMins < reqMins : true))) return false
        } else if (paidHoursFilter === "LESS_THAN_HALF") {
          // Less than half: paid > 0 and paid < halfMins
          if (!(paidMins > 0 && paidMins < halfMins)) return false
        } else if (paidHoursFilter === "ZERO") {
          // 0 paid hours
          if (paidMins !== 0) return false
        }
      }

      // 2. Regular Salary filter
      if (salaryOperator !== "NONE" && salaryValue !== "") {
        const targetVal = parseFloat(salaryValue)
        if (!isNaN(targetVal)) {
          const actualVal = r.regularSalary || 0
          if (salaryOperator === "GREATER_THAN" && !(actualVal > targetVal)) return false
          if (salaryOperator === "EQUAL_TO" && !(Math.abs(actualVal - targetVal) < 0.01)) return false
          if (salaryOperator === "LESS_THAN" && !(actualVal < targetVal)) return false
        }
      }

      return true
    })
  }, [data, paidHoursFilter, salaryOperator, salaryValue])

  // ── Totals & Summary Metrics (calculated from filteredData) ────────────────

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, r) => ({
        regular: acc.regular + (r.regularSalary || 0),
        ot: acc.ot + (r.OvertimeSalary || 0),
        allowance: acc.allowance + (r.extraAllowance || 0),
        penalty: acc.penalty + (r.penaltyAmountDeducted || 0),
        net: acc.net + (r.totalPay || 0),
        gross:
          acc.gross +
          (r.regularSalary || 0) +
          (r.OvertimeSalary || 0) +
          (r.extraAllowance || 0) +
          (r.penaltyAmountDeducted || 0),
      }),
      { regular: 0, ot: 0, allowance: 0, penalty: 0, net: 0, gross: 0 },
    )
  }, [filteredData])

  const isAnyColumnFilterActive = paidHoursFilter !== "ALL" || (salaryOperator !== "NONE" && salaryValue !== "")

  const clearAllColumnFilters = () => {
    setPaidHoursFilter("ALL")
    setSalaryOperator("NONE")
    setSalaryValue("")
    setSalaryInputDraft("")
  }

  // ── CSV Export ─────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (filteredData.length === 0) return

    const headers = [
      "Employee ID",
      "Employee Name",
      "Work Date",
      "Req Hours",
      "Paid Hours",
      "Regular Salary",
      "Overtime Salary",
      "Allowance",
      "Gross Pay",
      "Warnings",
      "Penalty Mins",
      "Penalty Deducted",
      "Net Salary",
    ]

    const rows = filteredData.map(r => {
      const gross =
        (r.regularSalary || 0) +
        (r.OvertimeSalary || 0) +
        (r.extraAllowance || 0) +
        (r.penaltyAmountDeducted || 0)
      return [
        `"${r.employeeId || ""}"`,
        `"${r.employeeName || ""}"`,
        `"${r.workDate || ""}"`,
        `"${r.payableMinutes || ""}"`,
        `"${r.workDuration || ""}"`,
        (r.regularSalary || 0).toFixed(2),
        (r.OvertimeSalary || 0).toFixed(2),
        (r.extraAllowance || 0).toFixed(2),
        gross.toFixed(2),
        r.warningCount || 0,
        `"${r.penaltyMinutes || ""}"`,
        (r.penaltyAmountDeducted || 0).toFixed(2),
        (r.totalPay || 0).toFixed(2),
      ].join(",")
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `Daily_Salary_Details_${toIsoDate(fromDate)}_to_${toIsoDate(toDate)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getPaidHoursFilterLabel = (f: PaidHoursFilterType) => {
    switch (f) {
      case "COMPLETE": return "Complete Hours"
      case "GREATER_EQUAL_HALF": return "≥ Half Day"
      case "MORE_THAN_HALF": return "> 50% Hours"
      case "LESS_THAN_HALF": return "< 50% Hours"
      case "ZERO": return "0 Hours"
      default: return "All"
    }
  }

  const getSalaryOperatorLabel = (op: SalaryOperatorType, val: string) => {
    const symbol = op === "GREATER_THAN" ? ">" : op === "EQUAL_TO" ? "=" : "<"
    return `Salary ${symbol} ₹${val}`
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-5 px-6 py-6 relative">
      {/* Page Loader Overlay */}
      <PageLoader
        isLoading={loading}
        title="Loading Daily Salary Records..."
        description="Fetching employee attendance, shift hours, and salary calculations…"
        accentColor="blue"
      />

      {/* ── Top Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div className="flex flex-wrap items-end gap-3.5">

            {/* Employee Selector */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Employee
              </Label>
              <div className="w-[220px]">
                <SearchableComboBox
                  options={employees}
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  placeholder="All Employees"
                  searchPlaceholder="Search employees..."
                />
              </div>
            </div>

            {/* From Date */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                From Date
              </Label>
              <Popover open={isFromCalendarOpen} onOpenChange={setIsFromCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 gap-2 text-sm font-normal bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    {formatDateDisplay(fromDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800" align="start">
                  <MultiViewCalendar
                    selected={fromDate}
                    onSelect={d => {
                      setFromDate(d)
                      setIsFromCalendarOpen(false)
                    }}
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                To Date
              </Label>
              <Popover open={isToCalendarOpen} onOpenChange={setIsToCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 gap-2 text-sm font-normal bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {formatDateDisplay(toDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800" align="start">
                  <MultiViewCalendar
                    selected={toDate}
                    onSelect={d => {
                      setToDate(d)
                      setIsToCalendarOpen(false)
                    }}
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1 hidden sm:block">
              <Label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Quick Range
              </Label>
              <div className="flex items-center gap-1.5 h-9">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={setThisMonth}
                  className="h-8 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  This Month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={setLastMonth}
                  className="h-8 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Last Month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={setLast30Days}
                  className="h-8 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={setThisYear}
                  className="h-8 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  This Year
                </Button>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="h-9 px-3 gap-1.5 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-500" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="h-9 px-3 gap-1.5 border-emerald-600/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary Metric Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Records */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-slate-400">Total Records</div>
            <div className="text-lg font-bold text-gray-900 dark:text-slate-100 font-mono">
              {filteredData.length} <span className="text-xs font-normal text-gray-400">days</span>
            </div>
          </div>
        </div>

        {/* Regular Pay */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-slate-400">Regular Pay</div>
            <div className="text-lg font-bold text-gray-900 dark:text-slate-100 font-mono">
              {fmt(totals.regular)}
            </div>
          </div>
        </div>

        {/* Overtime Pay */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-slate-400">Overtime Pay</div>
            <div className="text-lg font-bold text-gray-900 dark:text-slate-100 font-mono">
              {fmt(totals.ot)}
            </div>
          </div>
        </div>

        {/* Total Penalties */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-slate-400">Penalties Deducted</div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
              {fmt(totals.penalty)}
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40 dark:from-slate-900 dark:to-slate-900/90 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Net Salary</div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400 font-mono">
              {fmt(totals.net)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table Card ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">

        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                Daily Salary Details
              </h2>
              <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                ({formatDateDisplay(fromDate)} — {formatDateDisplay(toDate)})
              </span>
            </div>

            {/* Active filter badges */}
            {isAnyColumnFilterActive && (
              <div className="flex flex-wrap items-center gap-1.5 ml-2">
                {paidHoursFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                    <span>Paid Hrs: {getPaidHoursFilterLabel(paidHoursFilter)}</span>
                    <button
                      onClick={() => setPaidHoursFilter("ALL")}
                      className="hover:bg-blue-200/60 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}

                {salaryOperator !== "NONE" && salaryValue !== "" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    <span>{getSalaryOperatorLabel(salaryOperator, salaryValue)}</span>
                    <button
                      onClick={() => {
                        setSalaryOperator("NONE")
                        setSalaryValue("")
                        setSalaryInputDraft("")
                      }}
                      className="hover:bg-emerald-200/60 dark:hover:bg-emerald-800 rounded-full p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}

                <button
                  onClick={clearAllColumnFilters}
                  className="text-[11px] text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 underline font-normal ml-1"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {!loading && (
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Showing <span className="text-gray-900 dark:text-slate-200 font-semibold">{filteredData.length}</span>
              {isAnyColumnFilterActive && ` of ${data.length}`} record{filteredData.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-sm text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span>Loading daily salary records…</span>
            </div>
          ) : (
            <table className="w-full text-sm">

              {/* ── Single header row ── */}
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80">
                  <th className="px-5 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Employee Name</th>
                  <th className="px-5 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Work Date</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Regular Req. Hours</th>

                  {/* ── Regular Paid Hours with Filter Popover ── */}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <span>Regular Paid Hours</span>
                      <Popover open={isPaidHoursFilterOpen} onOpenChange={setIsPaidHoursFilterOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`p-1 rounded transition-colors ${
                              paidHoursFilter !== "ALL"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700"
                            }`}
                            title="Filter by Paid Hours: Complete, More than half, Zero, etc."
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2 text-xs dark:bg-slate-900 dark:border-slate-800 shadow-lg" align="center">
                          <div className="font-semibold text-gray-800 dark:text-slate-100 px-2 py-1.5 border-b border-gray-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Filter className="h-3.5 w-3.5 text-blue-500" />
                              Filter Paid Hours
                            </span>
                            {paidHoursFilter !== "ALL" && (
                              <button
                                onClick={() => {
                                  setPaidHoursFilter("ALL")
                                  setIsPaidHoursFilterOpen(false)
                                }}
                                className="text-[10px] text-blue-600 hover:underline font-normal"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {[
                              { id: "ALL", label: "All Hours", desc: "No filtering applied" },
                              { id: "COMPLETE", label: "Complete Hours", desc: "Full shift completed (≥ 100%)" },
                              { id: "GREATER_EQUAL_HALF", label: "Greater or Equal to Half Day", desc: "≥ 50% shift hours completed" },
                              { id: "MORE_THAN_HALF", label: "More Than Half", desc: "> 50% shift hours completed" },
                              { id: "LESS_THAN_HALF", label: "Less Than Half", desc: "< 50% shift hours worked" },
                              { id: "ZERO", label: "0 Hours", desc: "Absent / Zero presence" },
                            ].map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setPaidHoursFilter(opt.id as PaidHoursFilterType)
                                  setIsPaidHoursFilterOpen(false)
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                                  paidHoursFilter === opt.id
                                    ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300"
                                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-100/70 dark:hover:bg-slate-800"
                                }`}
                              >
                                <div>
                                  <div className="font-medium">{opt.label}</div>
                                  <div className="text-[10px] text-gray-400 font-normal">{opt.desc}</div>
                                </div>
                                {paidHoursFilter === opt.id && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>

                  {/* ── Regular Salary with Filter Popover ── */}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                    <div className="inline-flex items-center justify-end gap-1.5 w-full">
                      <span>Regular Salary</span>
                      <Popover open={isSalaryFilterOpen} onOpenChange={open => {
                        setIsSalaryFilterOpen(open)
                        if (open) setSalaryInputDraft(salaryValue)
                      }}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`p-1 rounded transition-colors ${
                              salaryOperator !== "NONE" && salaryValue !== ""
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700"
                            }`}
                            title="Filter by Regular Salary: Greater than, Equal to, Lesser than"
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 text-xs dark:bg-slate-900 dark:border-slate-800 shadow-lg" align="end">
                          <div className="font-semibold text-gray-800 dark:text-slate-100 pb-2 border-b border-gray-100 dark:border-slate-800 mb-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Filter className="h-3.5 w-3.5 text-blue-500" />
                              Filter Regular Salary
                            </span>
                            {(salaryOperator !== "NONE" || salaryValue !== "") && (
                              <button
                                onClick={() => {
                                  setSalaryOperator("NONE")
                                  setSalaryValue("")
                                  setSalaryInputDraft("")
                                  setIsSalaryFilterOpen(false)
                                }}
                                className="text-[10px] text-blue-600 hover:underline font-normal"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                                Condition
                              </Label>
                              <select
                                value={salaryOperator}
                                onChange={e => setSalaryOperator(e.target.value as SalaryOperatorType)}
                                className="w-full h-8 text-xs rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-gray-800 dark:text-slate-200 outline-none focus:border-blue-500"
                              >
                                <option value="NONE">All (No Condition)</option>
                                <option value="GREATER_THAN">Greater Than ( &gt; )</option>
                                <option value="EQUAL_TO">Equal To ( = )</option>
                                <option value="LESS_THAN">Lesser Than ( &lt; )</option>
                              </select>
                            </div>

                            {salaryOperator !== "NONE" && (
                              <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                                  Amount (₹)
                                </Label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1.5 text-gray-400 font-mono">₹</span>
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 500"
                                    value={salaryInputDraft}
                                    onChange={e => setSalaryInputDraft(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") {
                                        setSalaryValue(salaryInputDraft)
                                        setIsSalaryFilterOpen(false)
                                      }
                                    }}
                                    className="h-8 pl-6 text-xs"
                                    autoFocus
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                              <Button
                                size="sm"
                                className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  setSalaryValue(salaryInputDraft)
                                  setIsSalaryFilterOpen(false)
                                }}
                              >
                                Apply Filter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setSalaryOperator("NONE")
                                  setSalaryValue("")
                                  setSalaryInputDraft("")
                                  setIsSalaryFilterOpen(false)
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>

                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Overtime</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Allowance</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Gross Pay</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Warnings</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Penalty Mins</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Penalty Amt</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap">Net Salary</th>
                </tr>
              </thead>

              {/* ── Body ── */}
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-16 text-center text-sm text-gray-400 dark:text-slate-500">
                      {isAnyColumnFilterActive ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span>No records match the applied column filters.</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllColumnFilters}
                            className="h-8 text-xs"
                          >
                            Reset Column Filters
                          </Button>
                        </div>
                      ) : (
                        "No salary records found for the selected date range and employee filter."
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredData.map(r => {
                    const penaltyAmt = r.penaltyAmountDeducted || 0
                    const gross =
                      (r.regularSalary || 0) +
                      (r.OvertimeSalary || 0) +
                      (r.extraAllowance || 0) +
                      penaltyAmt

                    const paidMins = r.salaryMinutes || 0
                    const reqMins = parseHrStr(r.payableMinutes)
                    const isFull = reqMins > 0 && paidMins >= reqMins
                    const isPartial = paidMins > 0 && !isFull

                    return (
                      <tr
                        key={r.id}
                        onClick={() => setDrilldownRecord(r)}
                        className="border-b border-gray-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                        title="Click to view detailed punch breakdown & calculations"
                      >
                        <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-slate-100 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <span>{r.employeeName}</span>
                            <span className="text-[11px] font-mono text-gray-400 dark:text-slate-500 font-normal">
                              {r.employeeId}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700 font-mono text-xs">
                          {r.workDate}
                        </td>
                        <td className="px-5 py-3.5 text-center whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          <span className="font-mono text-xs text-gray-500 dark:text-slate-400">
                            {r.payableMinutes || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          <span
                            className={
                              "font-mono text-xs font-semibold px-2 py-0.5 rounded " +
                              (isFull
                                ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/50"
                                : isPartial
                                  ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50"
                                  : "text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-950/50")
                            }
                          >
                            {r.workDuration || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-gray-700 dark:text-slate-300 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {fmt(r.regularSalary)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {(r.OvertimeSalary || 0) > 0 ? (
                            <span className="text-gray-700 dark:text-slate-300">{fmt(r.OvertimeSalary)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {(r.extraAllowance || 0) > 0 ? (
                            <span className="text-gray-700 dark:text-slate-300">{fmt(r.extraAllowance)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-gray-800 dark:text-slate-100 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {fmt(gross)}
                        </td>
                        <td className="px-5 py-3.5 text-center border-r border-gray-300 dark:border-slate-700">
                          {r.warningCount > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800 text-xs">
                              {r.warningCount}
                            </Badge>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {hasPenalty(r.penaltyMinutes) ? (
                            <span className="text-red-500 dark:text-red-400 font-medium">{r.penaltyMinutes}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {penaltyAmt > 0 ? (
                            <span className="text-red-500 dark:text-red-400 font-medium">{fmt(penaltyAmt)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {fmt(r.totalPay)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>

              {/* ── Footer Totals ── */}
              {filteredData.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 font-semibold text-sm">
                    <td className="px-5 py-3 text-gray-600 dark:text-slate-300" colSpan={4}>
                      Total Summary{" "}
                      <span className="font-normal text-gray-400 dark:text-slate-500 text-xs">
                        ({filteredData.length} records{isAnyColumnFilterActive ? " filtered" : ""})
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 dark:text-slate-300">
                      {fmt(totals.regular)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 dark:text-slate-300">
                      {fmt(totals.ot)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 dark:text-slate-300">
                      {fmt(totals.allowance)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-800 dark:text-slate-100 font-bold">
                      {fmt(totals.gross)}
                    </td>
                    <td className="px-5 py-3" />
                    <td className="px-5 py-3" />
                    <td className="px-5 py-3 text-right font-mono text-red-500 dark:text-red-400">
                      {totals.penalty > 0 ? fmt(totals.penalty) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {fmt(totals.net)}
                    </td>
                  </tr>
                </tfoot>
              )}

            </table>
          )}
        </div>
      </div>

      {/* ── Salary Drilldown Dialog ──────────────────────────────────────── */}
      <DailySalaryDrilldownModal
        record={drilldownRecord}
        open={!!drilldownRecord}
        onOpenChange={open => {
          if (!open) setDrilldownRecord(null)
        }}
      />

    </div>
  )
}
