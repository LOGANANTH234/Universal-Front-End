"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Filter, AlertCircle, CalendarIcon, Eye, X, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MONTHS } from "@/lib/payslip-data"
import { PayslipStatusBadge } from "./payslip-status-badge"
import { MultiViewCalendar } from "./multi-view-calendar"
import { MonthYearCalendar } from "./month-year-calendar"
import { formatDateShort, getWeekStart, getWeekEnd } from "@/lib/date-week-utils"

// ── Java boolean "isPaySlipGenerated" → Jackson serialises as "paySlipGenerated" ──
interface ApiEmployee {
  employeeName: string
  employeeId: string
  imageUrl: string | null
  role: string | null
  gender: string | null
  salaryFrequency: string | null
  paySlipGenerated: boolean
  totalAmount: string
}

// Per-employee generation status tracked during bulk generate
type GenStatus = "idle" | "generating" | "done" | "failed"

const BASE   = "http://localhost:8080/api/pdf"
const SALARY = "http://localhost:8080/api/payrolls"

export function GeneratePayslipScreen() {
  const [selectedEmployee, setSelectedEmployee]   = useState<string>("")
  const [selectedType, setSelectedType]           = useState<string>("monthly")
  const [selectedDate, setSelectedDate]           = useState<Date>(new Date())
  const [selectedStatus, setSelectedStatus]       = useState<string>("")
  const [searchQuery, setSearchQuery]             = useState<string>("")
  const [isDailyCalendarOpen, setIsDailyCalendarOpen]     = useState(false)
  const [isWeeklyCalendarOpen, setIsWeeklyCalendarOpen]   = useState(false)
  const [isMonthlyCalendarOpen, setIsMonthlyCalendarOpen] = useState(false)
  const [apiEmployees, setApiEmployees]           = useState<ApiEmployee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
// ── Preview error modal ────────────────────────────────────────────────────
const [previewErrorModalOpen, setPreviewErrorModalOpen] = useState(false)
const [previewErrorModalEmployee, setPreviewErrorModalEmployee] = useState<string>("")
  // ── Zero salary warning modal ──────────────────────────────────────────────
  const [showZeroSalaryWarning, setShowZeroSalaryWarning] = useState(false)

  // ── Bulk generate progress modal ──────────────────────────────────────────
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [genStatusMap, setGenStatusMap]           = useState<Record<string, GenStatus>>({})
  const [bulkGenError, setBulkGenError]           = useState<Record<string, string>>({})
  const [generateStarted, setGenerateStarted]     = useState(false)

  // ── Salary calculation status (shown inside the progress modal) ────────────
  type CalcPhase = "idle" | "calculating" | "done" | "failed"
  const [calcPhase, setCalcPhase] = useState<CalcPhase>("idle")
  const [calcError, setCalcError] = useState<string | null>(null)

  // ── Preview state ──────────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen]           = useState(false)
  const [previewName, setPreviewName]           = useState<string>("")
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError]         = useState(false)
  const [pdfPages, setPdfPages]                 = useState<string[]>([])
  const [currentPage, setCurrentPage]           = useState(1)

  // ── Per-employee generate tracking ────────────────────────────────────────
  const [singleGenStatus, setSingleGenStatus] = useState<Record<string, GenStatus>>({})
  const [singleGenError, setSingleGenError]   = useState<Record<string, string>>({})

  // ── Error modal (no-salary) ────────────────────────────────────────────────
  const [errorModalOpen, setErrorModalOpen]     = useState(false)
  const [errorModalEmployee, setErrorModalEmployee] = useState<string>("")

  const NO_SALARY_MESSAGE =
    "No salary found for the selected period and employee. Please go to the Salary tab, generate the salary, and then download the payslip."

  // ── Auth header ────────────────────────────────────────────────────────────
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("auth")
      ? JSON.parse(localStorage.getItem("auth")!).token
      : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // ── Date params ────────────────────────────────────────────────────────────
  const pad = (n: number) => String(n).padStart(2, "0")

  const getDateParam = () => {
    const y = selectedDate.getFullYear()
    const m = pad(selectedDate.getMonth() + 1)
    const d = pad(selectedDate.getDate())
    return selectedType === "monthly" ? `${y}-${m}` : `${y}-${m}-${d}`
  }

  // ── Week range helpers ─────────────────────────────────────────────────────
  const getWeekStartStr = () => {
    const s = getWeekStart(selectedDate)
    return `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`
  }
  const getWeekEndStr = () => {
    const e = getWeekEnd(selectedDate)
    return `${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}`
  }

  // ── Build salary calculation URL based on type ─────────────────────────────
  const buildCalcUrl = (): string => {
    if (selectedType === "daily")  return `${SALARY}/calculate-daily-salary?date=${getDateParam()}`
    if (selectedType === "weekly") return `${SALARY}/GenerateWeeklySalary?anyDateInWeek=${getDateParam()}`
    return `${SALARY}/generateMonthlyPayroll?month=${getDateParam()}`
  }

  // ── Build PDF URLs ─────────────────────────────────────────────────────────
  const buildGenerateUrl = (employeeName: string) => {
    const n = encodeURIComponent(employeeName)
    const d = getDateParam()
    if (selectedType === "monthly") return `${BASE}/payslip/generate/monthly/${n}?month=${d}`
    if (selectedType === "daily")   return `${BASE}/payslip/generate/daily/${n}?date=${d}`
    return `${BASE}/payslip/generate/weekly/${n}?date=${d}`
  }

  const buildPreviewUrl = (employeeName: string) => {
    const n = encodeURIComponent(employeeName)
    const d = getDateParam()
    if (selectedType === "monthly") return `${BASE}/payslip/preview/monthly/${n}?month=${d}`
    if (selectedType === "daily")   return `${BASE}/payslip/preview/daily/${n}?date=${d}`
    return `${BASE}/payslip/preview/weekly/${n}?date=${d}`
  }

  // ── Fetch employees ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!selectedType) { setApiEmployees([]); return }
      setIsLoadingEmployees(true)
      try {
        const url = `${BASE}/getEmployeesForPayslip?type=${selectedType.toUpperCase()}&date=${getDateParam()}`
        const res = await fetch(url, { headers: getAuthHeaders() })
        if (!res.ok) throw new Error(`API ${res.status}`)
        const data = await res.json()
        setApiEmployees(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("[payslip] fetch error:", err)
        setApiEmployees([])
      } finally {
        setIsLoadingEmployees(false)
      }
    }
    fetchEmployees()
  }, [selectedType, selectedDate])

  // ── Week label ─────────────────────────────────────────────────────────────
  const weekRangeDisplay = useMemo(() =>
    `${formatDateShort(getWeekStart(selectedDate))} → ${formatDateShort(getWeekEnd(selectedDate))}`,
    [selectedDate])

  const dateBtnLabel = useMemo(() => {
    if (selectedType === "daily")  return formatDateShort(selectedDate)
    if (selectedType === "weekly") return weekRangeDisplay
    return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
  }, [selectedType, selectedDate, weekRangeDisplay])

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredPayslips = useMemo(() => {
    let r = apiEmployees
    if (selectedEmployee) r = r.filter(p => p.employeeId === selectedEmployee)
    if (selectedStatus === "generated") r = r.filter(p => p.paySlipGenerated === true)
    if (selectedStatus === "pending")   r = r.filter(p => p.paySlipGenerated === false)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      r = r.filter(p =>
        p.employeeName?.toLowerCase().includes(q) ||
        p.employeeId?.toLowerCase().includes(q))
    }
    return r
  }, [apiEmployees, selectedEmployee, selectedStatus, searchQuery])

  const allEmployeeNames = useMemo(() =>
    Array.from(new Set(apiEmployees.map(p => p.employeeName))),
    [apiEmployees])

  const checkAllZeroSalary = () =>
    allEmployeeNames.length > 0 &&
    allEmployeeNames.every(name => {
      const emp = apiEmployees.find(p => p.employeeName === name)
      return emp && Number(emp.totalAmount ?? 0) === 0
    })

  // ── Salary calculation ─────────────────────────────────────────────────────
  const runSalaryCalculation = async (): Promise<boolean> => {
    setCalcPhase("calculating")
    setCalcError(null)
    try {
      const url = buildCalcUrl()
      const res = await fetch(url, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error(`Salary calculation failed (${res.status})`)

      const listUrl = `${BASE}/getEmployeesForPayslip?type=${selectedType.toUpperCase()}&date=${getDateParam()}`
      const listRes = await fetch(listUrl, { headers: getAuthHeaders() })
      if (listRes.ok) {
        const data = await listRes.json()
        if (Array.isArray(data)) setApiEmployees(data)
      }

      setCalcPhase("done")
      return true
    } catch (err: any) {
      console.error("[payslip] calc error:", err)
      setCalcError(err?.message ?? "Calculation failed")
      setCalcPhase("failed")
      return false
    }
  }

  // ── Helper: download blob as PDF ───────────────────────────────────────────
  const downloadBlob = (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  }

  // ── Bulk PDF generation (sequential) ──────────────────────────────────────
  const runBulkGenerate = async (names: string[]) => {
    for (const name of names) {
      setGenStatusMap(prev => ({ ...prev, [name]: "generating" }))
      try {
        const res = await fetch(buildGenerateUrl(name), {
          method: "GET",
          headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error(`Generate failed (${res.status})`)

        const blob = await res.blob()
        downloadBlob(blob, `${name}_${selectedType}_${getDateParam()}.pdf`)

        setApiEmployees(prev =>
          prev.map(e => e.employeeName === name ? { ...e, paySlipGenerated: true } : e))
        setGenStatusMap(prev => ({ ...prev, [name]: "done" }))
      } catch (err) {
        console.error("[payslip] generate error:", err)
        setGenStatusMap(prev => ({ ...prev, [name]: "failed" }))
        setBulkGenError(prev => ({ ...prev, [name]: NO_SALARY_MESSAGE }))
      }
    }
  }

  // ── Orchestrator: calculate (if needed) → generate PDFs ───────────────────
  useEffect(() => {
    if (!showGenerateModal || !generateStarted || allEmployeeNames.length === 0) return
    setGenerateStarted(false)

    const run = async () => {
      if (calcPhase === "calculating") {
        const ok = await runSalaryCalculation()
        if (!ok) return
      }
      await runBulkGenerate(allEmployeeNames)
    }

    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGenerateModal, generateStarted])

  // ── Open the progress modal ────────────────────────────────────────────────
  const openGenerateModal = (withCalc: boolean) => {
    const initialStatus: Record<string, GenStatus> = {}
    allEmployeeNames.forEach(n => { initialStatus[n] = "idle" })
    setGenStatusMap(initialStatus)
    setBulkGenError({})
    setCalcPhase(withCalc ? "calculating" : "idle")
    setCalcError(null)
    setGenerateStarted(true)
    setShowGenerateModal(true)
  }

  // ── Generate button click ──────────────────────────────────────────────────
  const handleGenerateClick = () => {
    if (allEmployeeNames.length === 0) return
    if (checkAllZeroSalary()) {
      setShowZeroSalaryWarning(true)
    } else {
      openGenerateModal(false)
    }
  }

  // ── Zero-salary dialog actions ─────────────────────────────────────────────
  const handleCalculateAndGenerate = () => {
    setShowZeroSalaryWarning(false)
    openGenerateModal(true)
  }

  const handleGenerateAnyway = () => {
    setShowZeroSalaryWarning(false)
    openGenerateModal(false)
  }

  // ── Per-row single generate ────────────────────────────────────────────────
  const handleGenerateOne = async (employeeName: string) => {
    // Clear any previous error for this employee
    setSingleGenError(prev => { const next = { ...prev }; delete next[employeeName]; return next })
    setSingleGenStatus(prev => ({ ...prev, [employeeName]: "generating" }))

    try {
      const res = await fetch(buildGenerateUrl(employeeName), {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Generate failed (${res.status})`)

      const blob = await res.blob()
      downloadBlob(blob, `${employeeName}_${selectedType}_${getDateParam()}.pdf`)

      setApiEmployees(prev =>
        prev.map(e => e.employeeName === employeeName ? { ...e, paySlipGenerated: true } : e))
      setSingleGenStatus(prev => ({ ...prev, [employeeName]: "done" }))

      // Reset back to Generate button after 5 seconds
      setTimeout(() => {
        setSingleGenStatus(prev => ({ ...prev, [employeeName]: "idle" }))
      }, 5000)
    } catch (err) {
      console.error("[payslip] single generate error:", err)
      setSingleGenStatus(prev => ({ ...prev, [employeeName]: "failed" }))
      setSingleGenError(prev => ({ ...prev, [employeeName]: NO_SALARY_MESSAGE }))
      // Open the error modal window
      setErrorModalEmployee(employeeName)
      setErrorModalOpen(true)
    }
  }

  // ── Retry single failed employee (bulk modal) ──────────────────────────────
  const handleRetry = async (name: string) => {
    setBulkGenError(prev => { const next = { ...prev }; delete next[name]; return next })
    setGenStatusMap(prev => ({ ...prev, [name]: "generating" }))
    try {
      const res = await fetch(buildGenerateUrl(name), {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Generate failed (${res.status})`)

      const blob = await res.blob()
      downloadBlob(blob, `${name}_${selectedType}_${getDateParam()}.pdf`)

      setApiEmployees(prev =>
        prev.map(e => e.employeeName === name ? { ...e, paySlipGenerated: true } : e))
      setGenStatusMap(prev => ({ ...prev, [name]: "done" }))
    } catch {
      setGenStatusMap(prev => ({ ...prev, [name]: "failed" }))
      setBulkGenError(prev => ({ ...prev, [name]: NO_SALARY_MESSAGE }))
    }
  }

  // ── Progress counts ────────────────────────────────────────────────────────
  const doneCount    = Object.values(genStatusMap).filter(s => s === "done").length
  const failedCount  = Object.values(genStatusMap).filter(s => s === "failed").length
  const totalCount   = allEmployeeNames.length
  const isAllSettled = (doneCount + failedCount === totalCount && totalCount > 0) &&
                       calcPhase !== "calculating"

  const handleClearFilters = () => {
    setSelectedEmployee(""); setSelectedType("monthly")
    setSelectedStatus(""); setSearchQuery(""); setSelectedDate(new Date())
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  const handlePreview = async (employeeName: string) => {
    setPreviewName(employeeName)
    setPreviewOpen(true)
    setIsLoadingPreview(true)
    setPreviewError(false)
    setPdfPages([])
    setCurrentPage(1)

    try {
      const res = await fetch(buildPreviewUrl(employeeName), {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Preview failed (${res.status})`)

      const arrayBuffer = await res.arrayBuffer()

      const PDFJS_CDN    = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
      const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

      if (!(window as any).pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = PDFJS_CDN
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Failed to load PDF.js"))
          document.head.appendChild(script)
        })
      }

      const pdfjsLib = (window as any).pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const pages: string[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement("canvas")
        canvas.width  = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport }).promise
        pages.push(canvas.toDataURL("image/png"))
      }

      setPdfPages(pages)
   } catch (err) {
  console.error("[payslip] preview error:", err)
  setPreviewOpen(false)          // close the PDF viewer
  setPdfPages([])
  setPreviewErrorModalEmployee(employeeName)
  setPreviewErrorModalOpen(true) // open the dedicated error modal
} finally {
  setIsLoadingPreview(false)
}
  }

  // ── Calc phase label helpers ───────────────────────────────────────────────
  const calcTypeLabel = selectedType === "daily" ? "daily" : selectedType === "weekly" ? "weekly" : "monthly"

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">

      <div>
        <h1 className="text-3xl font-bold text-foreground">Generate Payslips</h1>
        <p className="text-muted-foreground mt-2">Filter and generate payslips for your employees</p>
      </div>

      {/* ── FILTER CARD ──────────────────────────────────────────────────── */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">

            {/* ① Employee */}
            <div className="space-y-1 min-w-0">
              <label className="text-sm font-medium text-foreground">Employee</label>
              <Select value={selectedEmployee || "all"}
                onValueChange={v => setSelectedEmployee(v === "all" ? "" : v)}
                disabled={isLoadingEmployees}>
                <SelectTrigger className="h-10 w-full rounded-lg text-sm">
                  <SelectValue placeholder={isLoadingEmployees ? "Loading…" : "All Employees"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees ({apiEmployees.length})</SelectItem>
                  {apiEmployees.map(emp => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      {emp.employeeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ② Type */}
            <div className="space-y-1 min-w-0">
              <label className="text-sm font-medium text-foreground">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10 w-full rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ③ Date / Week / Month */}
            <div className="space-y-1 min-w-0">
              <label className="text-sm font-medium text-foreground">
                {selectedType === "daily" ? "Date" : selectedType === "weekly" ? "Week" : "Month"}
              </label>
              {selectedType === "daily" && (
                <Popover open={isDailyCalendarOpen} onOpenChange={setIsDailyCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 w-full rounded-lg text-sm justify-start font-normal overflow-hidden">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{dateBtnLabel}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <MultiViewCalendar selected={selectedDate}
                      onSelect={(d: Date) => { setSelectedDate(d); setIsDailyCalendarOpen(false) }} />
                  </PopoverContent>
                </Popover>
              )}
              {selectedType === "weekly" && (
                <Popover open={isWeeklyCalendarOpen} onOpenChange={setIsWeeklyCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 w-full rounded-lg text-sm justify-start font-normal overflow-hidden">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{dateBtnLabel}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <MultiViewCalendar selected={selectedDate}
                      onSelect={(d: Date) => { setSelectedDate(d); setIsWeeklyCalendarOpen(false) }} />
                  </PopoverContent>
                </Popover>
              )}
              {selectedType === "monthly" && (
                <Popover open={isMonthlyCalendarOpen} onOpenChange={setIsMonthlyCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 w-full rounded-lg text-sm justify-start font-normal overflow-hidden">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{dateBtnLabel}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <MonthYearCalendar selected={selectedDate}
                      onSelect={(d: Date) => { setSelectedDate(d); setIsMonthlyCalendarOpen(false) }} />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* ④ Status */}
            <div className="space-y-1 min-w-0">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={selectedStatus || "all"}
                onValueChange={v => setSelectedStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="h-10 w-full rounded-lg text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ⑤ Search */}
            <div className="space-y-1 min-w-0">
              <label className="text-sm font-medium text-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search employee…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg pl-9 text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={handleClearFilters} className="rounded-lg h-10 text-sm">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── RESULTS ────────────────────────────────────────────────────────── */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Payslip Results ({filteredPayslips.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoadingEmployees ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Loading employees…</div>
          ) : filteredPayslips.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No payslips found for the selected date and type
            </div>
          ) : (
            <>
              {/* ── DESKTOP TABLE ── */}
              <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="font-semibold text-foreground h-10">Employee</TableHead>
                      <TableHead className="font-semibold text-foreground h-10">Role</TableHead>
                      <TableHead className="font-semibold text-foreground h-10">Type</TableHead>
                      <TableHead className="font-semibold text-foreground h-10 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-foreground h-10">Status</TableHead>
                      <TableHead className="font-semibold text-foreground h-10 text-center w-16">Preview</TableHead>
                      <TableHead className="font-semibold text-foreground h-10 text-center w-28">Generate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.map((p, i) => (
                      <TableRow key={p.employeeId ?? i} className="border-b border-border hover:bg-muted/50">
                        <TableCell className="py-3">
                          <div className="font-medium text-foreground">{p.employeeName}</div>
                          <div className="text-xs text-muted-foreground">{p.employeeId}</div>
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground text-sm">{p.role ?? "—"}</TableCell>
                        <TableCell className="py-3 text-sm">
                          <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium">
                            {p.salaryFrequency ?? selectedType.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-foreground font-semibold text-right">
                          ₹{Number(p.totalAmount ?? 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="py-3">
                          <PayslipStatusBadge status={p.paySlipGenerated ? "generated" : "pending"} />
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Button variant="ghost" size="sm"
                            onClick={() => handlePreview(p.employeeName)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                            title="Preview payslip">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          {(() => {
                            const st = singleGenStatus[p.employeeName]
                            if (st === "generating") {
                              return (
                                <Button size="sm" disabled className="h-8 rounded-lg text-xs px-3 gap-1.5">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Generating…
                                </Button>
                              )
                            }
                            if (st === "done") {
                              return (
                                <Button size="sm" variant="outline" disabled
                                  className="h-8 rounded-lg text-xs px-3 gap-1.5 text-green-700 border-green-300 bg-green-50 cursor-default">
                                  <CheckCircle2 className="h-3 w-3" /> Done
                                </Button>
                              )
                            }
                            if (st === "failed") {
                              return (
                                <Button size="sm"
                                  onClick={() => {
                                    setErrorModalEmployee(p.employeeName)
                                    setErrorModalOpen(true)
                                  }}
                                  className="h-8 rounded-lg text-xs px-3 gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                                  <AlertTriangle className="h-3 w-3" /> Failed
                                </Button>
                              )
                            }
                            // idle — default Generate button
                            return (
                              <Button size="sm"
                                onClick={() => handleGenerateOne(p.employeeName)}
                                className="h-8 rounded-lg text-xs px-3 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                                Generate
                              </Button>
                            )
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── MOBILE CARDS ── */}
              <div className="sm:hidden divide-y divide-border">
                {filteredPayslips.map((p, i) => (
                  <div key={p.employeeId ?? i} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm truncate">{p.employeeName}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">{p.role ?? "—"}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                          {p.salaryFrequency ?? selectedType.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-bold text-foreground">
                        ₹{Number(p.totalAmount ?? 0).toLocaleString("en-IN")}
                      </span>
                      <PayslipStatusBadge status={p.paySlipGenerated ? "generated" : "pending"} />
                    </div>
                    <Button variant="ghost" size="sm"
                      onClick={() => handlePreview(p.employeeName)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 shrink-0"
                      title="Preview payslip">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(() => {
                      const st = singleGenStatus[p.employeeName]
                      if (st === "generating") {
                        return (
                          <Button size="sm" disabled className="h-8 rounded-lg text-xs px-2.5 gap-1 shrink-0">
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </Button>
                        )
                      }
                      if (st === "done") {
                        return (
                          <Button size="sm" variant="outline" disabled
                            className="h-8 rounded-lg text-xs px-2.5 gap-1 text-green-700 border-green-300 bg-green-50 shrink-0 cursor-default">
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        )
                      }
                      if (st === "failed") {
                        return (
                          <Button size="sm"
                            onClick={() => {
                              setErrorModalEmployee(p.employeeName)
                              setErrorModalOpen(true)
                            }}
                            className="h-8 rounded-lg text-xs px-2.5 gap-1 bg-red-600 hover:bg-red-700 text-white shrink-0">
                            <AlertTriangle className="h-3 w-3" />
                          </Button>
                        )
                      }
                      return (
                        <Button size="sm"
                          onClick={() => handleGenerateOne(p.employeeName)}
                          className="h-8 rounded-lg text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                          Gen
                        </Button>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── SUMMARY ── */}
          {filteredPayslips.length > 0 && (
            <div className="mt-4 pt-4 mx-4 sm:mx-0 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex sm:flex-col items-center sm:justify-center justify-between px-1">
                <p className="text-xs text-muted-foreground sm:mb-1 sm:text-center">Total Employees</p>
                <p className="text-base sm:text-2xl font-bold text-foreground sm:text-center">{filteredPayslips.length}</p>
              </div>
              <div className="flex sm:flex-col items-center sm:justify-center justify-between px-1">
                <p className="text-xs text-muted-foreground sm:mb-1 sm:text-center">Total Amount</p>
                <p className="text-base sm:text-2xl font-bold text-foreground sm:text-center truncate">
                  ₹{filteredPayslips.reduce((s, p) => s + Number(p.totalAmount ?? 0), 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex sm:flex-col items-center sm:justify-center justify-between px-1">
                <p className="text-xs text-muted-foreground sm:mb-1 sm:text-center">Average</p>
                <p className="text-base sm:text-2xl font-bold text-foreground sm:text-center truncate">
                  ₹{Math.round(filteredPayslips.reduce((s, p) => s + Number(p.totalAmount ?? 0), 0) / filteredPayslips.length).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════
          NO SALARY ERROR MODAL
          Shown when a single-employee generate fails due to missing salary.
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              {/* Amber warning icon in a soft circle */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </span>
              Salary Not Found
            </DialogTitle>
          </DialogHeader>

          {/* Employee context */}
          {errorModalEmployee && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-muted/60 border border-border">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold select-none">
                {errorModalEmployee.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{errorModalEmployee}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {selectedType} · {dateBtnLabel}
                </p>
              </div>
            </div>
          )}

          {/* Main message */}
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              {singleGenError[errorModalEmployee] ?? NO_SALARY_MESSAGE}
            </p>
          </div>

          {/* Step guide */}
          <ol className="space-y-2 text-sm text-muted-foreground pl-1">
            {[
              "Go to the Salary tab in the sidebar",
              `Select the ${selectedType} salary type and the same period`,
              "Click to calculate",
              "Return here and click Generate again",
            ].map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-[11px] font-semibold text-foreground mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => {
                setErrorModalOpen(false)
                // Reset the failed status so the Generate button reappears
                setSingleGenStatus(prev => {
                  const next = { ...prev }
                  delete next[errorModalEmployee]
                  return next
                })
                setSingleGenError(prev => {
                  const next = { ...prev }
                  delete next[errorModalEmployee]
                  return next
                })
              }}
                className="rounded-lg h-10 flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Dismiss
            </Button>
            
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PDF PREVIEW MODAL ─────────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={(open) => { setPreviewOpen(open); if (!open) setPdfPages([]) }}>
        <DialogContent className="max-w-2xl w-full h-[92vh] flex flex-col p-0 gap-0 overflow-hidden [&>button:last-child]:hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 bg-white">
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">
                Payslip Preview — {previewName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} · {dateBtnLabel}
              </p>
            </div>
            {pdfPages.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30">‹</button>
                <span className="tabular-nums">{currentPage} / {pdfPages.length}</span>
                <button onClick={() => setCurrentPage(p => Math.min(pdfPages.length, p + 1))} disabled={currentPage === pdfPages.length}
                  className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30">›</button>
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg ml-2"
              onClick={() => { setPreviewOpen(false); setPdfPages([]) }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-[#525659] flex flex-col items-center py-4">
            {isLoadingPreview && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-white">
                <div className="h-9 w-9 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <p className="text-sm opacity-80">Rendering payslip…</p>
              </div>
            )}
            {!isLoadingPreview && previewError && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="text-white font-medium">Failed to load preview</p>
                <p className="text-white/60 text-sm text-center max-w-xs">No salary data found for this employee and period</p>
                <Button variant="outline" size="sm" className="mt-1 rounded-lg bg-white/10 text-white border-white/20 hover:bg-white/20"
                  onClick={() => handlePreview(previewName)}>Retry</Button>
              </div>
            )}
            {!isLoadingPreview && pdfPages.length > 0 && pdfPages.map((src, idx) => (
              <div key={idx} className={`w-full px-4 transition-opacity duration-200 ${idx + 1 === currentPage ? "opacity-100" : "hidden"}`}>
                <img src={src} alt={`Page ${idx + 1}`} draggable={false} onContextMenu={e => e.preventDefault()}
                  className="w-full block select-none rounded shadow-xl"
                  style={{ userSelect: "none", WebkitUserSelect: "none" }} />
              </div>
            ))}
          </div>

          {pdfPages.length > 1 && (
            <div className="shrink-0 flex items-center justify-center gap-2 py-3 border-t border-border bg-white">
              {pdfPages.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentPage(idx + 1)}
                  className={`h-2 rounded-full transition-all ${idx + 1 === currentPage ? "w-6 bg-blue-600" : "w-2 bg-gray-300 hover:bg-gray-400"}`} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
{/* ════════════════════════════════════════════════════════════════════
    PREVIEW — NO SALARY ERROR MODAL
════════════════════════════════════════════════════════════════════ */}
<Dialog open={previewErrorModalOpen} onOpenChange={setPreviewErrorModalOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </span>
        Salary Not Found
      </DialogTitle>
    </DialogHeader>

    {/* Employee context */}
    {previewErrorModalEmployee && (
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-muted/60 border border-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold select-none">
          {previewErrorModalEmployee.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{previewErrorModalEmployee}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {selectedType} · {dateBtnLabel}
          </p>
        </div>
      </div>
    )}

    {/* Main message */}
    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
        {NO_SALARY_MESSAGE}
      </p>
    </div>

    {/* Step guide */}
    <ol className="space-y-2 text-sm text-muted-foreground pl-1">
      {[
        "Go to the Salary tab in the sidebar",
        `Select the ${selectedType} salary type and the same period`,
        "Click to calculate",
        "Return here and click Preview again",
      ].map((step, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-[11px] font-semibold text-foreground mt-0.5">
            {idx + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>

    <DialogFooter className="gap-2 sm:gap-2 pt-1">
      <Button
        onClick={() => setPreviewErrorModalOpen(false)}
        className="rounded-lg h-10 flex-1 bg-blue-600 hover:bg-blue-700"
      >
        Dismiss
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      {/* ── ZERO SALARY WARNING ───────────────────────────────────────────── */}
      <Dialog open={showZeroSalaryWarning} onOpenChange={setShowZeroSalaryWarning}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              Salary Not Calculated
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">
              Salary has not been calculated for any employee. Do you want to calculate the{" "}
              <span className="font-semibold text-foreground capitalize">{calcTypeLabel}</span>{" "}
              salary first and then generate payslips?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button variant="outline" onClick={handleGenerateAnyway} className="rounded-lg h-10 flex-1">
              No, Generate Anyway
            </Button>
            <Button onClick={handleCalculateAndGenerate} className="rounded-lg h-10 flex-1 bg-blue-600 hover:bg-blue-700">
              Yes, Calculate First
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── BULK GENERATE PROGRESS MODAL ─────────────────────────────────── */}
      <Dialog
        open={showGenerateModal}
        onOpenChange={(open) => {
          if (!open && (
            calcPhase === "calculating" ||
            Object.values(genStatusMap).some(s => s === "generating")
          )) return
          setShowGenerateModal(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {calcPhase === "calculating" ? (
                <Loader2 className="h-5 w-5 text-blue-600 shrink-0 animate-spin" />
              ) : calcPhase === "failed" ? (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              ) : isAllSettled ? (
                failedCount === 0
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-600 shrink-0 animate-spin" />
              )}

              {calcPhase === "calculating"
                ? `Calculating ${calcTypeLabel} salary…`
                : calcPhase === "failed"
                  ? "Calculation Failed"
                  : isAllSettled
                    ? "Generation Complete"
                    : "Generating Payslips…"}
            </DialogTitle>

            <DialogDescription>
              {calcPhase === "calculating" && (
                <>
                  Calculating <span className="font-semibold capitalize">{calcTypeLabel}</span> salary for all employees.
                  PDF generation will start automatically once done.
                </>
              )}
              {calcPhase === "failed" && (
                <span className="text-red-600">{calcError ?? "Salary calculation failed. Please try again."}</span>
              )}
              {(calcPhase === "done" || calcPhase === "idle") ? (
                isAllSettled
                  ? `${doneCount} of ${totalCount} payslip(s) generated successfully${failedCount > 0 ? ` · ${failedCount} failed` : ""}.`
                  : `Processing ${totalCount} employee(s) — please wait.`
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {calcPhase === "calculating" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <div className="text-sm">
                <span className="font-semibold capitalize">{calcTypeLabel}</span> salary calculation in progress…
              </div>
            </div>
          )}

          {calcPhase === "failed" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Calculation failed:</span>{" "}
                {calcError ?? "Unknown error"}
              </div>
            </div>
          )}

          {calcPhase === "done" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div className="text-sm font-medium capitalize">
                {calcTypeLabel} salary calculated — generating PDFs…
              </div>
            </div>
          )}

          {totalCount > 0 && calcPhase !== "calculating" && calcPhase !== "failed" && (
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden my-1">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${((doneCount + failedCount) / totalCount) * 100}%` }}
              />
            </div>
          )}

          {calcPhase !== "failed" && (
            <div className="space-y-2 max-h-72 overflow-y-auto py-2">
              {allEmployeeNames.map((name, idx) => {
                const status = genStatusMap[name] ?? "idle"
                const isWaiting = calcPhase === "calculating"
                const errMsg = bulkGenError[name]
                return (
                  <div
                    key={`${name}-${idx}`}
                    className={`rounded-lg border transition-colors ${
                      isWaiting
                        ? "border-border bg-muted/30 opacity-50"
                        : status === "done"
                          ? "border-green-200 bg-green-50 dark:bg-green-950/30"
                          : status === "failed"
                            ? "border-red-200 bg-red-50 dark:bg-red-950/30"
                            : status === "generating"
                              ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                              : "border-border bg-muted/30"
                    }`}
                  >
                    {/* ── Top row: icon + name + badge ── */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isWaiting
                          ? <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 shrink-0" />
                          : status === "done"
                            ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            : status === "failed"
                              ? <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                              : status === "generating"
                                ? <Loader2 className="h-4 w-4 text-blue-600 shrink-0 animate-spin" />
                                : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        }
                        <span className={`text-sm font-medium truncate ${
                          isWaiting
                            ? "text-muted-foreground"
                            : status === "done"
                              ? "text-green-700 dark:text-green-400"
                              : status === "failed"
                                ? "text-red-600 dark:text-red-400"
                                : status === "generating"
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-foreground"
                        }`}>
                          {name}
                        </span>
                      </div>

                      <div className="ml-3 shrink-0">
                        {isWaiting && <span className="text-xs text-muted-foreground">Pending calc</span>}
                        {!isWaiting && status === "done" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Downloaded</span>
                        )}
                        {!isWaiting && status === "generating" && (
                          <span className="text-xs text-blue-600 font-medium">Generating…</span>
                        )}
                        {!isWaiting && status === "idle" && (
                          <span className="text-xs text-muted-foreground">Waiting</span>
                        )}
                        {!isWaiting && status === "failed" && !errMsg && (
                          <Button
                            size="sm"
                            onClick={() => handleRetry(name)}
                            className="h-7 text-xs rounded-lg bg-red-600 hover:bg-red-700 px-3"
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* ── Error message row (no-salary) ── */}
                    {!isWaiting && status === "failed" && errMsg && (
                      <div className="px-3 pb-3 flex flex-col gap-2">
                        <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-3 py-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            {errMsg}
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleRetry(name)}
                            className="h-7 text-xs rounded-lg bg-red-600 hover:bg-red-700 px-3"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            {calcPhase === "failed" ? (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => setShowGenerateModal(false)} className="rounded-lg h-10 flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setCalcPhase("calculating")
                    setGenerateStarted(true)
                  }}
                  className="rounded-lg h-10 flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Retry Calculation
                </Button>
              </div>
            ) : (
              <Button
                variant={isAllSettled ? "default" : "outline"}
                disabled={
                  calcPhase === "calculating" ||
                  (!isAllSettled && Object.values(genStatusMap).some(s => s === "generating"))
                }
                onClick={() => setShowGenerateModal(false)}
                className="rounded-lg h-10 w-full"
              >
                {isAllSettled ? "Done" : "Close"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}