"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle, Loader2, User,
  TrendingUp,
  Monitor, Pencil, Bot, Fingerprint,
  GripVertical, AlertTriangle,
  Edit2, Trash2, Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/contexts/auth-context"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import PunchAddModal from "./punch-add-modal"
import PunchEditModal from "./punch-edit-modal"
import PunchDeleteModal from "./punch-delete-modal"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailySalaryRecord {
  id: number
  employeeId: string
  employeeName: string
  workDate: string
  workDuration: string
  salaryMinutes: number
  payableMinutes: string
  regularSalary: number
  overtimeSalary: number
  extraAllowance: number
  warningCount: number
  penaltyMinutes: string
  penaltyAmountDeducted: number
  totalPay: number
  createdAt: string | null
}

interface ShiftConfigDto {
  shiftName: string
  shiftTiming: string
  amountType: string
  amount: number
  extraAllowance: number
  type: string
}

interface AttendancePunchResponseDto {
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

interface UncoveredIntervalDto {
  from: string
  to: string
  durationMinutes: number
  reason: string
}

interface DailySalaryDetail {
  id: number
  employeeId: string
  employeeName: string
  workDate: string
  workDuration: string
  salaryMinutes: number
  payableMinutes: string
  regularSalary: number
  overtimeSalary: number
  extraAllowance: number
  warningCount: number
  penaltyMinutes: string
  penaltyAmount: number
  netSalary: number
  createdAt: string
  // Optional meta fields shown in the header bar
  salaryFrequency?: string
  workdayPolicy?:   string
  regularShifts: ShiftConfigDto[]
  overtimeShifts: ShiftConfigDto[]
  shiftBreakdown: ShiftBreakdownDto[]
  punches: AttendancePunchResponseDto[]
  uncoveredIntervals: UncoveredIntervalDto[]
}

interface Props {
  record: DailySalaryRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after any punch add/edit/delete so the parent list row stays in sync */
  onRecordUpdate?: (updated: DailySalaryRecord) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "₹0.00"
  return `₹${Number(n).toFixed(2)}`
}

function fmtAmountType(t: string): string {
  return t === "PER_HOUR"  ? "Per hour"
       : t === "PER_MONTH" ? "Per month"
       : t === "PER_DAY"   ? "Per day"
       : t
}

function isZeroTime(s: string | null | undefined): boolean {
  if (!s) return true
  return /^0+h?:?0+m?$/.test(s.trim()) || s.trim() === "0"
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getInitials(name: string): string {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
}

function SourceIcon({ source }: { source: string }) {
  if (source === "MANUAL")      return <Pencil  className="h-3 w-3 text-blue-500" />
  if (source === "SYSTEM_AUTO") return <Bot     className="h-3 w-3 text-purple-500" />
  return                               <Monitor className="h-3 w-3 text-gray-400" />
}

function SourceLabel({ source }: { source: string }): string {
  if (source === "MANUAL")      return "Manual"
  if (source === "SYSTEM_AUTO") return "System auto"
  return "Hikvision"
}

// ─── Shared cell styles ───────────────────────────────────────────────────────

const TH = "px-3 py-2.5 text-[11px] font-medium tracking-wide text-gray-500 bg-gray-100/80 border-b border-gray-200 border-r border-gray-200 whitespace-nowrap first:border-l first:border-l-gray-200 last:border-r-0"
const TD = "px-3 py-3 text-[12.5px] border-b border-gray-200 border-r border-gray-200 align-middle whitespace-nowrap first:border-l first:border-l-gray-200 last:border-r-0"

// ─── Resize hook ──────────────────────────────────────────────────────────────

function useHorizontalResize(initialPct: number, min: number, max: number) {
  const [pct, setPct] = useState(initialPct)
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const container = containerRef.current
    if (!container) return

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const rect = container.getBoundingClientRect()
      const newPct = ((ev.clientX - rect.left) / rect.width) * 100
      setPct(Math.min(max, Math.max(min, newPct)))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [min, max])

  return { pct, containerRef, onMouseDown }
}

// ─── Ticker Banner ────────────────────────────────────────────────────────────

const TICKER_ITEMS = Array.from({ length: 28 })

function TickerBanner() {
  return (
    <div className="flex-1 mx-4 overflow-hidden rounded-md border border-indigo-100 bg-indigo-50/60 h-8 flex items-center">
      <div
        className="flex items-center whitespace-nowrap"
        style={{ animation: "salary-ticker 18s linear infinite" }}
      >
        {TICKER_ITEMS.map((_, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-5 text-[10px] font-semibold uppercase tracking-widest text-indigo-500 select-none"
          >
            <span className="w-1 h-1 rounded-full bg-indigo-300 flex-shrink-0" />
            Salary breakdown
          </span>
        ))}
      </div>
      <style>{`
        @keyframes salary-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function DailySalaryDrilldownModal({ record, open, onOpenChange, onRecordUpdate }: Props) {
  const { auth } = useAuth()

  const canEditPunches = useHasAction(MODULES.VIEW_EDIT_PUNCHES, ACTIONS.PUNCHES_EDIT)

  const [detail,  setDetail]  = useState<DailySalaryDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Local copy of record so net salary updates live inside the modal
  // without waiting for the parent to re-render
  const [localRecord, setLocalRecord] = useState<DailySalaryRecord | null>(null)

  useEffect(() => {
    setLocalRecord(record)
  }, [record])

  // Punch modal state
  const [selectedPunch,     setSelectedPunch]     = useState<AttendancePunchResponseDto | null>(null)
  const [isAddModalOpen,    setIsAddModalOpen]    = useState(false)
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { pct: leftPct, containerRef, onMouseDown: onHDrag } = useHorizontalResize(52, 20, 80)

  // ── Fetch drilldown detail ────────────────────────────────────────────────

  const fetchDetail = useCallback(async () => {
    if (!record || !auth?.token) return
    setLoading(true)
    setError(null)

    try {
      // 1️⃣  Drilldown detail (shifts, punches, breakdown, uncovered intervals)
      const detailRes = await fetch(
        `http://localhost:8080/api/payrolls/getDailySalaryDetail?employeeId=${record.employeeId}&date=${record.workDate}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      if (!detailRes.ok) throw new Error(`${detailRes.status} ${detailRes.statusText}`)
      const detailData: DailySalaryDetail = await detailRes.json()
      setDetail(detailData)

      // 2️⃣  Re-fetch the summary record so net salary is fresh.
      try {
        const summaryRes = await fetch(
          `http://localhost:8080/api/payrolls/getDailySalary?employeeId=${record.employeeId}&date=${record.workDate}`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        )
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json()

          // ✅ FIX: Always find by employeeId — never blindly take [0],
          //    which could be a different employee when the API returns a list.
          const fresh: DailySalaryRecord = Array.isArray(summaryData)
            ? summaryData.find((r: DailySalaryRecord) => r.employeeId === record.employeeId) ?? summaryData[0]
            : summaryData

          if (fresh) {
            setLocalRecord(fresh)
            onRecordUpdate?.(fresh)
          }
        }
      } catch {
        // If the summary endpoint doesn't exist, derive values from the detail
        // response. ✅ FIX: Always anchor to `record` (the prop) — never
        // `localRecord`, which may still hold the previous employee's data.
        const derived: DailySalaryRecord = {
          ...record,
          workDuration:          detailData.workDuration,
          payableMinutes:        detailData.payableMinutes,
          regularSalary:         detailData.regularSalary,
          overtimeSalary:        detailData.overtimeSalary,
          extraAllowance:        detailData.extraAllowance,
          penaltyMinutes:        detailData.penaltyMinutes,
          penaltyAmountDeducted: detailData.penaltyAmount,
          totalPay:              detailData.netSalary,
        }
        setLocalRecord(derived)
        onRecordUpdate?.(derived)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [record?.employeeId, record?.workDate, auth?.token])

  useEffect(() => {
    if (!open) return
    fetchDetail()
  }, [open, fetchDetail])

  // ── Punch action handlers ─────────────────────────────────────────────────

  const handleDeletePunch = async (punchId: string) => {
    if (!auth?.token) throw new Error("Unauthorized – please login again.")

    const response = await fetch(`http://localhost:8080/api/punch/delete/${punchId}`, {
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
    await fetchDetail()
  }

  // Map AttendancePunchResponseDto → shape expected by punch modals
  const toPunchModalShape = (p: AttendancePunchResponseDto) => ({
    id:           p.id.toString(),
    employeeId:   record?.employeeId   ?? "",
    employeeName: record?.employeeName ?? "",
    date:         p.attendanceDate,
    time:         p.punchTime,
    type:         p.punchType as "IN" | "OUT",
    source:       p.source,
    shift:        "Morning",
    note:         "",
    status:       "valid" as const,
  })

  if (!localRecord) return null

  const displayRecord = localRecord

  const punches = detail?.punches ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !inset-0 !top-0 !left-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !translate-x-0 !translate-y-0 flex flex-col p-0 gap-0 overflow-hidden bg-[#f8f9fb]">

        {/* ══ HEADER ══ */}
        <div className="flex-shrink-0 flex items-center px-5 py-3 bg-white border-b-2 border-gray-200 shadow-sm pr-12 gap-0">

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0 select-none shadow">
              {getInitials(displayRecord.employeeName)}
            </div>
            <div>
              <DialogTitle className="text-[13.5px] font-semibold text-gray-900 leading-tight">
                {displayRecord.employeeName}
              </DialogTitle>
              <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{displayRecord.workDate}</p>
            </div>
          </div>

          <TickerBanner />

        </div>

        {/* ══ MAIN ══ */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-5 py-3 gap-1">

          {loading && (
            <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading....
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center px-8">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm shadow-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* ── Salary Breakdown ── */}
              <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm">
                <SalaryBreakdownTable detail={detail} />
              </div>

              {/* ── Lower Panes (horizontally resizable) ── */}
              <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">

                {/* Left: Assigned Shifts */}
                <div
                  style={{ width: `${leftPct}%` }}
                  className="flex flex-col overflow-hidden bg-white border-r border-gray-200 flex-shrink-0"
                >
                  <SectionHeader
                    icon={<User className="h-3 w-3" />}
                    title="Assigned shifts"
                    count={`${detail.regularShifts.length + detail.overtimeShifts.length} shift${detail.regularShifts.length + detail.overtimeShifts.length !== 1 ? "s" : ""}`}
                    accent="blue"
                  />
                  <div className="flex-1 overflow-y-auto overflow-x-auto border-t border-gray-200">
                    {detail.regularShifts.length === 0 && detail.overtimeShifts.length === 0 ? (
                      <EmptyState label="No shifts assigned." />
                    ) : (
                      <table className="w-full border-collapse text-[12.5px]">
                        <thead>
                          <tr>
                            <th className={`${TH} text-left w-[36%]`}>Shift name</th>
                            <th className={`${TH} text-center w-[16%]`}>Type</th>
                            <th className={`${TH} text-center w-[20%]`}>Amount type</th>
                            <th className={`${TH} text-right w-[14%]`}>Amount</th>
                            <th className={`${TH} text-right w-[14%]`}>Allowance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.regularShifts.map((s, i) => (
                            <tr key={`reg-${i}`} className="hover:bg-blue-50/30 transition-colors">
                              <td className={`${TD} text-left`}>
                                <p className="font-medium text-gray-800">{s.shiftName}</p>
                                <p className="text-[11px] font-mono text-gray-400 mt-0.5">{s.shiftTiming}</p>
                              </td>
                              <td className={`${TD} text-center`}><RegBadge /></td>
                              <td className={`${TD} text-center text-gray-500`}>{fmtAmountType(s.amountType)}</td>
                              <td className={`${TD} text-right font-mono font-medium text-green-700`}>{fmt(s.amount)}</td>
                              <td className={`${TD} text-right font-mono`}>
                                {s.extraAllowance != null && Number(s.extraAllowance) > 0
                                  ? <span className="text-blue-600 font-medium">{fmt(s.extraAllowance)}</span>
                                  : <Dash />}
                              </td>
                            </tr>
                          ))}
                          {detail.overtimeShifts.map((s, i) => (
                            <tr key={`ot-${i}`} className="hover:bg-green-50/40 transition-colors bg-green-50/10">
                              <td className={`${TD} text-left`}>
                                <p className="font-medium text-gray-800">{s.shiftName}</p>
                                <p className="text-[11px] font-mono text-gray-400 mt-0.5">{s.shiftTiming}</p>
                              </td>
                              <td className={`${TD} text-center`}><OtBadge /></td>
                              <td className={`${TD} text-center text-gray-500`}>{fmtAmountType(s.amountType)}</td>
                              <td className={`${TD} text-right font-mono font-medium text-green-700`}>{fmt(s.amount)}</td>
                              <td className={`${TD} text-right font-mono`}>
                                {s.extraAllowance != null && Number(s.extraAllowance) > 0
                                  ? <span className="text-blue-600 font-medium">{fmt(s.extraAllowance)}</span>
                                  : <Dash />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Horizontal drag handle */}
                <div
                  onMouseDown={onHDrag}
                  className="flex-shrink-0 w-2 flex items-center justify-center cursor-col-resize border-x border-gray-100 hover:bg-blue-50/60 transition-colors group"
                  title="Drag to resize panels"
                >
                  <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>

                {/* Right: Punch Details */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#fafbfd]">

                  {/* Section header with Add button */}
                  <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b-2 border-gray-200">
                    <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                      <span className="w-1 h-3.5 rounded-sm bg-purple-500" />
                      <Fingerprint className="h-3 w-3" />
                      Punch details
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-full">
                        {punches.length} punch{punches.length !== 1 ? "es" : ""}
                      </span>
                      {canEditPunches && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 gap-1 px-2 text-[11px]"
                          onClick={() => setIsAddModalOpen(true)}
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto overflow-x-auto border-t border-gray-200">
                    {punches.length === 0 ? (
                      <EmptyState label="No punches recorded." />
                    ) : (
                      <table className="w-full border-collapse text-[12.5px]">
                        <thead>
                          <tr>
                            <th className={`${TH} text-left`}>Employee</th>
                            <th className={`${TH} text-left`}>Date</th>
                            <th className={`${TH} text-center`}>Type</th>
                            <th className={`${TH} text-left`}>Time</th>
                            <th className={`${TH} text-left`}>Source</th>
                            {canEditPunches && (
                              <th className={`${TH} text-center`}>Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {punches.map((p) => {
                            const isIn = p.punchType === "IN"
                            return (
                              <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                                {/* ✅ FIX: Use record.employeeName (the prop), not
                                    displayRecord.employeeName which can be stale */}
                                <td className={`${TD} font-medium text-gray-800`}>{record?.employeeName}</td>
                                <td className={`${TD} text-left text-gray-700`}>
                                  {fmtDate(p.attendanceDate)}
                                </td>
                                <td className={`${TD} text-center`}>
                                  {isIn
                                    ? <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">IN</span>
                                    : <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600">OUT</span>
                                  }
                                </td>
                                <td className={`${TD} font-mono tracking-wide text-gray-800`}>{p.punchTime}</td>
                                <td className={`${TD}`}>
                                  <span className="flex items-center gap-1.5 text-gray-500">
                                    <SourceIcon source={p.source} />
                                    {SourceLabel({ source: p.source })}
                                  </span>
                                </td>
                                {canEditPunches && (
                                  <td className={`${TD} text-center`}>
                                    <div className="flex gap-2 justify-center">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 h-7 px-2 text-xs"
                                        onClick={() => {
                                          setSelectedPunch(p)
                                          setIsEditModalOpen(true)
                                        }}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 h-7 px-2 text-xs text-red-600 hover:text-red-700 bg-transparent"
                                        onClick={() => {
                                          setSelectedPunch(p)
                                          setIsDeleteModalOpen(true)
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
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
                </div>

              </div>

              {/* ── Uncovered Intervals ── */}
              <UncoveredIntervalsPanel intervals={detail.uncoveredIntervals ?? []} />
            </>
          )}
        </div>

        {/* ══ BOTTOM BAR ══ */}
        {!loading && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-8 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-end gap-5 flex-wrap">
              {(displayRecord.penaltyAmountDeducted || 0) > 0 && (
                <>
                  <BarItem
                    label="Penalty"
                    value={`− ${fmt(displayRecord.penaltyAmountDeducted)}`}
                    valueClass="text-red-500"
                    labelClass="text-red-400"
                  />
                  <BarSep />
                </>
              )}
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[11px] uppercase tracking-widest text-gray-400 font-medium">Net salary</span>
                <span className="font-mono font-bold text-blue-600 text-[19px]">{fmt(displayRecord.totalPay)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ PUNCH MODALS ══ */}
        <PunchAddModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onAdd={async () => {
            setIsAddModalOpen(false)
            await fetchDetail()
          }}
          onAddPair={async () => {
            setIsAddModalOpen(false)
            await fetchDetail()
          }}
          allPunches={punches.map(toPunchModalShape)}
          workDate={displayRecord.workDate}
          employeeId={displayRecord.employeeId}
          authToken={auth?.token}
          onRefresh={fetchDetail}
        />

        {selectedPunch && (
          <PunchEditModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            punch={toPunchModalShape(selectedPunch)}
            allPunches={punches.map(toPunchModalShape)}
            onSave={async () => {
              setIsEditModalOpen(false)
              await fetchDetail()
            }}
            onRefresh={fetchDetail}
            workDate={displayRecord.workDate}
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

      </DialogContent>
    </Dialog>
  )
}

// ─── Small shared components ──────────────────────────────────────────────────

type Accent = "blue" | "purple" | "green" | "amber"

const accentBar: Record<Accent, string> = {
  blue:   "bg-blue-500",
  purple: "bg-purple-500",
  green:  "bg-green-500",
  amber:  "bg-amber-500",
}

function SectionHeader({ icon, title, count, accent = "blue" }: {
  icon: React.ReactNode
  title: string
  count: string
  accent?: Accent
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b-2 border-gray-200">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
        <span className={`w-1 h-3.5 rounded-sm ${accentBar[accent]}`} />
        {icon}{title}
      </span>
      <span className="text-[10.5px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-14 text-center text-sm text-gray-400">{label}</p>
}

function Dash() {
  return <span className="text-gray-300 text-xs">—</span>
}

function RegBadge() {
  return (
    <span className="inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
      REGULAR
    </span>
  )
}

function OtBadge() {
  return (
    <span className="inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
      OVERTIME
    </span>
  )
}

function BarItem({ label, value, valueClass = "text-gray-700", labelClass = "text-gray-400" }: {
  label: string
  value: string
  valueClass?: string
  labelClass?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] uppercase tracking-widest font-medium ${labelClass}`}>{label}</span>
      <span className={`font-mono text-[13px] font-semibold ${valueClass}`}>{value}</span>
    </div>
  )
}

function BarSep() {
  return <span className="w-px h-4 bg-gray-200" />
}

// ─── Salary Breakdown Table ────────────────────────────────────────────────────

function SalaryBreakdownTable({ detail }: { detail: DailySalaryDetail }) {
  const rows = detail.shiftBreakdown ?? []
  if (rows.length === 0) return null

  const sumSalary      = rows.reduce((a, r) => a + (Number(r.salary)         || 0), 0)
  const sumAllowance   = rows.reduce((a, r) => a + (Number(r.allowance)      || 0), 0)
  const sumPenaltyMins = rows.reduce((a, r) => a + (Number(r.penaltyMinutes) || 0), 0)
  const sumPenaltyAmt  = rows.reduce((a, r) => a + (Number(r.penaltyAmount)  || 0), 0)
  const sumTotal       = rows.reduce((a, r) => a + (Number(r.total)          || 0), 0)

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b-2 border-gray-200 rounded-t-xl">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          <span className="w-1 h-3.5 rounded-sm bg-indigo-500" />
          <TrendingUp className="h-3 w-3 text-indigo-500" />
          Salary breakdown
        </span>
        <span className="text-[10.5px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-full">
          {rows.length} shift{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto border-t border-gray-200">
        <table className="w-full border-collapse text-[12.5px] min-w-[820px]">
          <thead>
            <tr>
              <th className={`${TH} text-left w-[22%]`}>Shift name</th>
              <th className={`${TH} text-center w-[6%]`}>Type</th>
              <th className={`${TH} text-center w-[9%]`}>Req. hours</th>
              <th className={`${TH} text-center w-[9%]`}>Paid hours</th>
              <th className={`${TH} text-right w-[9%]`}>Amt / hr</th>
              <th className={`${TH} text-right w-[10%]`}>Salary</th>
              <th className={`${TH} text-right w-[9%]`}>Allowance</th>
              <th className={`${TH} text-center w-[8%]`}>Pen. mins</th>
              <th className={`${TH} text-right w-[9%]`}>Pen. amt</th>
              <th className={`${TH} text-right w-[9%]`}>Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const isOT = row.type === "OVERTIME"
              const hoursMatch = row.paidMinutes === row.reqMinutes
              return (
                <tr
                  key={i}
                  className={`transition-colors ${isOT ? "bg-green-50/20 hover:bg-green-50/50" : "hover:bg-indigo-50/20"}`}
                >
                  <td className={`${TD} text-left`}>
                    <p className="font-medium text-gray-800">{row.shiftName || "—"}</p>
                    {row.shiftTiming && (
                      <p className="text-[11px] font-mono text-gray-400 mt-0.5">{row.shiftTiming}</p>
                    )}
                  </td>
                  <td className={`${TD} text-center`}>
                    {isOT ? <OtBadge /> : <RegBadge />}
                  </td>
                  <td className={`${TD} text-center`}>
                    {!isZeroTime(row.reqMinutes)
                      ? <span className="font-mono text-[12px] text-gray-500">{row.reqMinutes}</span>
                      : <Dash />}
                  </td>
                  <td className={`${TD} text-center`}>
                    {!isZeroTime(row.paidMinutes)
                      ? <span className={`font-mono text-[12px] font-medium ${hoursMatch ? "text-green-600" : "text-amber-500"}`}>
                          {row.paidMinutes}
                        </span>
                      : <Dash />}
                  </td>
                  <td className={`${TD} text-right`}>
                    {Number(row.amountPerHour) > 0
                      ? <span className="font-mono text-[12px] text-gray-500">{fmt(row.amountPerHour)}</span>
                      : <Dash />}
                  </td>
                  <td className={`${TD} text-right`}>
                    <span className="font-mono font-medium text-green-700">{fmt(row.salary)}</span>
                    {!isOT && (row.penaltyAmount || 0) > 0 && (
                      <p className="text-[10px] text-red-600 mt-0.5">penalty deducted</p>
                    )}
                  </td>
                  <td className={`${TD} text-right font-mono`}>
                    {Number(row.allowance) > 0
                      ? <span className="text-blue-600 font-medium">{fmt(row.allowance)}</span>
                      : <Dash />}
                  </td>
                  <td className={`${TD} text-center font-mono`}>
                    {!isZeroTime(String(row.penaltyMinutes))
                      ? <span className="text-red-500 font-medium text-[12px]">{row.penaltyMinutes}</span>
                      : <Dash />}
                  </td>
                  <td className={`${TD} text-right font-mono`}>
                    {Number(row.penaltyAmount) > 0
                      ? <span className="text-red-500 font-medium">{fmt(row.penaltyAmount)}</span>
                      : <Dash />}
                  </td>
                  <td className={`${TD} text-right font-mono font-medium`}>
                    <span className={Number(row.total) >= 0 ? "text-indigo-600" : "text-red-500"}>
                      {fmt(row.total)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50/80">
              <td className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500 border-r border-gray-200" colSpan={2}>
                Total
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-[12px] text-gray-500 border-r border-gray-200">
                {!isZeroTime(detail.payableMinutes) ? detail.payableMinutes : <Dash />}
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-[12px] font-medium text-gray-700 border-r border-gray-200">
                {!isZeroTime(detail.workDuration) ? detail.workDuration : <Dash />}
              </td>
              <td className="px-3 py-2.5 text-center border-r border-gray-200"><Dash /></td>
              <td className="px-3 py-2.5 text-right font-mono font-medium text-gray-800 border-r border-gray-200">{fmt(sumSalary)}</td>
              <td className="px-3 py-2.5 text-right font-mono font-medium text-blue-600 border-r border-gray-200">
                {sumAllowance > 0 ? fmt(sumAllowance) : <Dash />}
              </td>
              <td className="px-3 py-2.5 text-center font-mono font-medium text-red-500 border-r border-gray-200">
                {sumPenaltyMins > 0 ? sumPenaltyMins : <Dash />}
              </td>
              <td className="px-3 py-2.5 text-right font-mono font-medium text-red-500 border-r border-gray-200">
                {sumPenaltyAmt > 0 ? `${fmt(sumPenaltyAmt)}` : <Dash />}
              </td>
              <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-600 text-[14px]">
                {fmt(sumTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── Uncovered Intervals Panel ────────────────────────────────────────────────

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function UncoveredIntervalsPanel({ intervals }: { intervals: UncoveredIntervalDto[] }) {
  const [expanded, setExpanded] = useState(false)
  const significant = intervals.filter(i => i.durationMinutes >= 15)
  const totalMins   = significant.reduce((a, i) => a + i.durationMinutes, 0)

  return (
    <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b-2 border-gray-200 cursor-pointer hover:bg-amber-50/40 transition-colors select-none"
        onClick={() => setExpanded(prev => !prev)}
      >
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          <span className="w-1 h-3.5 rounded-sm bg-amber-500" />
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          Uncovered intervals
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-full">
            {significant.length} gap{significant.length !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] text-amber-500 font-medium underline underline-offset-2">
            {expanded ? "Hide" : "Click to view"}
          </span>
          <svg
            className={`h-3.5 w-3.5 text-amber-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <>
          {significant.length === 0 && (
            <EmptyState label="All worked time is within configured shifts." />
          )}
          {significant.length > 0 && (
            <div className="overflow-x-auto border-t border-gray-200">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th className={`${TH} text-left w-[30%]`}>From</th>
                    <th className={`${TH} text-left w-[30%]`}>To</th>
                    <th className={`${TH} text-center w-[20%]`}>Duration</th>
                    <th className={`${TH} text-left`}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {significant.map((interval, i) => (
                    <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                      <td className={`${TD} text-left`}>
                        <p className="font-mono font-medium text-gray-800">{interval.from}</p>
                      </td>
                      <td className={`${TD} text-left`}>
                        <p className="font-mono font-medium text-gray-800">{interval.to}</p>
                      </td>
                      <td className={`${TD} text-center`}>
                        <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          {fmtDuration(interval.durationMinutes)}
                        </span>
                      </td>
                      <td className={`${TD} text-left`}>
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                          {interval.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500 border-r border-gray-200" colSpan={2}>
                      Total
                    </td>
                    <td className="px-3 py-2.5 text-center border-r border-gray-200">
                      <span className="inline-flex items-center text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        {fmtDuration(totalMins)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-gray-400">
                      {significant.length} uncovered gap{significant.length !== 1 ? "s" : ""}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}