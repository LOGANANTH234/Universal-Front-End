"use client"
import { API_BASE_URL } from "@/lib/branding-config"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CalendarIcon, Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
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
import { DailySalaryDrilldownModal } from "./daily-salary-drilldown-modal"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DailySalaryRecord {
  id: number
  employeeName: string
  workDate: string
  workDuration: string      // paid hours — pre-formatted by backend e.g. "7h:57m"
  salaryMinutes: number     // raw paid minutes — used for colour comparison on Paid Hrs
  payableMinutes: string    // required shift hours — pre-formatted e.g. "8h:0m"
  regularSalary: number
  OvertimeSalary: number
  extraAllowance: number
  warningCount: number
  penaltyMinutes: string    // pre-formatted e.g. "1h:0m"
  penaltyAmountDeducted: number
  totalPay: number          // net pay after penalty
  createdAt: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "₹0.00"
  return `₹${n.toFixed(2)}`
}

function hasPenalty(s: string | null | undefined): boolean {
  if (!s) return false
  return s !== "0h:0m" && s !== "0h:00m" && s !== "0"
}

/** Parse "8h:0m" or "8h" back to minutes for comparison */
function parseHrStr(s: string | null | undefined): number {
  if (!s) return 0
  const m = s.match(/(\d+)h(?::(\d+)m)?/)
  if (!m) return 0
  return parseInt(m[1]) * 60 + parseInt(m[2] || "0")
}

