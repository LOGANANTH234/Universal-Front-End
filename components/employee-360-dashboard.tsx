"use client"

  import { useState, useEffect, useCallback, useMemo } from "react"
  import {
    Search, X, User, Clock, TrendingUp, AlertTriangle,
    Building2, DollarSign, Activity,
    CheckCircle2, XCircle, ArrowLeft, BarChart3, Edit3,
    Plus, Trash2, Edit2, ChevronLeft,
    CalendarIcon, RefreshCw, PanelLeftClose, PanelLeftOpen,
    Zap
  } from "lucide-react"
  import { Badge } from "@/components/ui/badge"
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
  import { Lock, Loader2, ChevronDown, ChevronRight } from "lucide-react"
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
  import { Button } from "@/components/ui/button"
  import { useAuth } from "@/lib/contexts/auth-context"
		import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
													   
  import { MultiViewCalendar } from "./multi-view-calendar"
  import PunchAddModal from "./punch-add-modal"
  import PunchEditModal from "./punch-edit-modal"
  import PunchDeleteModal from "./punch-delete-modal"
  import EmployeeFormModal from "./employee-form-modal"
  import type { Employee } from "@/lib/employee-types"
  import { format } from "date-fns"
  import { getWeekRangeISO, getWeekStart, getWeekEnd, formatDateShort } from "@/lib/date-week-utils"

  // ─────────────────────────────────────────────────────────────────────────────
  // Types
  // ─────────────────────────────────────────────────────────────────────────────

  interface ApiEmployee {
    id: string
    employeeId: string
    employeeName: string
    phone: string
    email: string
    pan: string
    aadhaar: string
    gender: string
    role: string
    status: string
    salaryFrequency: string
    workdayPolicy: string
    startDate: string
    imageUrl: string
    regularShifts: { shiftId: number; shiftName: string; amountType: string; amount: number; extraAllowance: number }[]
    overtimeShifts: { shiftId: number; shiftName: string; amountType: string; amount: number; extraAllowance: number }[]
  }

  interface PunchRecord {
    id: string
    employeeId: string
    employeeName: string
    date: string
    time: string
    type: "IN" | "OUT"
    source: string
    shift: string
    status: "valid" | "missing-out" | "overlap" | "edited"
  }

  interface DailySalaryRow {
    id: number
    employeeName: string
    workDate: string
    workDuration: string
    payableMinutes: string
    regularSalary: number
    OvertimeSalary: number
    extraAllowance: number
    warningCount: number
    penaltyMinutes: string
    penaltyAmountDeducted: number
    totalPay: number
  }

  interface WeeklySalaryRow {
    employeeId: string
    employeeName: string
    weekStart: string
    weekEnd: string
    workingDays: number
    presentDays: number
    absentDays: number
    regularSalaryTotal: number
    overtimeSalaryTotal: number
    allowanceTotal: number
    penaltyTotal: number
    penaltyAmount: number
    warningTotal: number
    netPay: number
    
  }

  interface MonthlySalaryRow {
    employeeId: string
    employeeName: string
    payrollMonth: string
    workingDays: number
    presentDays: number
    absentDays: number
    regularSalaryTotal: number
    overtimeSalaryTotal: number
    allowanceTotal: number
    penaltyMins: string
    penaltyAmount: number
    warningTotal: number
    netPay: number

  }

  interface WarningRow {
    id: number
    employeeId: string
    employeeName: string
    warningDate: string
    expectedTime: string
    actualTime: string
    lateMinutes: number
    penaltyApplied: boolean
    warningType: string
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const BASE = "http://13.206.112.19:8080"

  function fmt(n: number | null | undefined) {
    if (n == null || isNaN(n)) return "₹0.00"
    return `₹${n.toFixed(2)}`
  }
  function todayStr() { return new Date().toISOString().split("T")[0] }
  function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  }
  function hasPenaltyMins(s?: string) {
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
  function formatGeneratedAt(ts: string | null): string {
    if (!ts) return "—"
    try { return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }
    catch { return ts }
  }
  function dateToWeekRange(d: Date) { return getWeekRangeISO(d) }
  function dateToMonthStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }
  function toDateStr(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  function toEmployee(e: ApiEmployee): Employee {
    return {
      id: e.id, name: e.employeeName, employeeId: e.employeeId,
      phone: e.phone, email: e.email, pan: e.pan, aadhaar: e.aadhaar,
      profileImage: e.imageUrl,
      gender: e.gender === "MALE" ? "Male" : e.gender === "FEMALE" ? "Female" : "Other",
      role: e.role,
      status: e.status === "ACTIVE" ? "Active" : "Inactive",
      regularShifts: (e.regularShifts || []).map(s => ({
        id: s.shiftId.toString(), shiftId: s.shiftId.toString(),
        shiftName: s.shiftName, amountType: s.amountType as any,
        amount: s.amount, extraAllowance: s.extraAllowance,
      })),
      overtimeShifts: (e.overtimeShifts || []).map(s => ({
        id: s.shiftId.toString(), shiftId: s.shiftId.toString(),
        shiftName: s.shiftName, amountType: s.amountType as any,
        amount: s.amount, extraAllowance: s.extraAllowance,
      })),
      salaryConfig: {
        frequency: e.salaryFrequency?.toLowerCase().includes("month") ? "By Month" : "By Day",
        workdayPolicy: e.workdayPolicy?.includes("All")
          ? "Include All Days"
          : e.workdayPolicy?.includes("Sunday")
            ? "Exclude Sundays"
            : "Exclude Saturdays & Sundays",
      },
      createdAt: e.startDate || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared table style constants
  // ─────────────────────────────────────────────────────────────────────────────

  const TH   = "px-4 py-3 text-left   font-semibold text-gray-500 text-xs uppercase tracking-wide border-b border-r border-gray-200 bg-gray-50 whitespace-nowrap"
  const TH_R = "px-4 py-3 text-right  font-semibold text-gray-500 text-xs uppercase tracking-wide border-b border-r border-gray-200 bg-gray-50 whitespace-nowrap"
  const TH_C = "px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wide border-b border-r border-gray-200 bg-gray-50 whitespace-nowrap"
  const TD   = "px-4 py-3 text-left   text-sm text-gray-700 border-b border-r border-gray-100"
  const TD_R = "px-4 py-3 text-right  font-mono text-sm text-gray-700 border-b border-r border-gray-100"
  const TD_C = "px-4 py-3 text-center text-sm text-gray-700 border-b border-r border-gray-100"

  function MoneyCell({ n }: { n: number }) {
    return n > 0
      ? <span className="font-mono font-semibold text-sm text-gray-800">{fmt(n)}</span>
      : <span className="text-gray-300 text-sm">—</span>
  }
  function PenCell({ s }: { s?: string }) {
    return hasPenaltyMins(s)
      ? <span className="font-mono font-medium text-sm text-orange-600">{s}</span>
      : <span className="text-gray-300 text-sm">—</span>
  }
  function WarnCell({ n }: { n: number }) {
    return n > 0
      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-xs font-bold text-amber-700 border border-amber-200">{n}</span>
      : <span className="text-gray-300 text-sm">—</span>
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Generate confirm dialog — reused for Daily / Weekly / Monthly
  // ─────────────────────────────────────────────────────────────────────────────

  function GenerateDialog({
    open, onClose, title, description, onConfirm, generating,
    validationWarning, onValidationProceed,
  }: {
    open: boolean
    onClose: () => void
    title: string
    description: string
    onConfirm: () => Promise<void>
    generating: boolean
    validationWarning?: string | null
    onValidationProceed?: () => void
  }) {
    // If there's a validation warning, show the warning state instead
    if (validationWarning) {
      return (
        <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
          <DialogContent className="max-w-sm">
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
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={onValidationProceed}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" /> Yes, Calculate Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Dialog open={open} onOpenChange={o => { if (!o && !generating) onClose() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              {description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {generating
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                : <><Zap className="h-3.5 w-3.5" /> Generate</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Employee list sidebar
  // ─────────────────────────────────────────────────────────────────────────────

  function EmployeeListPanel({ employees, selected, onSelect, loading, error }: {
    employees: ApiEmployee[]
    selected: ApiEmployee | null
    onSelect: (e: ApiEmployee) => void
    loading: boolean
    error: string | null
  }) {
    const [search, setSearch] = useState("")
    const filtered = employees.filter(e =>
      e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      (e.role || "").toLowerCase().includes(search.toLowerCase())
    )
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 h-9">
            <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <input className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
              placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : error ? (
            <div className="p-4 text-sm text-red-500 text-center">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">No employees found</div>
          ) : filtered.map(emp => {
            const isActive = emp.status === "ACTIVE"
            const isSel = selected?.id === emp.id
            return (
              <button key={emp.id} onClick={() => onSelect(emp)}
                className={["w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors",
                  isSel ? "bg-blue-50 border-l-2 border-l-blue-500" : ""].join(" ")}>
                <div className={["w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"].join(" ")}>
                  {initials(emp.employeeName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{emp.employeeName}</div>
                  <div className="text-xs text-gray-400 truncate">{emp.employeeId} · {emp.role || "—"}</div>
                </div>
                <div className={["w-2 h-2 rounded-full flex-shrink-0", isActive ? "bg-green-400" : "bg-gray-300"].join(" ")} />
              </button>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <span className="text-[11px] text-gray-400">{filtered.length} of {employees.length} employees</span>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Personal Info card
  // ─────────────────────────────────────────────────────────────────────────────

  function PersonalInfoCard({ employee, onUpdated }: { employee: ApiEmployee; onUpdated: (u: ApiEmployee) => void }) {
			const hasEditPersonalInfo = useHasAction(MODULES.EMPLOYEE_360, ACTIONS.EMP360_EDIT_PERSONAL_INFO)																					   
    const [editOpen, setEditOpen] = useState(false)
    const rows = [
      { label: "Phone",   value: employee.phone   || "—" },
      { label: "Email",   value: employee.email   || "—" },
      { label: "Gender",  value: employee.gender  || "—" },
      { label: "PAN",     value: employee.pan     || "—", mono: true },
      { label: "Aadhaar", value: employee.aadhaar ? `••••${employee.aadhaar.slice(-4)}` : "—", mono: true },
      { label: "Joined",  value: employee.startDate || "—" },
    ]
    return (
      <>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">Personal Info</span>
            </div>
								   
             {hasEditPersonalInfo && (
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium">
              <Edit3 className="h-3 w-3" /> Edit
            </button>
          )}
			
          </div>
          <div className="px-4 py-2 divide-y divide-gray-50">
            {rows.map(r => (
              <div key={r.label} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-400">{r.label}</span>
                <span className={`text-xs font-medium text-gray-700 ${r.mono ? "font-mono" : ""}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        {editOpen && (
          <EmployeeFormModal isOpen={editOpen} employee={toEmployee(employee)} onClose={() => setEditOpen(false)}
            onSave={saved => {
              onUpdated({
                ...employee, phone: saved.phone, email: saved.email || "",
                pan: saved.pan || "", aadhaar: saved.aadhaar || "",
                gender: saved.gender?.toUpperCase() || employee.gender, role: saved.role,
                status: saved.status === "Active" ? "ACTIVE" : "INACTIVE",
                regularShifts: saved.regularShifts.map(s => ({
                  shiftId: parseInt(s.shiftId || s.id), shiftName: s.shiftName,
                  amountType: s.amountType as string, amount: s.amount, extraAllowance: s.extraAllowance || 0,
                })),
                overtimeShifts: saved.overtimeShifts.map(s => ({
                  shiftId: parseInt(s.shiftId || s.id), shiftName: s.shiftName,
                  amountType: s.amountType as string, amount: s.amount, extraAllowance: s.extraAllowance || 0,
                })),
              })
              setEditOpen(false)
            }}
          />
        )}
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Daily Salary table — reused inline & inside weekly drill-down
  // ─────────────────────────────────────────────────────────────────────────────

  function DailySalaryTable({ employee, token, date, refreshKey }: {
    employee: ApiEmployee; token: string; date: string; refreshKey?: number
  }) {
    const [rows, setRows] = useState<DailySalaryRow[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      setLoading(true)
      fetch(`${BASE}/api/payrolls/getDailySalary?date=${date}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: DailySalaryRow[]) => setRows(data.filter(r => r.employeeName === employee.employeeName)))
        .catch(() => setRows([]))
        .finally(() => setLoading(false))
    }, [employee.employeeName, date, refreshKey])

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-blue-400" /></div>
    if (rows.length === 0) return <div className="text-center py-6 text-gray-400 text-sm">No salary record for {date}</div>

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className={TH}>Employee</th>
              <th className={TH_C}>Regular Req. Hours</th>
              <th className={TH_C}>Regular Paid Hours</th>
              <th className={TH_R}>Regular Salary</th>
              <th className={TH_R}>Overtime Salary</th>
              <th className={TH_R}>Exatra Allowance</th>
              <th className={TH_R}>Gross Pay</th>
              <th className={TH_C}>Warnings</th>
              <th className={TH_R}>Penalty Mins</th>
              <th className={TH_R}>Penalty (₹)</th>
              <th className={TH_R}>Net Salary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const p = r.penaltyAmountDeducted || 0
              const gross = (r.regularSalary||0) + (r.OvertimeSalary||0) + (r.extraAllowance||0) + p
              return (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className={TD}>
                    <div className="font-semibold text-gray-800">{r.employeeName}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{r.workDate}</div>
                  </td>
                  <td className={TD_C}><span className="font-mono text-sm text-gray-500">{r.payableMinutes || "—"}</span></td>
                  <td className={TD_C}><span className="font-mono text-sm text-gray-700 font-medium">{r.workDuration || "—"}</span></td>
                  <td className={TD_R}>{fmt(r.regularSalary)}</td>
                  <td className={TD_R}><MoneyCell n={r.OvertimeSalary||0} /></td>
                  <td className={TD_R}><MoneyCell n={r.extraAllowance||0} /></td>
                  <td className={`${TD_R} font-bold text-gray-900`}>{fmt(gross)}</td>
                  <td className={TD_C}><WarnCell n={r.warningCount} /></td>
                  <td className={TD_R}><PenCell s={r.penaltyMinutes} /></td>
                  <td className={TD_R}><MoneyCell n={p} /></td>
                  <td className={`${TD_R} font-semibold text-blue-600`}>{fmt(r.totalPay)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Weekly drill-down dialog
  // ─────────────────────────────────────────────────────────────────────────────

  function WeeklyDrillDownDialog({ open, onClose, employee, token, weekStart, weekEnd }: {
    open: boolean; onClose: () => void
    employee: ApiEmployee; token: string
    weekStart: string; weekEnd: string
  }) {
    // Always render Mon → Sun: find the Monday of the week containing weekStart
    const days = useMemo(() => {
      const result: string[] = []
      // Parse weekStart and find its Monday
      const start = new Date(weekStart + "T00:00:00")
      const dow = start.getDay() // 0=Sun,1=Mon,...,6=Sat
      const monday = new Date(start)
      // shift back to Monday (if sunday dow=0, go back 6; else go back dow-1)
      monday.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1))
      // Generate Mon→Sun (7 days)
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        result.push(d.toISOString().split("T")[0])
      }
      return result
    }, [weekStart])

    return (
      <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 rounded-none flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                Daily Salary Breakdown — {weekStart} to {weekEnd}
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Close
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Daily salary records for each day of the selected week</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
            {days.map((day, idx) => {
              const dayOfWeek = new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" })
              const isWeekend = idx >= 5 // Saturday=5, Sunday=6
              const dotColor = isWeekend ? "bg-amber-400" : "bg-indigo-400"
              const labelColor = isWeekend ? "text-amber-700" : "text-gray-800"
              return (
                <div key={day} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className={`px-5 py-3 border-b border-gray-200 flex items-center gap-3 ${isWeekend ? "bg-amber-50" : "bg-gradient-to-r from-gray-50 to-gray-100"}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                    <span className={`text-sm font-bold ${labelColor}`}>{dayOfWeek}</span>
                    <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">{day}</span>
                    {isWeekend && <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Weekend</span>}
                  </div>
                  <DailySalaryTable employee={employee} token={token} date={day} />
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Weekly Salary table
  // ─────────────────────────────────────────────────────────────────────────────

  function WeeklySalaryTable({ employee, token, date, refreshKey }: {
    employee: ApiEmployee; token: string; date: Date; refreshKey?: number
  }) {
    const [rows, setRows] = useState<WeeklySalaryRow[]>([])
    const [loading, setLoading] = useState(false)

    const weekRange = useMemo(() => dateToWeekRange(date), [date])
    const weekRangeDisplay = useMemo(() => {
      const s = getWeekStart(date); const e = getWeekEnd(date)
      return `${formatDateShort(s)} → ${formatDateShort(e)}`
    }, [date])

    useEffect(() => {
      setLoading(true)
      fetch(`${BASE}/api/payrolls/getWeeklySalary?fromDate=${weekRange.start}&toDate=${weekRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: WeeklySalaryRow[]) => setRows(data.filter(r => r.employeeName === employee.employeeName)))
        .catch(() => setRows([]))
        .finally(() => setLoading(false))
    }, [employee.employeeName, weekRange.start, weekRange.end, refreshKey])

    if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-gray-300" /></div>
    if (rows.length === 0) return <p className="text-sm text-gray-400 text-center py-5">No weekly record for {weekRangeDisplay}</p>

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={TH}>Employee</th>
                <th className={TH_C}>Work Days</th>
                <th className={TH_C}>Present</th>
                <th className={TH_C}>Absent</th>
                <th className={TH_C}>Att.%</th>
                <th className={TH_R}>Regular</th>
                <th className={TH_R}>Overtime</th>
                <th className={TH_R}>Allowance</th>
                <th className={TH_R}>Gross Pay</th>
                <th className={TH_C}>Warnings</th>
                <th className={TH_R}>Pen. Mins</th>
                <th className={TH_R}>Penalty (₹)</th>
                <th className={TH_R}>Net Salary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const gross = (r.regularSalaryTotal||0) + (r.overtimeSalaryTotal||0) + (r.allowanceTotal||0)
                return (
                  <tr key={r.employeeId}
                    className="border-b border-gray-100 transition-colors">
                    <td className={TD}>
                      <div className="font-semibold text-gray-800">{r.employeeName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.weekStart} – {r.weekEnd}</div>
                    </td>
                    <td className={TD_C}>{r.workingDays}</td>
                    <td className={TD_C}>{r.presentDays}</td>
                    <td className={TD_C}>{r.absentDays > 0 ? r.absentDays : <span className="text-gray-300">—</span>}</td>
                    <td className={`${TD_C} ${attendanceColor(r.presentDays, r.workingDays)}`}>{attendancePct(r.presentDays, r.workingDays)}</td>
                    <td className={TD_R}>{fmt(r.regularSalaryTotal)}</td>
                    <td className={TD_R}><MoneyCell n={r.overtimeSalaryTotal||0} /></td>
                    <td className={TD_R}><MoneyCell n={r.allowanceTotal||0} /></td>
                    <td className={`${TD_R} font-bold text-gray-900`}>{fmt(gross)}</td>
                    <td className={TD_C}><WarnCell n={r.warningTotal} /></td>
                    <td className={TD_R}>{r.penaltyTotal > 0 ? <span className="font-mono text-sm text-gray-700">{r.penaltyTotal} min</span> : <span className="text-gray-300">—</span>}</td>
                    <td className={TD_R}><MoneyCell n={r.penaltyAmount||0} /></td>
                    <td className={`${TD_R} font-semibold text-blue-600`}>{fmt(r.netPay)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* weekly drill-down removed per requirements */}
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Monthly drill-down dialog
  // ─────────────────────────────────────────────────────────────────────────────

  function MonthlyDrillDownDialog({ open, onClose, employee, token, monthStr, monthLabel }: {
    open: boolean; onClose: () => void
    employee: ApiEmployee; token: string
    monthStr: string; monthLabel: string
  }) {
    const [weeks, setWeeks] = useState<WeeklySalaryRow[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      if (!open) return
      setLoading(true)
      const [y, m] = monthStr.split("-").map(Number)
      const start = `${monthStr}-01`
      const end = `${monthStr}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`
      fetch(`${BASE}/api/payrolls/getWeeklySalary?fromDate=${start}&toDate=${end}`,
        { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: WeeklySalaryRow[]) => setWeeks(data.filter(r => r.employeeName === employee.employeeName)))
        .catch(() => setWeeks([]))
        .finally(() => setLoading(false))
    }, [open, monthStr, employee.employeeName, token])

    const [weekDrill, setWeekDrill] = useState<{ start: string; end: string } | null>(null)

    return (
      <>
        <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 rounded-none flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-violet-500" />
                  Weekly Salary Breakdown — {monthLabel}
                </DialogTitle>
                <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> Close
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Click any week row to view the daily salary breakdown</p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-blue-400" /></div>
              ) : weeks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No weekly records for {monthLabel}</div>
              ) : (
                <div className="space-y-3">
                  {weeks.map((r, i) => {
                    const gross = (r.regularSalaryTotal||0) + (r.overtimeSalaryTotal||0) + (r.allowanceTotal||0)
                    return (
                      <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div
                          className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200 flex items-center gap-3 cursor-pointer hover:from-violet-50 hover:to-violet-100 transition-colors group"
                          onClick={() => setWeekDrill({ start: r.weekStart, end: r.weekEnd })}
                          title="Click to view daily breakdown"
                        >
                          <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                          <span className="text-sm font-bold text-gray-800 group-hover:text-violet-700">Week {i + 1}</span>
                          <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">{r.weekStart} – {r.weekEnd}</span>
                          <span className="ml-auto text-[11px] text-violet-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click for daily breakdown →</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr>
                                <th className={TH_C}>Work Days</th>
                                <th className={TH_C}>Present</th>
                                <th className={TH_C}>Absent</th>
                                <th className={TH_C}>Att.%</th>
                                <th className={TH_R}>Regular</th>
                                <th className={TH_R}>Overtime</th>
                                <th className={TH_R}>Allowance</th>
                                <th className={TH_R}>Gross Pay</th>
                                <th className={TH_C}>Warnings</th>
                                <th className={TH_R}>Pen. Mins</th>
                                <th className={TH_R}>Penalty (₹)</th>
                                <th className={TH_R}>Net Salary</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-100">
                                <td className={TD_C}>{r.workingDays}</td>
                                <td className={TD_C}>{r.presentDays}</td>
                                <td className={TD_C}>{r.absentDays > 0 ? r.absentDays : <span className="text-gray-300">—</span>}</td>
                                <td className={`${TD_C} ${attendanceColor(r.presentDays, r.workingDays)}`}>{attendancePct(r.presentDays, r.workingDays)}</td>
                                <td className={TD_R}>{fmt(r.regularSalaryTotal)}</td>
                                <td className={TD_R}><MoneyCell n={r.overtimeSalaryTotal||0} /></td>
                                <td className={TD_R}><MoneyCell n={r.allowanceTotal||0} /></td>
                                <td className={`${TD_R} font-bold text-gray-900`}>{fmt(gross)}</td>
                                <td className={TD_C}><WarnCell n={r.warningTotal} /></td>
                                <td className={TD_R}>{r.penaltyTotal > 0 ? <span className="text-gray-700">{r.penaltyTotal} min</span> : <span className="text-gray-300">—</span>}</td>
                                <td className={TD_R}><MoneyCell n={r.penaltyAmount||0} /></td>
                                <td className={`${TD_R} font-semibold text-blue-600`}>{fmt(r.netPay)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {weekDrill && (
          <WeeklyDrillDownDialog open={!!weekDrill} onClose={() => setWeekDrill(null)}
            employee={employee} token={token} weekStart={weekDrill.start} weekEnd={weekDrill.end} />
        )}
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Monthly Salary table
  // ─────────────────────────────────────────────────────────────────────────────

  function MonthlySalaryTable({ employee, token, date, refreshKey }: {
    employee: ApiEmployee; token: string; date: Date; refreshKey?: number
  }) {
    const [rows, setRows] = useState<MonthlySalaryRow[]>([])
    const [loading, setLoading] = useState(false)

    const monthStr = useMemo(() => dateToMonthStr(date), [date])
    const monthLabel = date.toLocaleDateString("en-US", { year: "numeric", month: "long" })

    useEffect(() => {
      setLoading(true)
      fetch(`${BASE}/api/payrolls/getMonthlySalary?month=${monthStr}`,
        { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: MonthlySalaryRow[]) => setRows(data.filter(r => r.employeeName === employee.employeeName)))
        .catch(() => setRows([]))
        .finally(() => setLoading(false))
    }, [employee.employeeName, monthStr, refreshKey])

    if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-gray-300" /></div>
    if (rows.length === 0) return <div className="text-center py-5 text-sm text-gray-400">No payroll record for {monthLabel}</div>

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={TH}>Employee</th>
                <th className={TH_C}>Work Days</th>
                <th className={TH_C}>Present</th>
                <th className={TH_C}>Absent</th>
                <th className={TH_C}>Att.%</th>
                <th className={TH_R}>Regular</th>
                <th className={TH_R}>Overtime</th>
                <th className={TH_R}>Allowance</th>
                <th className={TH_R}>Gross Pay</th>
                <th className={TH_C}>Warnings</th>
                <th className={TH_R}>Pen. Mins</th>
                <th className={TH_R}>Penalty (₹)</th>
                <th className={TH_R}>Net Salary</th>
												 
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const gross = (r.regularSalaryTotal||0) + (r.overtimeSalaryTotal||0) + (r.allowanceTotal||0)
                const lbl = new Date(r.payrollMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })
                return (
                  <tr key={i}
                    className="border-b border-gray-100 transition-colors">
                    <td className={TD}>
                      <div className="font-semibold text-gray-800">{r.employeeName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.payrollMonth}</div>
                    </td>
                    <td className={TD_C}>{r.workingDays}</td>
                    <td className={TD_C}>{r.presentDays}</td>
                    <td className={TD_C}>{r.absentDays > 0 ? r.absentDays : <span className="text-gray-300">—</span>}</td>
                    <td className={`${TD_C} ${attendanceColor(r.presentDays, r.workingDays)}`}>{attendancePct(r.presentDays, r.workingDays)}</td>
                    <td className={TD_R}>{fmt(r.regularSalaryTotal)}</td>
                    <td className={TD_R}><MoneyCell n={r.overtimeSalaryTotal||0} /></td>
                    <td className={TD_R}><MoneyCell n={r.allowanceTotal||0} /></td>
                    <td className={`${TD_R} font-bold text-gray-900`}>{fmt(gross)}</td>
                    <td className={TD_C}><WarnCell n={r.warningTotal} /></td>
                    <td className={TD_R}>{hasPenaltyMins(r.penaltyMins) ? <span className="text-gray-700">{r.penaltyMins}</span> : <span className="text-gray-300">—</span>}</td>
                    <td className={TD_R}><MoneyCell n={r.penaltyAmount||0} /></td>
                    <td className={`${TD_R} font-semibold text-blue-600`}>{fmt(r.netPay)}</td>
																															 
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* monthly drill-down removed per requirements */}
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Warnings section
  // ─────────────────────────────────────────────────────────────────────────────

  function WarningsSection({ employee, token }: { employee: ApiEmployee; token: string }) {
    const [warnings, setWarnings] = useState<WarningRow[]>([])
    const [loading, setLoading] = useState(false)
    const mStr = dateToMonthStr(new Date())

    useEffect(() => {
      setLoading(true)
fetch(`${BASE}/api/warnings/by-employee-month?employeeId=${employee.employeeId}&month=${mStr}&pageNo=0&size=100`,        { headers: { Authorization: `Bearer ${token}` } })
														
.then(r => r.ok ? r.json() : { content: [] })
.then((page: { content: WarningRow[] }) => setWarnings(page.content))
.catch(() => setWarnings([]))        .finally(() => setLoading(false))
									   
    }, [employee.employeeId])

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-gray-600">Warnings — {mStr}</span>
          {!loading && warnings.length > 0 && (
            <span className="ml-auto text-[11px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              {warnings.length}
            </span>
          )}
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
          ) : warnings.length === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-700 font-medium">No warnings this month</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg -mx-4 -my-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {["Date", "Type", "Expected", "Actual", "Late", "Penalty"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {warnings.map((w, i) => (
                    <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">{w.warningDate}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">{w.warningType}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-600">{w.expectedTime || "—"}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-600">{w.actualTime || "—"}</td>
                      <td className="px-4 py-3 font-mono font-bold text-sm text-red-600">{w.lateMinutes}m</td>
                      <td className="px-4 py-3">
                        {w.penaltyApplied
                          ? <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md">Applied</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Role Permissions card
  // ─────────────────────────────────────────────────────────────────────────────

  interface RoleResponse { id: number; code: string; name: string }
  interface ModuleAction { actionCode: string; actionName: string }
  interface ModuleTree   { moduleCode: string; moduleName: string; actions: ModuleAction[] }

  function RolePermissionsCard({ employee, token }: { employee: ApiEmployee; token: string }) {
    const [modules, setModules] = useState<ModuleTree[]>([])
    const [roleLabel, setRoleLabel] = useState(employee.role)
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    useEffect(() => {
      if (!employee.role || !token) return
      setLoading(true)
      fetch(`${BASE}/api/roles`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(async (roles: RoleResponse[]) => {
          const match = roles.find(r =>
            r.name?.toLowerCase() === employee.role?.toLowerCase() ||
            r.code?.toLowerCase() === employee.role?.toLowerCase()
          )
          if (!match) { setModules([]); return }
          setRoleLabel(match.name)
          const res = await fetch(`${BASE}/api/roles/${match.id}/config`, { headers: { Authorization: `Bearer ${token}` } })
          const data = res.ok ? await res.json() : { moduleTree: [] }
          const tree: ModuleTree[] = data.moduleTree || []
          setModules(tree)
          const exp: Record<string, boolean> = {}
          tree.forEach(m => (exp[m.moduleCode] = true))
          setExpanded(exp)
        })
        .catch(() => setModules([]))
        .finally(() => setLoading(false))
    }, [employee.role, token])

    if (!employee.role) return null
    const toggle = (code: string) => setExpanded(p => ({ ...p, [code]: !p[code] }))

    const totalActions = modules.reduce((sum, m) => sum + m.actions.length, 0)

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
          <Lock className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-xs font-semibold text-gray-600">Role Permissions</span>
          {roleLabel && (
            <span className="ml-auto text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {roleLabel}
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
            <span className="text-xs text-gray-400">Loading permissions…</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-6 gap-1.5">
            <Lock className="h-5 w-5 text-gray-300" />
            <span className="text-xs text-gray-400">No permissions assigned</span>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="flex items-center gap-3 px-4 py-2 bg-purple-50 border-b border-purple-100">
              <span className="text-[11px] text-purple-700 font-semibold">{modules.length} module{modules.length !== 1 ? "s" : ""}</span>
              <span className="text-[10px] text-purple-400">·</span>
              <span className="text-[11px] text-purple-700 font-semibold">{totalActions} action{totalActions !== 1 ? "s" : ""}</span>
            </div>
            <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100">
              {modules.map(mod => (
                <div key={mod.moduleCode}>
                  <button onClick={() => toggle(mod.moduleCode)}
                    className={[
                      "w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors",
                      expanded[mod.moduleCode] ? "bg-indigo-50/60 hover:bg-indigo-50" : "hover:bg-gray-50"
                    ].join(" ")}>
                    <div className={["w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                      expanded[mod.moduleCode] ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"].join(" ")}>
                      {expanded[mod.moduleCode]
                        ? <ChevronDown className="h-3 w-3" />
                        : <ChevronRight className="h-3 w-3" />}
                    </div>
                    <span className={["text-xs font-semibold flex-1 text-left truncate",
                      expanded[mod.moduleCode] ? "text-indigo-700" : "text-gray-700"].join(" ")}>
                      {mod.moduleName}
                    </span>
                    <span className={["text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      expanded[mod.moduleCode]
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-500"].join(" ")}>
                      {mod.actions.length}
                    </span>
                  </button>
                  {expanded[mod.moduleCode] && (
                    <div className="bg-gray-50/80 px-4 py-1.5 space-y-1">
                      {mod.actions.map(act => (
                        <div key={act.actionCode} className="flex items-center gap-2 py-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                          <span className="text-[11px] text-gray-600">{act.actionName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

 
// ─────────────────────────────────────────────────────────────────────────────
// Salary & Punch section — all driven by one shared date + generate buttons
// ─────────────────────────────────────────────────────────────────────────────

function SalaryAndPunchSection({ employee, token }: { employee: ApiEmployee; token: string }) {
  const hasGenerateSalary = useHasAction(MODULES.EMPLOYEE_360, ACTIONS.EMP360_GENERATE_SALARY)
  const hasEditPunch = useHasAction(MODULES.EMPLOYEE_360, ACTIONS.EMP360_EDIT_PUNCH)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calOpen, setCalOpen]           = useState(false)
  const [punches, setPunches]           = useState<PunchRecord[]>([])
  const [loadingP, setLoadingP]         = useState(false)
  const [errorP, setErrorP]             = useState<string | null>(null)
  const [addOpen, setAddOpen]           = useState(false)
  const [editOpen, setEditOpen]         = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [activePunch, setActivePunch]   = useState<PunchRecord | null>(null)


    // refresh keys — bump to re-fetch the respective table after generate
    const [dailyKey,   setDailyKey]   = useState(0)
    const [weeklyKey,  setWeeklyKey]  = useState(0)
    const [monthlyKey, setMonthlyKey] = useState(0)

    // generate dialog state
    const [genDialog,  setGenDialog]  = useState<"daily" | "weekly" | "monthly" | null>(null)
    const [generating, setGenerating] = useState(false)

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const isToday = dateStr === todayStr()

    const weekLabel = useMemo(() => {
      const s = getWeekStart(selectedDate); const e = getWeekEnd(selectedDate)
      return `${formatDateShort(s)} → ${formatDateShort(e)}`
    }, [selectedDate])

    const monthLabel = selectedDate.toLocaleDateString("en-US", { year: "numeric", month: "long" })

    // ── fetch punches ──────────────────────────────────────────────────────────
    const fetchPunches = useCallback(async (ds: string) => {
      setLoadingP(true); setErrorP(null)
      try {
        const res = await fetch(`${BASE}/api/punch/${ds}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(res.statusText)
        setPunches((await res.json() || [])
          .filter((p: any) => p.employeeId === employee.employeeId)
          .map((p: any) => ({
            id: p.id?.toString() || "", employeeId: p.employeeId,
            employeeName: p.employeeName || employee.employeeName,
            date: p.attendanceDate || "", time: p.punchTime || "",
            type: p.punchType === "IN" ? "IN" : "OUT",
            source: p.source || "MANUAL", shift: "Morning", status: "valid",
          })))
      } catch (e) { setErrorP(e instanceof Error ? e.message : "Failed") }
      finally { setLoadingP(false) }
    }, [employee.employeeId, token])

    useEffect(() => { fetchPunches(dateStr) }, [dateStr, fetchPunches])

    const goDate = (delta: number) => {
      const d = new Date(selectedDate); d.setDate(d.getDate() + delta); setSelectedDate(d)
    }
    const handleDelete = async (punchId: string) => {
      const res = await fetch(`${BASE}/api/punch/delete/${punchId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Delete failed")
      setTimeout(() => fetchPunches(dateStr), 400)
    }

    // ── validation: check if today's daily salary has been calculated ─────────
    const [validationWarning, setValidationWarning] = useState<string | null>(null)

    const checkTodayDailySalary = useCallback(async (): Promise<boolean> => {
      try {
        const today = todayStr()
        const res = await fetch(`${BASE}/api/payrolls/getDailySalary?date=${today}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return false
        const data: DailySalaryRow[] = await res.json()
        return Array.isArray(data) && data.length > 0
      } catch {
        return false
      }
    }, [token])

    // ── open generate dialog with validation ──────────────────────────────────
    const openGenDialog = useCallback(async (type: "daily" | "weekly" | "monthly") => {
      if (type === "weekly" || type === "monthly") {
        const todayCalculated = await checkTodayDailySalary()
        if (!todayCalculated) {
          setValidationWarning(
            type === "weekly"
              ? "Today's salary has not been calculated. Please calculate today's salary before generating the weekly salary."
              : "Today's salary has not been calculated. Please calculate today's salary before generating the monthly salary."
          )
          setGenDialog(type)
          return
        }
      }
      setValidationWarning(null)
      setGenDialog(type)
    }, [checkTodayDailySalary])

    // ── proceed from validation warning: calculate daily first ────────────────
    const handleValidationProceed = useCallback(async () => {
      setValidationWarning(null)
      // Switch to daily generation first
      const prevDialog = genDialog
      setGenDialog("daily")
      setGenerating(true)
      try {
        const today = todayStr()
        const res = await fetch(`${BASE}/api/payrolls/calculate-daily-salary?date=${today}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(await res.text())
        setDailyKey(k => k + 1)
        // After daily is done, proceed with the original intent
        setGenDialog(prevDialog)
      } catch (err) {
        console.error("Daily generate error:", err)
        setGenDialog(null)
      } finally {
        setGenerating(false)
      }
    }, [genDialog, token])

    // ── generate handlers ──────────────────────────────────────────────────────
    const handleGenerate = async () => {
      if (!genDialog) return
      setGenerating(true)
      try {
        const ds = toDateStr(selectedDate)
        const ms = dateToMonthStr(selectedDate)
        const url =
          genDialog === "daily"
            ? `${BASE}/api/payrolls/calculate-daily-salary?date=${ds}`
            : genDialog === "weekly"
            ? `${BASE}/api/payrolls/GenerateWeeklySalary?anyDateInWeek=${ds}`
            : `${BASE}/api/payrolls/generateMonthlyPayroll?month=${ms}`

        const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(await res.text())

        // bump the right table's refresh key
        if (genDialog === "daily")   setDailyKey(k => k + 1)
        if (genDialog === "weekly")  setWeeklyKey(k => k + 1)
        if (genDialog === "monthly") setMonthlyKey(k => k + 1)

        setGenDialog(null)
      } catch (err) {
        console.error("Generate error:", err)
      } finally {
        setGenerating(false)
      }
    }

    // ── generate dialog descriptions ───────────────────────────────────────────
    const genMeta: Record<string, { title: string; description: string }> = {
      daily: {
        title: "Generate Daily Salary",
        description: `Calculate salary for all employees for ${dateStr}.`,
      },
      weekly: {
        title: "Generate Weekly Salary",
        description: `Calculate salary for all employees for the week: ${weekLabel}.`,
      },
      monthly: {
        title: "Generate Monthly Payroll",
        description: `Calculate payroll for all employees for ${monthLabel}.`,
      },
    }

    return (
      <div className="space-y-4">

        {/* ── Shared date bar ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selected Date</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => goDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Calendar trigger — highlighted blue when open */}
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                  <div className="" />
                  {format(selectedDate, "EEE, MMM dd yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <MultiViewCalendar selected={selectedDate}
                  onSelect={d => { setSelectedDate(d); setCalOpen(false) }}
                  fromYear={2020} toYear={2030} />
              </PopoverContent>
            </Popover>

            <button onClick={() => goDate(1)} disabled={isToday}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="ml-1 text-[11px] text-gray-400 hidden sm:inline">
              Week: <span className="font-medium text-gray-600">{weekLabel}</span>
            </span>
          </div>
        </div>

        {/* ── Punches + Daily Salary ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">

          {/* Punch Records */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-gray-600">Punch Records</span>
                <span className="text-[11px] text-gray-400">{punches.length} punch{punches.length !== 1 ? "es" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => fetchPunches(dateStr)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400">
                  <RefreshCw className="h-3 w-3" />
                </button>
                {!isToday && hasEditPunch && (
                <button onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-medium">
                  <Plus className="h-3 w-3" /> Add
                </button>
              )}
              </div>
            </div>
            <div className="overflow-x-auto">
              {loadingP ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
              ) : errorP ? (
                <div className="px-4 py-6 text-center text-sm text-red-500">{errorP}</div>
              ) : punches.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">No punches for {format(selectedDate, "MMM dd, yyyy")}</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-12">Type</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                      {!isToday && hasEditPunch && <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {punches.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2">
                          <span className={["text-[10px] font-bold px-1.5 py-0.5 rounded",
                            p.type === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"].join(" ")}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">{p.time}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{p.source}</td>
                        {!isToday && (
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hasEditPunch && (
                              <button onClick={() => { setActivePunch(p); setEditOpen(true) }}
                                className="p-1 rounded text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                            {hasEditPunch && (
                              <button onClick={() => { setActivePunch(p); setDeleteOpen(true) }}
                                className="p-1 rounded text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

          {/* Daily Salary */}
          <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs font-semibold text-gray-600">Daily Salary</span>
              <span className="text-[11px] text-gray-400">{dateStr}</span>
			{hasGenerateSalary && (
              <div className="ml-auto">
                <button
                  onClick={() => openGenDialog("daily")}
                  className="flex items-center gap-1.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Zap className="h-3 w-3" />
                  Generate
                </button>
              </div>
            )}
          </div>
            <DailySalaryTable employee={employee} token={token} date={dateStr} refreshKey={dailyKey} />
          </div>
        </div>

        {/* ── Weekly Salary ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <Activity className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-gray-600">Weekly Salary</span>
            <span className="text-[11px] text-gray-400">{weekLabel}</span>

								 
          {hasGenerateSalary && (
            <div className="ml-auto">
              <button
                onClick={() => openGenDialog("weekly")}
                className="flex items-center gap-1.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Zap className="h-3 w-3" />
                Generate
              </button>
            </div>
          )}
          </div>
          <WeeklySalaryTable employee={employee} token={token} date={selectedDate} refreshKey={weeklyKey} />
        </div>

        {/* ── Monthly Payroll ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <DollarSign className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-gray-600">Monthly Payroll</span>
            <span className="text-[11px] text-gray-400">{dateToMonthStr(selectedDate)}</span>

			 {hasGenerateSalary && (
            <div className="ml-auto">
              <button
                onClick={() => openGenDialog("monthly")}
                className="flex items-center gap-1.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Zap className="h-3 w-3" />
                Generate
              </button>
            </div>
          )}
			
          </div>
          <MonthlySalaryTable employee={employee} token={token} date={selectedDate} refreshKey={monthlyKey} />
        </div>

        {/* ── Generate confirmation dialog ──────────────────────────────────── */}
        {genDialog && (
          <GenerateDialog
            open={!!genDialog}
            onClose={() => { setGenDialog(null); setValidationWarning(null) }}
            title={genMeta[genDialog].title}
            description={genMeta[genDialog].description}
            onConfirm={handleGenerate}
            generating={generating}
            validationWarning={validationWarning}
            onValidationProceed={handleValidationProceed}
          />
        )}

        {/* Punch modals */}
        <PunchAddModal open={addOpen} onOpenChange={setAddOpen} allPunches={punches}
          workDate={dateStr} employeeId={employee.employeeId} authToken={token}
          onAdd={() => {}} onAddPair={() => {}} onRefresh={() => fetchPunches(dateStr)} />
        {activePunch && <>
          <PunchEditModal open={editOpen} onOpenChange={setEditOpen} punch={activePunch}
            allPunches={punches} workDate={dateStr} onSave={() => {}} onRefresh={() => fetchPunches(dateStr)} />
          <PunchDeleteModal open={deleteOpen} onOpenChange={setDeleteOpen}
            punch={activePunch} onConfirm={handleDelete} />
        </>}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Employee Detail Panel
  // ─────────────────────────────────────────────────────────────────────────────

  function EmployeeDetailPanel({ employee, token, onUpdated }: {
    employee: ApiEmployee; token: string; onUpdated: (e: ApiEmployee) => void
  }) {
    const isActive = employee.status === "ACTIVE"
    return (
      <div className="space-y-4">
        {/* Profile header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className={["w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
              isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"].join(" ")}>
              {initials(employee.employeeName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900">{employee.employeeName}</h2>
                <span className={["inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"].join(" ")}>
                  {isActive ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{employee.role || "—"}</div>
              <div className="text-[11px] text-gray-400 font-mono">{employee.employeeId}</div>
            </div>
          </div>
        </div>

        {/* 3-col info row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PersonalInfoCard employee={employee} onUpdated={onUpdated} />
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-gray-600">Shift & Salary Config</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {(employee.regularShifts || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-xs font-semibold text-blue-800">{s.shiftName}</div>
                    <div className="text-[11px] text-blue-500 mt-0.5">{s.amountType}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-blue-700">₹{s.amount}</div>
                    {s.extraAllowance > 0 && <div className="text-[11px] text-blue-400">+₹{s.extraAllowance}</div>}
                  </div>
                </div>
              ))}
              {(employee.overtimeShifts || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-xs font-semibold text-orange-800">{s.shiftName}</div>
                    <div className="text-[11px] text-orange-500 mt-0.5">OT · {s.amountType}</div>
                  </div>
                  <div className="text-xs font-bold text-orange-700">₹{s.amount}</div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-gray-400">Frequency:</span>
                <span className="text-[11px] font-medium text-gray-700">{employee.salaryFrequency}</span>
                <span className="text-[11px] text-gray-300 mx-1">·</span>
                <span className="text-[11px] text-gray-400">Policy:</span>
                <span className="text-[11px] font-medium text-gray-700 truncate">{employee.workdayPolicy}</span>
              </div>
            </div>
          </div>
          <RolePermissionsCard employee={employee} token={token} />
        </div>

        <SalaryAndPunchSection employee={employee} token={token} />
        <WarningsSection employee={employee} token={token} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Dashboard
  // ─────────────────────────────────────────────────────────────────────────────

  export function Employee360Dashboard() {
    const { auth } = useAuth()
			 const hasViewPermission = useHasAction(MODULES.EMPLOYEE_360, ACTIONS.EMP360_VIEW)
  const hasEditPersonalInfo = useHasAction(MODULES.EMPLOYEE_360, ACTIONS.EMP360_EDIT_PERSONAL_INFO)
  const hasGenerateSalary = useHasAction(MODULES.EMPLOYEE_360, ACTIONS.EMP360_GENERATE_SALARY)
  const hasEditPunch = useHasAction(MODULES.EMPLOYEE_360, ACTIONS.EMP360_EDIT_PUNCH)																	   
																								   
																							  
																					
    const [employees, setEmployees] = useState<ApiEmployee[]>([])
    const [selected, setSelected]   = useState<ApiEmployee | null>(null)
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState<string | null>(null)
    const [mobileDetail, setMobileDetail] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
      if (!auth?.token) return
      fetch(`${BASE}/api/employees/getAllEmployees`, { headers: { Authorization: `Bearer ${auth.token}` } })
        .then(r => r.ok ? r.json() : Promise.reject("Failed"))
        .then(setEmployees)
        .catch(() => setError("Failed to load employees. Please try again."))
        .finally(() => setLoading(false))
    }, [auth?.token])

    const handleSelect  = (emp: ApiEmployee) => { setSelected(emp); setMobileDetail(true) }
    const handleUpdated = (updated: ApiEmployee) => {
      setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e))
      setSelected(updated)
    }

    return (
      <div className="flex flex-col bg-gray-50" style={{ height: "calc(100vh - 56px)" }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {mobileDetail && selected && (
              <button onClick={() => setMobileDetail(false)} className="lg:hidden flex items-center gap-1 text-sm text-blue-600 mr-1 hover:text-blue-700">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Employee 360° Profile</h1>
              <p className="text-xs text-gray-500">
                {selected ? `Currently viewing: ${selected.employeeName}` : "Select an employee from the list to begin"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={[
            "flex-shrink-0 bg-white border-r border-gray-200 flex-col lg:flex transition-all duration-200",
            mobileDetail ? "hidden" : "flex",
          ].join(" ")} style={{ width: sidebarCollapsed ? "40px" : "272px", minWidth: sidebarCollapsed ? "40px" : "272px" }}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center pt-3">
                <button onClick={() => setSidebarCollapsed(false)} title="Expand sidebar"
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400">
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employees</span>
                  <button onClick={() => setSidebarCollapsed(true)} title="Collapse sidebar"
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400">
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </button>
                </div>
                <EmployeeListPanel employees={employees} selected={selected} onSelect={handleSelect} loading={loading} error={error} />
              </>
            )}
          </div>

          {/* Detail */}
          <div className={["flex-1 overflow-y-auto p-5 lg:block", mobileDetail ? "block" : "hidden"].join(" ")}>
            {selected && auth?.token ? (
              <EmployeeDetailPanel employee={selected} token={auth.token} onUpdated={handleUpdated} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">No Employee Selected</h3>
                <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
                  Choose an employee from the sidebar to view their complete profile including punches, salary details, and warnings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }