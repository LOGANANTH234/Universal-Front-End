"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CalendarIcon, Zap, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import { SearchableComboBox } from "./searchable-combo-box"
import { MonthYearCalendar } from "./month-year-calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface ApiResponse {
  employeeId: string
  employeeName: string
  payrollMonth: string        // "2026-03"
  workingDays: number
  presentDays: number
  absentDays: number
  regularSalaryTotal: number
  overtimeSalaryTotal: number
  allowanceTotal: number
  penaltyMins: string         // "1h:0m"
  penaltyAmount: number
  warningTotal: number
  netPay: number
  generatedAt: string | null
}

interface MonthlyPayrollRecord extends ApiResponse {
  _idx: number
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "₹0.00"
  return `₹${n.toFixed(2)}`
}

function hasPenaltyMins(s: string | null | undefined): boolean {
  if (!s) return false
  return s !== "0h:0m" && s !== "0h:00m" && s !== "0"
}

function attendancePct(present: number, working: number): string {
  if (!working) return "—"
  return `${Math.round((present / working) * 100)}%`
}

function attendanceColor(present: number, working: number): string {
  if (!working) return "text-slate-400"
  const pct = (present / working) * 100
  if (pct >= 90) return "text-green-600 font-semibold"
  if (pct >= 70) return "text-amber-600 font-semibold"
  return "text-red-600 font-semibold"
}

