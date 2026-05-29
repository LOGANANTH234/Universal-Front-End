"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { AlertCircle, AlertTriangle, CalendarIcon, Zap, X, ChevronRight, ChevronLeft } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import { getWeekStart, getWeekEnd, formatDateShort, getWeekRangeISO } from "@/lib/date-week-utils"
import { SearchableComboBox } from "./searchable-combo-box"
import { MultiViewCalendar } from "./multi-view-calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ApiWeeklySalaryRecord {
  absentDays: number
  allowanceTotal: number
  employeeId: string
  employeeName: string
  generatedAt: string | null
  netPay: number
  overtimeSalaryTotal: number
  penaltyAmount: number
  penaltyTotal: string
  presentDays: number
  regularSalaryTotal: number
  warningTotal: number
  weekEnd: string
  weekStart: string
  workingDays: number
}

interface DailySalaryRecord {
  id: number
  employeeName: string
  workDate: string
  workDuration: string
  salaryMinutes: number
  payableMinutes: string
  regularSalary: number
  OvertimeSalary: number
  extraAllowance: number
  warningCount: number
  penaltyMinutes: string
  penaltyAmountDeducted: number
  totalPay: number
  createdAt: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "₹0.00"
  return `₹${n.toFixed(2)}`
}

function attendancePct(present: number, working: number): string {
  if (!working) return "—"
  return `${Math.round((present / working) * 100)}%`
}