/** Return a new Date shifted by `days` days */
function shiftDay(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DailySalaryScreen() {
  const { auth } = useAuth()
  const hasGenerateSalary = useHasAction(MODULES.SALARY, ACTIONS.SALARY_GENERATE)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [data, setData] = useState<DailySalaryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [drilldownRecord, setDrilldownRecord] = useState<DailySalaryRecord | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = async (date: Date) => {
    if (!auth?.token) { setError("Authentication token not available"); return }
    setLoading(true); setError(null)
    try {
      const d = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-")
      const res = await fetch(
        `${API_BASE_URL}/api/payrolls/getDailySalary?date=${d}`,
        { headers: { Authorization: `Bearer ${auth.token}` } },
      )

      if (!res.ok) throw new Error(`API error: ${res.statusText}`)
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally { setLoading(false) }
  }

  useEffect(() => { if (auth?.token) fetchData(selectedDate) }, [selectedDate, auth?.token])

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handlePrevDay = () => setSelectedDate(prev => shiftDay(prev, -1))
  const handleNextDay = () => setSelectedDate(prev => shiftDay(prev, 1))

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleConfirmGenerate = async () => {
    if (!auth?.token) { setShowGenerateDialog(false); return }
    setLoading(true)
    try {
      const d = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, "0"),
        String(selectedDate.getDate()).padStart(2, "0"),
      ].join("-")
      const res = await fetch(
        `${API_BASE_URL}/api/payrolls/calculate-daily-salary?date=${d}`,
        { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } },
      )
      if (!res.ok) throw new Error(`API error: ${res.statusText}`)
      await fetchData(selectedDate)
      setShowGenerateDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate salary")
    } finally { setLoading(false) }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredData = data.filter(r =>
    selectedEmployee ? r.employeeName === selectedEmployee : true,
  )

  const employees = useMemo(() => {
    const unique = Array.from(new Set(data.map(r => r.employeeName)))
    return [
      { value: "", label: "All Employees" },
      ...unique.map(e => ({ value: e, label: e })),
    ]
  }, [data])

  const totals = useMemo(() =>
    filteredData.reduce(
      (acc, r) => ({
        regular: acc.regular + (r.regularSalary || 0),
        ot: acc.ot + (r.OvertimeSalary || 0),
        allowance: acc.allowance + (r.extraAllowance || 0),
        penalty: acc.penalty + (r.penaltyAmountDeducted || 0),
        net: acc.net + (r.totalPay || 0),
      }),
      { regular: 0, ot: 0, allowance: 0, penalty: 0, net: 0 },
    ),
    [filteredData])

  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  })

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-4 px-6 py-6">

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap gap-4 items-end">

          <div className="space-y-1 flex-shrink-0">
            <Label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              Employee
            </Label>
            <SearchableComboBox
              options={employees}
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
              placeholder="All Employees"
              searchPlaceholder="Search employees..."
            />
          </div>

          {/* ── Date picker with prev / next navigation ── */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              Date
            </Label>
            <div className="flex items-center gap-1">
              {/* Previous day */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex-shrink-0"
                onClick={handlePrevDay}
                title="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Calendar popover */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 gap-2 text-sm font-normal bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
                    {dateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800" align="start">
                  <MultiViewCalendar
                    selected={selectedDate}
                    onSelect={d => { setSelectedDate(d); setIsCalendarOpen(false) }}
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>

              {/* Next day */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex-shrink-0"
                onClick={handleNextDay}
                title="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {hasGenerateSalary && (
            <div className="ml-auto">
              <Button
                onClick={() => setShowGenerateDialog(true)}
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
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table card ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">

        {/* Card title */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Daily Salary Records</h2>
          {!loading && (
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {filteredData.length} employee{filteredData.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-14 text-center text-sm text-gray-400 dark:text-slate-500">Loading salary data…</div>
          ) : (
            <table className="w-full text-sm">

              {/* ── Single header row ── */}
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80">
                  <th className="px-5 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Employee Name</th>
                  <th className="px-5 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Work Date</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Regular Req. Hours</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Regular Paid Hours</th>
                  <th className="px-5 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">Regular Salary</th>
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
                    <td colSpan={12} className="py-14 text-center text-sm text-gray-400 dark:text-slate-500">
                      No salary records found for the selected date and employee.
                    </td>
                  </tr>
                ) : (
                  filteredData.map(r => {
                    const penaltyAmt = r.penaltyAmountDeducted || 0
                    const gross = (r.regularSalary || 0)
                      + (r.OvertimeSalary || 0)
                      + (r.extraAllowance || 0)
                      + penaltyAmt

                    const paidMins = r.salaryMinutes || 0
                    const reqMins = parseHrStr(r.payableMinutes)
                    const isFull = reqMins > 0 && paidMins >= reqMins
                    const isPartial = paidMins > 0 && !isFull

                    return (
                      <tr
                        key={r.id}
                        onClick={() => setDrilldownRecord(r)}
                        className="border-b border-gray-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-slate-100 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {r.employeeName}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {r.workDate}
                        </td>
                        <td className="px-5 py-3.5 text-center whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          <span className="font-mono text-xs text-gray-500 dark:text-slate-400">
                            {r.payableMinutes || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          <span className={
                            "font-mono text-xs font-semibold px-2 py-0.5 rounded " +
                            (isFull
                              ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/50"
                              : isPartial
                                ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50"
                                : "text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-950/50")
                          }>
                            {r.workDuration || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-gray-700 dark:text-slate-300 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {fmt(r.regularSalary)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {(r.OvertimeSalary || 0) > 0
                            ? <span className="text-gray-700 dark:text-slate-300">{fmt(r.OvertimeSalary)}</span>
                            : <span className="text-gray-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {(r.extraAllowance || 0) > 0
                            ? <span className="text-gray-700 dark:text-slate-300">{fmt(r.extraAllowance)}</span>
                            : <span className="text-gray-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-gray-800 dark:text-slate-100 whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {fmt(gross)}
                        </td>
                        <td className="px-5 py-3.5 text-center border-r border-gray-300 dark:border-slate-700">
                          {r.warningCount > 0
                            ? <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800 text-xs">{r.warningCount}</Badge>
                            : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {hasPenalty(r.penaltyMinutes)
                            ? <span className="text-red-500 dark:text-red-400 font-medium">{r.penaltyMinutes}</span>
                            : <span className="text-gray-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap border-r border-gray-300 dark:border-slate-700">
                          {penaltyAmt > 0
                            ? <span className="text-red-500 dark:text-red-400 font-medium">{fmt(penaltyAmt)}</span>
                            : <span className="text-gray-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {fmt(r.totalPay)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>

              {/* ── Footer totals ── */}
              {filteredData.length > 1 && (
                <tfoot>
                  <tr className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 font-semibold text-sm">
                    <td className="px-5 py-3 text-gray-600 dark:text-slate-300" colSpan={4}>
                      Total{" "}
                      <span className="font-normal text-gray-400 dark:text-slate-500 text-xs">
                        ({filteredData.length} employees)
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 dark:text-slate-300">{fmt(totals.regular)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 dark:text-slate-300">{fmt(totals.ot)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700 dark:text-slate-300">{fmt(totals.allowance)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-800 dark:text-slate-100 font-bold">
                      {fmt(totals.regular + totals.ot + totals.allowance + totals.penalty)}
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

      {/* ── Generate dialog ──────────────────────────────────────────────── */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-sm dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Generate Daily Salary</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Salary will be calculated for all employees for{" "}
              <span className="font-semibold text-gray-900 dark:text-slate-200">{dateLabel}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmGenerate} className="bg-blue-600 hover:bg-blue-700 text-white">
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Salary Drilldown dialog ──────────────────────────────────────── */}
      <DailySalaryDrilldownModal
        record={drilldownRecord}
        open={!!drilldownRecord}
        onOpenChange={(open) => { if (!open) setDrilldownRecord(null) }}
      />

    </div>
  )
}