/** Return a new Date shifted by `months` calendar months */
function shiftMonth(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function MonthlyPayrollScreen() {
  const { auth } = useAuth()
  const hasGenerateSalary = useHasAction(MODULES.SALARY, ACTIONS.SALARY_GENERATE)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [data, setData] = useState<MonthlyPayrollRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)
  const [generatingDaily, setGeneratingDaily] = useState(false)

  // ── fetch ─────────────────────────────────────────────────────────────────

  const fetchData = async (date: Date) => {
    if (!auth?.token) { setError("Authentication token not available"); return }
    setLoading(true); setError(null)
    try {
      const ym = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`
      const res = await fetch(
        `http://13.206.112.19:8080/api/payrolls/getMonthlySalary?month=${ym}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!res.ok) throw new Error(`API error: ${res.statusText}`)
      const raw: ApiResponse[] = await res.json()
      setData(raw.map((r, i) => ({ ...r, _idx: i })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally { setLoading(false) }
  }

  useEffect(() => { if (auth?.token) fetchData(selectedDate) }, [selectedDate, auth?.token])

  // ── navigation ────────────────────────────────────────────────────────────

  const handlePrevMonth = () => setSelectedDate(prev => shiftMonth(prev, -1))
  const handleNextMonth = () => setSelectedDate(prev => shiftMonth(prev, 1))

  // ── generate ──────────────────────────────────────────────────────────────

  const todayStr = () => new Date().toISOString().split("T")[0]

  const checkTodayDailySalary = async (): Promise<boolean> => {
    if (!auth?.token) return false
    try {
      const res = await fetch(
        `http://13.206.112.19:8080/api/payrolls/getDailySalary?date=${todayStr()}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!res.ok) return false
      const data = await res.json()
      return Array.isArray(data) && data.length > 0
    } catch { return false }
  }

  const handleOpenGenerate = async () => {
    const calculated = await checkTodayDailySalary()
    if (!calculated) {
      setValidationWarning("Today's salary has not been calculated. Please calculate today's salary before generating the monthly salary.")
    } else {
      setValidationWarning(null)
    }
    setShowGenerateDialog(true)
  }

  const handleValidationProceed = async () => {
    if (!auth?.token) return
    setValidationWarning(null)
    setGeneratingDaily(true)
    try {
      const res = await fetch(
        `http://13.206.112.19:8080/api/payrolls/calculate-daily-salary?date=${todayStr()}`,
        { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!res.ok) throw new Error(await res.text())
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
      const ym = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,"0")}`
      const res = await fetch(
        `http://13.206.112.19:8080/api/payrolls/generateMonthlyPayroll?month=${ym}`,
        { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!res.ok) throw new Error(`API error: ${res.statusText}`)
      await fetchData(selectedDate)
      setShowGenerateDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate salary")
    } finally { setLoading(false) }
  }

  // ── derived ───────────────────────────────────────────────────────────────

  const filteredData = data.filter(r => selectedEmployee ? r.employeeName === selectedEmployee : true)

  const employeeOptions = useMemo(() => {
    const unique = Array.from(new Set(data.map(r => r.employeeName)))
    return [{ value: "", label: "All Employees" }, ...unique.map(e => ({ value: e, label: e }))]
  }, [data])

  const totals = useMemo(() => filteredData.reduce((acc, r) => ({
    regular: acc.regular + (r.regularSalaryTotal || 0),
    ot: acc.ot + (r.overtimeSalaryTotal || 0),
    allowance: acc.allowance + (r.allowanceTotal || 0),
    penalty: acc.penalty + (r.penaltyAmount || 0),
    net: acc.net + (r.netPay || 0),
    present: acc.present + (r.presentDays || 0),
    working: acc.working + (r.workingDays || 0),
  }), { regular: 0, ot: 0, allowance: 0, penalty: 0, net: 0, present: 0, working: 0 }), [filteredData])

  const monthLabel = selectedDate.toLocaleDateString("en-US", { year: "numeric", month: "long" })

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6 px-6 py-8">

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 font-semibold text-sm">Employee</Label>
            <SearchableComboBox options={employeeOptions} value={selectedEmployee} onValueChange={setSelectedEmployee}
              placeholder="Select employee..." searchPlaceholder="Search employees..." />
          </div>

          {/* ── Month picker with prev / next navigation ── */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 font-semibold text-sm">Select Month</Label>
            <div className="flex items-center gap-1">
              {/* Previous month */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-300 bg-white hover:bg-slate-50 text-slate-500 flex-shrink-0"
                onClick={handlePrevMonth}
                title="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Calendar popover */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-2 py-1 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50 text-slate-900 text-sm">
                    <CalendarIcon className="mr-1 h-3 w-3 text-slate-600" />
                    <span className="font-medium text-sm">{monthLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <MonthYearCalendar selected={selectedDate} onSelect={d => { setSelectedDate(d); setIsCalendarOpen(false) }}
                    fromYear={2020} toYear={2030} />
                </PopoverContent>
              </Popover>

              {/* Next month */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-300 bg-white hover:bg-slate-50 text-slate-500 flex-shrink-0"
                onClick={handleNextMonth}
                title="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {hasGenerateSalary && (
            <div className="ml-auto">
              <Button onClick={handleOpenGenerate} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Zap className="mr-2 h-4 w-4" /> Generate Salary
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Monthly Payroll Records</h2>
          {!loading && <span className="text-xs text-slate-400">{filteredData.length} employee{filteredData.length !== 1 ? "s" : ""}</span>}
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading payroll data...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Employee</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Work Days</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Present</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Absent</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Att. %</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Regular</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Overtime</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Allowance</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Gross Pay</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Warnings</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Penalty Mins</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-300">Penalty (₹)</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap">Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map(r => {
                  const gross = (r.regularSalaryTotal || 0) + (r.overtimeSalaryTotal || 0) + (r.allowanceTotal || 0)
                  return (
                    <tr key={r._idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap border-r border-gray-300">
                        <div className="font-medium text-gray-800">{r.employeeName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.payrollMonth}</div>
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
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300">
                        {hasPenaltyMins(r.penaltyMins)
                          ? <span className="text-red-500 font-medium">{r.penaltyMins}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300">
                        {(r.penaltyAmount || 0) > 0
                          ? <span className="text-red-500 font-medium">{fmt(r.penaltyAmount)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-blue-600 whitespace-nowrap">{fmt(r.netPay)}</td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={13} className="text-center py-12 text-slate-400">No payroll records found for the selected month and employee.</td></tr>
                )}
              </tbody>
              {filteredData.length > 1 && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-sm">
                    <td className="px-5 py-3 text-gray-600 border-r border-gray-300" colSpan={2}>
                      Total <span className="font-normal text-gray-400 text-xs">({filteredData.length} employees)</span>
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-gray-700 border-r border-gray-300">{totals.present}</td>
                    <td className="px-5 py-3 border-r border-gray-300" />
                    <td className={`px-5 py-3 text-center border-r border-gray-300 ${attendanceColor(totals.present, totals.working)}`}>
                      {attendancePct(totals.present, totals.working)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 border-r border-gray-300">{fmt(totals.regular)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 border-r border-gray-300">{fmt(totals.ot)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 border-r border-gray-300">{fmt(totals.allowance)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-800 font-bold border-r border-gray-300">
                      {fmt(totals.regular + totals.ot + totals.allowance)}
                    </td>
                    <td className="px-5 py-3 border-r border-gray-300" />
                    <td className="px-5 py-3 border-r border-gray-300" />
                    <td className="px-5 py-3 text-right font-mono text-red-500 font-medium border-r border-gray-300">{fmt(totals.penalty)}</td>
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
                <Button variant="outline" onClick={() => { setShowGenerateDialog(false); setValidationWarning(null) }}>Cancel</Button>
                <Button
                  onClick={handleValidationProceed}
                  disabled={generatingDaily}
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                >
                  {generatingDaily ? <><Zap className="h-3.5 w-3.5 animate-spin" /> Calculating…</> : <><Zap className="h-3.5 w-3.5" /> Yes, Calculate Now</>}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Generate Monthly Salary</DialogTitle>
                <DialogDescription>
                  Salary will be calculated for all employees for{" "}
                  <span className="font-semibold text-slate-900">{monthLabel}</span>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-3 sm:gap-0">
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
                <Button onClick={handleConfirmGenerate} className="bg-blue-600 hover:bg-blue-700">Generate</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}