function attendanceColor(present: number, working: number): string {
  if (!working) return "text-gray-400"
  const pct = (present / working) * 100
  if (pct >= 90) return "text-green-600 font-semibold"
  if (pct >= 70) return "text-amber-600 font-semibold"
  return "text-red-500 font-semibold"
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

function getDaysOfWeek(weekStart: string, weekEnd: string): string[] {
  const days: string[] = []
  const cur = new Date(weekStart)
  const end = new Date(weekEnd)
  while (cur <= end) {
    days.push(cur.toISOString().split("T")[0])
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

/** Return a new Date shifted by `weeks` weeks (7-day increments) */
function shiftWeek(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function WeeklySalaryScreen() {
  const { auth } = useAuth()
  const hasGenerateSalary = useHasAction(MODULES.SALARY, ACTIONS.SALARY_GENERATE)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // ── Main list ─────────────────────────────────────────────────────────────
  const [apiData, setApiData] = useState<ApiWeeklySalaryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Generate dialog ───────────────────────────────────────────────────────
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)
  const [generatingDaily, setGeneratingDaily] = useState(false)

  // ── Daily drill-down ──────────────────────────────────────────────────────
  const [drillEmployee, setDrillEmployee] = useState<ApiWeeklySalaryRecord | null>(null)
  const [drillData, setDrillData] = useState<DailySalaryRecord[]>([])
  const [drillLoading, setDrillLoading] = useState(false)
  const [drillError, setDrillError] = useState<string | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────────────

  const weekRange = useMemo(() => getWeekRangeISO(selectedDate), [selectedDate])

  const weekRangeDisplay = useMemo(() => {
    const s = getWeekStart(selectedDate)
    const e = getWeekEnd(selectedDate)
    return `${formatDateShort(s)} → ${formatDateShort(e)}`
  }, [selectedDate])

  const filteredData = apiData.filter(r =>
    selectedEmployee ? r.employeeName === selectedEmployee : true
  )

  const employeeOptions = useMemo(() => {
    const unique = Array.from(new Set(apiData.map(r => r.employeeName)))
    return [{ value: "", label: "All Employees" }, ...unique.map(e => ({ value: e, label: e }))]
  }, [apiData])

  const totals = useMemo(() => filteredData.reduce((acc, r) => ({
    regular:   acc.regular   + (r.regularSalaryTotal  || 0),
    ot:        acc.ot        + (r.overtimeSalaryTotal  || 0),
    allowance: acc.allowance + (r.allowanceTotal       || 0),
    penalty:   acc.penalty   + (r.penaltyAmount        || 0),
    net:       acc.net       + (r.netPay               || 0),
    present:   acc.present   + (r.presentDays          || 0),
    working:   acc.working   + (r.workingDays          || 0),
  }), { regular: 0, ot: 0, allowance: 0, penalty: 0, net: 0, present: 0, working: 0 }), [filteredData])

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch main list
  // ─────────────────────────────────────────────────────────────────────────

  const fetchData = async (range: { start: string; end: string }) => {
    if (!auth?.token) { setError("Authentication token not available"); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(
        `http://localhost:8080/api/payrolls/getWeeklySalary?fromDate=${range.start}&toDate=${range.end}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!res.ok) throw new Error(`API error: ${res.statusText}`)
      setApiData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally { setLoading(false) }
  }

  useEffect(() => { if (auth?.token) fetchData(weekRange) }, [weekRange, auth?.token])

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────

  const handlePrevWeek = () => setSelectedDate(prev => shiftWeek(prev, -1))
  const handleNextWeek = () => setSelectedDate(prev => shiftWeek(prev, 1))

  // ─────────────────────────────────────────────────────────────────────────
  // Row click → daily drill-down
  // ─────────────────────────────────────────────────────────────────────────

  const handleRowClick = async (record: ApiWeeklySalaryRecord) => {
    setDrillEmployee(record)
    setDrillData([])
    setDrillError(null)
    setDrillLoading(true)
    try {
      const days = getDaysOfWeek(record.weekStart, record.weekEnd)
      const results = await Promise.all(
        days.map(async (day) => {
          const res = await fetch(
            `http://localhost:8080/api/payrolls/getDailySalary?date=${day}`,
            { headers: { Authorization: `Bearer ${auth!.token}` } }
          )
          if (!res.ok) return []
          const all: DailySalaryRecord[] = await res.json()
          return all.filter(r => r.employeeName === record.employeeName)
        })
      )
      setDrillData(results.flat())
    } catch (err) {
      setDrillError(err instanceof Error ? err.message : "Failed to fetch daily breakdown")
    } finally {
      setDrillLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Generate
  // ─────────────────────────────────────────────────────────────────────────

  const todayStr = () => new Date().toISOString().split("T")[0]

  const checkTodayDailySalary = async (): Promise<boolean> => {
    if (!auth?.token) return false
    try {
      const res = await fetch(
        `http://localhost:8080/api/payrolls/getDailySalary?date=${todayStr()}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!res.ok) return false
      const data = await res.json()
      return Array.isArray(data) && data.length > 0
    } catch { return false }
  }

  const handleOpenGenerate = async () => {
    const calculated = await checkTodayDailySalary()
    setValidationWarning(
      calculated
        ? null
        : "Today's salary has not been calculated. Please calculate today's salary before generating the weekly salary."
    )
    setShowGenerateDialog(true)
  }

  const handleValidationProceed = async () => {
    if (!auth?.token) return
    setValidationWarning(null)
    setGeneratingDaily(true)
    try {
      const res = await fetch(
        `http://localhost:8080/api/payrolls/calculate-daily-salary?date=${todayStr()}`,
        { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!res.ok) throw new Error(await res.text())
      setValidationWarning(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate daily salary")
    } finally {
      setGeneratingDaily(false)
    }
  }

  const handleConfirmGenerate = async () => {
    if (!auth?.token) { setShowGenerateDialog(false); return }
    setLoading(true)
    try {
      const d = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
      const res = await fetch(
        `http://localhost:8080/api/payrolls/GenerateWeeklySalary?anyDateInWeek=${d}`,
        { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!res.ok) throw new Error(`API error: ${res.statusText}`)
      await fetchData(weekRange)
      setShowGenerateDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate salary")
    } finally { setLoading(false) }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Drill-down totals
  // ─────────────────────────────────────────────────────────────────────────

  const drillTotals = useMemo(() =>
    drillData.reduce((a, r) => ({
      regular:   a.regular   + (r.regularSalary        || 0),
      ot:        a.ot        + (r.OvertimeSalary        || 0),
      allowance: a.allowance + (r.extraAllowance        || 0),
      penalty:   a.penalty   + (r.penaltyAmountDeducted || 0),
      net:       a.net       + (r.totalPay              || 0),
    }), { regular: 0, ot: 0, allowance: 0, penalty: 0, net: 0 }),
  [drillData])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-4 px-6 py-6">

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">

          <div className="space-y-1 flex-shrink-0">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employee</Label>
            <SearchableComboBox
              options={employeeOptions}
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
              placeholder="All Employees"
              searchPlaceholder="Search employees..."
            />
          </div>

          {/* ── Date picker with prev / next week navigation ── */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Select Date</Label>
            <div className="flex items-center gap-1">
              {/* Previous week */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-300 bg-white hover:bg-gray-50 text-gray-500 flex-shrink-0"
                onClick={handlePrevWeek}
                title="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Calendar popover */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 gap-2 text-sm font-normal bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                    {selectedDate.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <MultiViewCalendar
                    selected={selectedDate}
                    onSelect={d => { setSelectedDate(d); setIsCalendarOpen(false) }}
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>

              {/* Next week */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-300 bg-white hover:bg-gray-50 text-gray-500 flex-shrink-0"
                onClick={handleNextWeek}
                title="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Week range display */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Week</Label>
            <div className="h-9 flex items-center px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 whitespace-nowrap">
              {weekRangeDisplay}
            </div>
          </div>

          {hasGenerateSalary && (
            <div className="ml-auto">
              <Button
                onClick={handleOpenGenerate}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                Generate Salary
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Weekly Salary Records</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click any row to see the daily breakdown</p>
          </div>
          {!loading && (
            <span className="text-xs text-gray-400">
              {filteredData.length} employee{filteredData.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-14 text-center text-sm text-gray-400">Loading weekly salary data…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left   text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Employee</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Work Days</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Present</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Absent</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Att. %</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Regular</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Overtime</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Allowance</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Gross Pay</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Warnings</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Penalty Mins</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Penalty (₹)</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap">Net Salary</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-14 text-center text-sm text-gray-400">
                      No salary records found for the selected week and employee.
                    </td>
                  </tr>
                ) : filteredData.map(r => {
                  const gross = (r.regularSalaryTotal || 0) + (r.overtimeSalaryTotal || 0) + (r.allowanceTotal || 0)
                  return (
                    <tr
                      key={r.employeeId}
                      className="border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer group"
                      onClick={() => handleRowClick(r)}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap border-r border-gray-300">
                        <div className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                          {r.employeeName}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.weekStart} – {r.weekEnd}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-700 whitespace-nowrap border-r border-gray-300">{r.workingDays}</td>
                      <td className="px-5 py-3.5 text-center text-gray-700 whitespace-nowrap border-r border-gray-300">{r.presentDays}</td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap border-r border-gray-300">
                        {r.absentDays > 0
                          ? <span className="text-gray-700">{r.absentDays}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className={`px-5 py-3.5 text-center whitespace-nowrap border-r border-gray-300 ${attendanceColor(r.presentDays, r.workingDays)}`}>
                        {attendancePct(r.presentDays, r.workingDays)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-gray-700 whitespace-nowrap border-r border-gray-300">{fmt(r.regularSalaryTotal)}</td>
                      <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300">
                        {(r.overtimeSalaryTotal || 0) > 0
                          ? <span className="text-gray-700">{fmt(r.overtimeSalaryTotal)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300">
                        {(r.allowanceTotal || 0) > 0
                          ? <span className="text-gray-700">{fmt(r.allowanceTotal)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-gray-800 whitespace-nowrap border-r border-gray-300">{fmt(gross)}</td>
                      <td className="px-5 py-3.5 text-center border-r border-gray-300">
                        {r.warningTotal > 0
                          ? <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">{r.warningTotal}</Badge>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300">
                        <span className="text-red-500 font-medium">{r.penaltyTotal}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300">
                        {(r.penaltyAmount || 0) > 0
                          ? <span className="text-red-500 font-medium">{fmt(r.penaltyAmount)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-blue-600 whitespace-nowrap">{fmt(r.netPay)}</td>
                    </tr>
                  )
                })}
              </tbody>

              {filteredData.length > 1 && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-sm">
                    <td className="px-5 py-3 text-gray-600" colSpan={2}>
                      Total <span className="font-normal text-gray-400 text-xs">({filteredData.length} employees)</span>
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-gray-700">{totals.present}</td>
                    <td className="px-5 py-3" />
                    <td className={`px-5 py-3 text-center ${attendanceColor(totals.present, totals.working)}`}>
                      {attendancePct(totals.present, totals.working)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">{fmt(totals.regular)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">{fmt(totals.ot)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">{fmt(totals.allowance)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-800 font-bold">
                      {fmt(totals.regular + totals.ot + totals.allowance)}
                    </td>
                    <td className="px-5 py-3" />
                    <td className="px-5 py-3" />
                    <td className="px-5 py-3 text-right font-mono text-gray-700">
                      {totals.penalty > 0 ? fmt(totals.penalty) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-blue-600">{fmt(totals.net)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* ── Generate dialog ─────────────────────────────────────────────── */}
      <Dialog open={showGenerateDialog} onOpenChange={v => { setShowGenerateDialog(v); if (!v) setValidationWarning(null) }}>
        <DialogContent className="max-w-sm">
          {validationWarning ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Calculation Required
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-700 mt-1 leading-relaxed">
                  {validationWarning}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 mt-2">
                <Button variant="outline" onClick={() => { setShowGenerateDialog(false); setValidationWarning(null) }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleValidationProceed}
                  disabled={generatingDaily}
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                >
                  {generatingDaily
                    ? <><Zap className="h-3.5 w-3.5 animate-spin" /> Calculating…</>
                    : <><Zap className="h-3.5 w-3.5" /> Yes, Calculate Now</>}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Generate Weekly Salary</DialogTitle>
                <DialogDescription>
                  Salary will be calculated for all employees for the week{" "}
                  <span className="font-semibold text-gray-900">{weekRangeDisplay}</span>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
                <Button onClick={handleConfirmGenerate} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Generate
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DAILY DRILL-DOWN — Full-screen overlay
      ══════════════════════════════════════════════════════════════════════ */}
      {drillEmployee && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrillEmployee(null)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span>Weekly Salary</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-gray-700 font-medium">{drillEmployee.employeeName}</span>
                </div>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">
                  Daily Breakdown &mdash; {drillEmployee.weekStart} to {drillEmployee.weekEnd}
                </h2>
              </div>
            </div>

            {/* Summary pills */}
            <div className="hidden md:flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-green-50 border border-green-100 text-center min-w-[90px]">
                <div className="text-xs text-gray-500">Present</div>
                <div className="font-bold text-green-700 text-sm mt-0.5">
                  {drillEmployee.presentDays} / {drillEmployee.workingDays} days
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-center min-w-[100px]">
                <div className="text-xs text-gray-500">Net Pay</div>
                <div className="font-bold text-blue-600 text-sm mt-0.5">{fmt(drillEmployee.netPay)}</div>
              </div>
              {(drillEmployee.penaltyAmount || 0) > 0 && (
                <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-center min-w-[100px]">
                  <div className="text-xs text-gray-500">Penalty</div>
                  <div className="font-bold text-red-600 text-sm mt-0.5">{fmt(drillEmployee.penaltyAmount)}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-auto bg-gray-50 px-6 py-6">
            {drillLoading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                Loading daily records…
              </div>
            ) : drillError ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" /> {drillError}
              </div>
            ) : (
              <>
                {/* ── Detailed table ── */}
                {drillData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-700">Detailed Records</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-2.5 text-left   text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Date</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Req. Hrs</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Paid Hrs</th>
                            <th className="px-4 py-2.5 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Regular</th>
                            <th className="px-4 py-2.5 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Overtime</th>
                            <th className="px-4 py-2.5 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Allowance</th>
                            <th className="px-4 py-2.5 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Gross</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Warns</th>
                            <th className="px-4 py-2.5 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Penalty Mins</th>
                            <th className="px-4 py-2.5 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200">Penalty ₹</th>
                            <th className="px-4 py-2.5 text-right  text-xs font-semibold text-gray-500 whitespace-nowrap">Net Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drillData.map(r => {
                            const paidMins  = r.salaryMinutes || 0
                            const reqMins   = parseHrStr(r.payableMinutes)
                            const isFull    = reqMins > 0 && paidMins >= reqMins
                            const isPartial = paidMins > 0 && !isFull
                            const gross     = (r.regularSalary || 0) + (r.OvertimeSalary || 0) + (r.extraAllowance || 0) + (r.penaltyAmountDeducted || 0)
                            return (
                              <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap border-r border-gray-200 font-medium">{r.workDate}</td>
                                <td className="px-4 py-3 text-center font-mono text-xs text-gray-500 whitespace-nowrap border-r border-gray-200">
                                  {r.payableMinutes || "—"}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap border-r border-gray-200">
                                  <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                                    isFull    ? "text-green-700 bg-green-50"
                                    : isPartial ? "text-amber-600 bg-amber-50"
                                    : "text-red-500 bg-red-50"
                                  }`}>
                                    {r.workDuration || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap border-r border-gray-200">{fmt(r.regularSalary)}</td>
                                <td className="px-4 py-3 text-right font-mono whitespace-nowrap border-r border-gray-200">
                                  {(r.OvertimeSalary || 0) > 0
                                    ? <span className="text-gray-700">{fmt(r.OvertimeSalary)}</span>
                                    : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-mono whitespace-nowrap border-r border-gray-200">
                                  {(r.extraAllowance || 0) > 0
                                    ? <span className="text-gray-700">{fmt(r.extraAllowance)}</span>
                                    : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800 whitespace-nowrap border-r border-gray-200">{fmt(gross)}</td>
                                <td className="px-4 py-3 text-center border-r border-gray-200">
                                  {r.warningCount > 0
                                    ? <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">{r.warningCount}</Badge>
                                    : <span className="text-gray-300 text-xs">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-mono whitespace-nowrap border-r border-gray-200">
                                  {hasPenalty(r.penaltyMinutes)
                                    ? <span className="text-red-500 font-medium">{r.penaltyMinutes}</span>
                                    : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-mono whitespace-nowrap border-r border-gray-200">
                                  {(r.penaltyAmountDeducted || 0) > 0
                                    ? <span className="text-red-500 font-medium">{fmt(r.penaltyAmountDeducted)}</span>
                                    : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-blue-600 whitespace-nowrap">{fmt(r.totalPay)}</td>
                              </tr>
                            )
                          })}
                        </tbody>

                        {drillData.length > 1 && (
                          <tfoot>
                            <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-sm">
                              <td className="px-4 py-3 text-gray-600" colSpan={3}>Total</td>
                              <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(drillTotals.regular)}</td>
                              <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(drillTotals.ot)}</td>
                              <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(drillTotals.allowance)}</td>
                              <td className="px-4 py-3 text-right font-mono text-gray-800 font-bold">
                                {fmt(drillTotals.regular + drillTotals.ot + drillTotals.allowance + drillTotals.penalty)}
                              </td>
                              <td className="px-4 py-3" />
                              <td className="px-4 py-3" />
                              <td className="px-4 py-3 text-right font-mono text-red-500">
                                {drillTotals.penalty > 0 ? fmt(drillTotals.penalty) : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">{fmt(drillTotals.net)}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}

                {drillData.length === 0 && !drillLoading && (
                  <div className="bg-white rounded-xl border border-gray-200 py-14 text-center text-sm text-gray-400">
                    No daily records found for this employee in the selected week.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}