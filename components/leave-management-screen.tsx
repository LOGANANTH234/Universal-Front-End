"use client"
import { API_BASE_URL } from "@/lib/branding-config"

import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import { apiGet } from "@/lib/api-client"
import {
  Palmtree,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Info,
  Loader2,
  CalendarOff,
  TrendingUp,
  ShieldCheck,
  Ban,
  Check,
  X,
  FileText,
  DollarSign,
  AlertTriangle,
  Sliders,
  Trash2,
  Edit,
  Tag,
  Palette,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface LeaveType {
  id: number
  code: string
  name: string
  daysPerYear: number
  paid: boolean
  colorCode: string
  description: string
}

interface LeaveRequest {
  id: number
  employeeId: string
  employeeCode: string
  employeeName: string
  employeePhone?: string
  employeeImageUrl?: string
  leaveTypeId: number
  leaveTypeCode: string
  leaveTypeName: string
  paid: boolean
  colorCode: string
  startDate: string
  endDate: string
  totalDays: number
  dayType: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF"
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  appliedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewRemarks?: string
}

interface LeaveBalance {
  leaveTypeCode: string
  leaveTypeName: string
  colorCode: string
  paid: boolean
  year: number
  totalAllocated: number
  usedDays: number
  pendingDays: number
  remainingDays: number
}

interface LeaveStats {
  totalOnLeaveToday: number
  pendingApprovals: number
  approvedThisMonth: number
  totalLeavesYear: number
}

interface EmployeeOption {
  employeeId: string
  employeeName: string
}

export function LeaveManagementScreen() {
  const { auth } = useAuth()
  const token = auth?.token

  // Role permissions
  const canApply = useHasAction(MODULES.LEAVE_MANAGEMENT, ACTIONS.LEAVE_APPLY)
  const canApprove = useHasAction(MODULES.LEAVE_MANAGEMENT, ACTIONS.LEAVE_APPROVE)
  const canCancel = useHasAction(MODULES.LEAVE_MANAGEMENT, ACTIONS.LEAVE_CANCEL)
  const canManagePolicy = useHasAction(MODULES.LEAVE_MANAGEMENT, ACTIONS.LEAVE_POLICY_EDIT)

  // Active view tab
  const [activeTab, setActiveTab] = useState<"requests" | "balances" | "calendar" | "types">("requests")

  // State
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [stats, setStats] = useState<LeaveStats>({
    totalOnLeaveToday: 0,
    pendingApprovals: 0,
    approvedThisMonth: 0,
    totalLeavesYear: 0,
  })
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  // Filters
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number | "ALL">(currentMonth)
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Apply Modal state
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [applyEmployeeId, setApplyEmployeeId] = useState("")
  const [applyLeaveType, setApplyLeaveType] = useState("CASUAL_LEAVE")
  const [applyStartDate, setApplyStartDate] = useState(new Date().toISOString().split("T")[0])
  const [applyEndDate, setApplyEndDate] = useState(new Date().toISOString().split("T")[0])
  const [applyDayType, setApplyDayType] = useState<"FULL_DAY" | "FIRST_HALF" | "SECOND_HALF">("FULL_DAY")
  const [applyReason, setApplyReason] = useState("")
  const [applyBalances, setApplyBalances] = useState<LeaveBalance[]>([])

  // Review Modal state (Approve / Reject)
  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    request: LeaveRequest | null
    action: "approve" | "reject"
    remarks: string
  }>({
    open: false,
    request: null,
    action: "approve",
    remarks: "",
  })

  // Cancel Modal state
  const [cancelModal, setCancelModal] = useState<{
    open: boolean
    request: LeaveRequest | null
  }>({
    open: false,
    request: null,
  })

  // Leave Type Create / Edit modal state
  const [typeModal, setTypeModal] = useState<{
    open: boolean
    mode: "create" | "edit"
    id?: number
    code: string
    name: string
    daysPerYear: number
    paid: boolean
    colorCode: string
    description: string
  }>({
    open: false,
    mode: "create",
    code: "",
    name: "",
    daysPerYear: 12,
    paid: true,
    colorCode: "#3B82F6",
    description: "",
  })

  // Delete Leave Type confirmation modal
  const [deleteTypeModal, setDeleteTypeModal] = useState<{
    open: boolean
    type: LeaveType | null
  }>({
    open: false,
    type: null,
  })

  // Delete All Leave Types confirmation modal
  const [deleteAllModal, setDeleteAllModal] = useState(false)

  // Balances Tab: selected employee
  const [balanceEmployeeId, setBalanceEmployeeId] = useState<string>("")
  const [selectedEmployeeBalances, setSelectedEmployeeBalances] = useState<LeaveBalance[]>([])
  const [loadingBalances, setLoadingBalances] = useState(false)

  const getApiBase = () => process.env.NEXT_PUBLIC_BACKEND_URL || API_BASE_URL

  // Fetch initial types, employees, and stats
  useEffect(() => {
    async function loadInitialData() {
      if (!token) return
      try {
        const baseUrl = getApiBase()
        const [typesRes, empRes] = await Promise.all([
          fetch(`${baseUrl}/api/leaves/types`, { headers: { Authorization: `Bearer ${token}` } }),
          apiGet<EmployeeOption[]>("/api/employees/picklist").catch(() => []),
        ])

        if (typesRes.ok) {
          const typesData = await typesRes.json()
          setLeaveTypes(typesData)
          if (typesData.length > 0) {
            setApplyLeaveType(typesData[0].code)
          }
        }

        if (Array.isArray(empRes)) {
          const filtered = empRes.filter((e) => e.employeeId !== "SELF")
          setEmployees(filtered)
          if (filtered.length > 0) {
            setApplyEmployeeId(filtered[0].employeeId)
            setBalanceEmployeeId(filtered[0].employeeId)
          }
        }
      } catch (err) {
        console.error("Failed to load initial leave data", err)
      }
    }
    loadInitialData()
  }, [token])

  // Fetch leave requests & stats whenever filters change
  const fetchLeaves = async () => {
    if (!token) return
    setLoading(true)
    try {
      const baseUrl = getApiBase()
      const monthParam = selectedMonth === "ALL" ? "" : `&month=${selectedMonth}`
      const statusParam = selectedStatus === "ALL" ? "" : `&status=${selectedStatus}`
      const url = `${baseUrl}/api/leaves?year=${selectedYear}${monthParam}${statusParam}`

      const [reqRes, statsRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseUrl}/api/leaves/stats?year=${selectedYear}&month=${selectedMonth === "ALL" ? currentMonth : selectedMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (reqRes.ok) {
        const data = await reqRes.json()
        setRequests(data)
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (err) {
      console.error("Error fetching leave requests:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaves()
  }, [token, selectedYear, selectedMonth, selectedStatus])

  // Fetch employee balances when balance tab or selected employee changes
  useEffect(() => {
    async function loadBalances() {
      if (!token || !balanceEmployeeId) return
      setLoadingBalances(true)
      try {
        const baseUrl = getApiBase()
        const res = await fetch(`${baseUrl}/api/leaves/balances/${balanceEmployeeId}?year=${selectedYear}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setSelectedEmployeeBalances(data)
        }
      } catch (err) {
        console.error("Error loading employee balances:", err)
      } finally {
        setLoadingBalances(false)
      }
    }
    if (activeTab === "balances" && balanceEmployeeId) {
      loadBalances()
    }
  }, [token, activeTab, balanceEmployeeId, selectedYear])

  // Fetch applicant balances when apply modal is opened
  useEffect(() => {
    async function loadApplicantBalances() {
      if (!token || !applyEmployeeId) return
      try {
        const baseUrl = getApiBase()
        const res = await fetch(`${baseUrl}/api/leaves/balances/${applyEmployeeId}?year=${selectedYear}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setApplyBalances(data)
        }
      } catch (err) {
        console.error("Error loading applicant balances:", err)
      }
    }
    if (isApplyOpen && applyEmployeeId) {
      loadApplicantBalances()
    }
  }, [token, isApplyOpen, applyEmployeeId, selectedYear])

  // Calculate live total days for apply modal
  const calculatedDays = useMemo(() => {
    if (applyDayType === "FIRST_HALF" || applyDayType === "SECOND_HALF") {
      return 0.5
    }
    if (!applyStartDate || !applyEndDate) return 1
    const start = new Date(applyStartDate)
    const end = new Date(applyEndDate)
    if (end < start) return 0
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }, [applyStartDate, applyEndDate, applyDayType])

  // Handle Apply Leave Submit
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !canApply) return
    setSubmitting(true)
    setNotice(null)

    try {
      const baseUrl = getApiBase()
      const res = await fetch(`${baseUrl}/api/leaves/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: applyEmployeeId,
          leaveTypeCode: applyLeaveType,
          startDate: applyStartDate,
          endDate: applyDayType === "FULL_DAY" ? applyEndDate : applyStartDate,
          dayType: applyDayType,
          reason: applyReason,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.message || `Failed to submit leave request (Status ${res.status})`)
      }

      setNotice({
        type: "success",
        text: `Leave request successfully submitted (${calculatedDays} day(s)). Awaiting supervisor review.`,
      })
      setIsApplyOpen(false)
      setApplyReason("")
      fetchLeaves()
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to submit leave request." })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Approve / Reject
  const handleReviewAction = async () => {
    if (!token || !reviewModal.request) return
    setSubmitting(true)
    try {
      const baseUrl = getApiBase()
      const endpoint = reviewModal.action === "approve" ? "approve" : "reject"
      const res = await fetch(`${baseUrl}/api/leaves/${reviewModal.request.id}/${endpoint}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remarks: reviewModal.remarks }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.message || `Failed to ${reviewModal.action} leave request`)
      }

      setNotice({
        type: "success",
        text: `Leave request #${reviewModal.request.id} successfully ${reviewModal.action === "approve" ? "approved" : "rejected"}.`,
      })
      setReviewModal({ open: false, request: null, action: "approve", remarks: "" })
      fetchLeaves()
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || `Failed to process review` })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Cancel Leave with styled modal
  const confirmCancelLeave = async () => {
    if (!token || !cancelModal.request) return
    setSubmitting(true)
    try {
      const baseUrl = getApiBase()
      const res = await fetch(`${baseUrl}/api/leaves/${cancelModal.request.id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error("Failed to cancel leave request")
      }
      setNotice({ type: "info", text: `Leave request #${cancelModal.request.id} has been cancelled.` })
      setCancelModal({ open: false, request: null })
      fetchLeaves()
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to cancel leave request" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Save Leave Type (Create or Update)
  const handleSaveLeaveType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSubmitting(true)
    setNotice(null)
    try {
      const baseUrl = getApiBase()
      const url =
        typeModal.mode === "create"
          ? `${baseUrl}/api/leaves/types`
          : `${baseUrl}/api/leaves/types/${typeModal.id}`
      const method = typeModal.mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: typeModal.code,
          name: typeModal.name,
          daysPerYear: Number(typeModal.daysPerYear),
          paid: typeModal.paid,
          colorCode: typeModal.colorCode,
          description: typeModal.description,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.message || `Failed to ${typeModal.mode} leave type`)
      }

      setNotice({
        type: "success",
        text: `Leave type '${typeModal.name}' successfully ${typeModal.mode === "create" ? "created" : "updated"}!`,
      })
      setTypeModal((prev) => ({ ...prev, open: false }))
      // Re-fetch types
      const typesRes = await fetch(`${baseUrl}/api/leaves/types`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (typesRes.ok) {
        setLeaveTypes(await typesRes.json())
      }
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to save leave type" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Leave Type
  const confirmDeleteLeaveType = async () => {
    if (!token || !deleteTypeModal.type) return
    setSubmitting(true)
    try {
      const baseUrl = getApiBase()
      const res = await fetch(`${baseUrl}/api/leaves/types/${deleteTypeModal.type.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error("Failed to delete leave type")
      }
      setNotice({ type: "info", text: `Leave type '${deleteTypeModal.type.name}' has been deleted.` })
      setDeleteTypeModal({ open: false, type: null })
      // Re-fetch types
      const typesRes = await fetch(`${baseUrl}/api/leaves/types`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (typesRes.ok) {
        setLeaveTypes(await typesRes.json())
      }
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to delete leave type" })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete all leave types handler
  const confirmDeleteAllLeaveTypes = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      const baseUrl = getApiBase()
      const res = await fetch(`${baseUrl}/api/leaves/types`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error("Failed to delete all leave types")
      }
      setNotice({ type: "info", text: "All leave types have been successfully deleted." })
      setDeleteAllModal(false)
      setLeaveTypes([])
      setApplyLeaveType("")
      setSelectedEmployeeBalances([])
      // Also refresh requests & stats since leaves might have been cleared
      fetchLeaves()
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to delete all leave types" })
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered requests by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests
    const query = searchQuery.toLowerCase()
    return requests.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(query) ||
        r.employeeCode.toLowerCase().includes(query) ||
        r.leaveTypeName.toLowerCase().includes(query) ||
        (r.reason && r.reason.toLowerCase().includes(query))
    )
  }, [requests, searchQuery])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Palmtree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave & Time-Off</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Manage employee leave requests, approval workflows, quotas, and team availability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManagePolicy && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTypeModal({
                  open: true,
                  mode: "create",
                  code: "",
                  name: "",
                  daysPerYear: 12,
                  paid: true,
                  colorCode: "#3B82F6",
                  description: "",
                })
              }}
              className="gap-1.5 border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              New Leave Type
            </Button>
          )}

          {canApply && (
            <Button
              size="sm"
              onClick={() => setIsApplyOpen(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Apply Leave
            </Button>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-sm transition-all ${notice.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
              : notice.type === "error"
                ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200"
            }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : notice.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{notice.text}</div>
          <button onClick={() => setNotice(null)} className="text-xs opacity-60 hover:opacity-100 font-bold ml-1">
            ✕
          </button>
        </div>
      )}

      {/* Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: On Leave Today */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">On Leave Today</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOnLeaveToday}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Approved active leaves</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CalendarOff className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Pending Approvals */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Pending Approvals</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingApprovals}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              {stats.pendingApprovals > 0 ? "Requires manager review" : "Queue is clear"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Approved This Month */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Approved This Month</p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.approvedThisMonth}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Total requests honored</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Total Leaves This Year */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Annual Leaves Total</p>
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalLeavesYear}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">In year {selectedYear}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-800/80 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "requests"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Requests & Queue</span>
            {stats.pendingApprovals > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {stats.pendingApprovals}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("balances")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "balances"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Leave Balances</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "calendar"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Team Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("types")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "types"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Leave Types</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-[10px] font-bold">
              {leaveTypes.length}
            </span>
          </button>
        </div>

        {/* Global Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-700 dark:text-slate-200"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-700 dark:text-slate-200"
          >
            <option value="ALL">All Months</option>
            {[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ].map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          {activeTab === "requests" && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-700 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Requests & Queue */}
      {activeTab === "requests" && (
        <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
              <p className="text-xs">Loading leave requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-slate-500">
              <Palmtree className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No leave requests found</p>
              <p className="text-xs mt-0.5">Try changing the filters or apply for a new leave above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-slate-800/70 border-b border-gray-200 dark:border-slate-800 font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="px-5 py-3.5 border-r border-gray-200 dark:border-slate-800">Employee</th>
                    <th className="px-5 py-3.5 border-r border-gray-200 dark:border-slate-800">Leave Type</th>
                    <th className="px-5 py-3.5 border-r border-gray-200 dark:border-slate-800">Duration & Dates</th>
                    <th className="px-5 py-3.5 border-r border-gray-200 dark:border-slate-800">Reason</th>
                    <th className="px-5 py-3.5 border-r border-gray-200 dark:border-slate-800 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Employee Cell */}
                      <td className="px-5 py-4 whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                            {req.employeeName ? req.employeeName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{req.employeeName}</div>
                            <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                              ID: {req.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type Cell */}
                      <td className="px-5 py-4 whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: req.colorCode || "#10B981" }}
                          />
                          <span className="font-medium text-gray-900 dark:text-slate-200">{req.leaveTypeName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${req.paid
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                              }`}
                          >
                            {req.paid ? "Paid" : "LOP"}
                          </span>
                        </div>
                      </td>

                      {/* Dates & Duration Cell */}
                      <td className="px-5 py-4 whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                        <div className="font-medium text-gray-900 dark:text-slate-200">
                          {req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-gray-700 dark:text-slate-300">{req.totalDays} day(s)</span>
                          {req.dayType !== "FULL_DAY" && (
                            <span className="px-1 py-0.2 rounded bg-gray-100 dark:bg-slate-800 text-[10px] text-gray-600 dark:text-slate-400">
                              {req.dayType.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reason Cell */}
                      <td className="px-5 py-4 max-w-xs truncate border-r border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300">
                        <span title={req.reason}>{req.reason || "—"}</span>
                        {req.reviewRemarks && (
                          <div className="text-[11px] text-gray-400 dark:text-slate-500 italic mt-0.5">
                            Note: {req.reviewRemarks}
                          </div>
                        )}
                      </td>

                      {/* Status Cell */}
                      <td className="px-5 py-4 whitespace-nowrap text-center border-r border-gray-200 dark:border-slate-800">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${req.status === "APPROVED"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : req.status === "PENDING"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 animate-pulse"
                                : req.status === "REJECTED"
                                  ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                            }`}
                        >
                          {req.status === "APPROVED" && <Check className="w-3 h-3" />}
                          {req.status === "PENDING" && <Clock className="w-3 h-3" />}
                          {req.status === "REJECTED" && <X className="w-3 h-3" />}
                          {req.status === "CANCELLED" && <Ban className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </td>

                      {/* Actions Cell */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === "PENDING" && canApprove && (
                            <>
                              <button
                                type="button"
                                title="Approve Leave"
                                onClick={() =>
                                  setReviewModal({
                                    open: true,
                                    request: req,
                                    action: "approve",
                                    remarks: "Approved",
                                  })
                                }
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Reject Leave"
                                onClick={() =>
                                  setReviewModal({
                                    open: true,
                                    request: req,
                                    action: "reject",
                                    remarks: "Rejected",
                                  })
                                }
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {canCancel && (req.status === "PENDING" || req.status === "APPROVED") && (
                            <button
                              type="button"
                              title="Cancel Request"
                              onClick={() => setCancelModal({ open: true, request: req })}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Leave Balances Ledger */}
      {activeTab === "balances" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Select Employee:</span>
            <select
              value={balanceEmployeeId}
              onChange={(e) => setBalanceEmployeeId(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
            >
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          {loadingBalances ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
              <p className="text-xs">Loading employee quotas...</p>
            </div>
          ) : selectedEmployeeBalances.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-6">
              <ShieldCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200">No Leave Types or Balances Configured</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                There are currently no leave types configured in the system. Go to the "Leave Types" tab to create your custom company leave categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedEmployeeBalances.map((bal) => (
                <div
                  key={bal.leaveTypeCode}
                  className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bal.colorCode || "#10B981" }} />
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{bal.leaveTypeName}</h4>
                    </div>
                    <Badge variant={bal.paid ? "default" : "outline"} className="text-[10px]">
                      {bal.paid ? "Paid Quota" : "Unpaid"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Quota</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{bal.totalAllocated}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Used</span>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{bal.usedDays}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Pending</span>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">{bal.pendingDays}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Balance</span>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {bal.remainingDays}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Monthly Team Calendar View */}
      {activeTab === "calendar" && (
        <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Approved Leave Coverage ({selectedMonth === "ALL" ? "All Months" : `Month #${selectedMonth}`}, {selectedYear})
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {leaveTypes.map((t) => (
                <div key={t.code} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colorCode }} />
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {requests
              .filter((r) => r.status === "APPROVED")
              .map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: r.colorCode || "#10B981" }}
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{r.employeeName}</p>
                      <p className="text-[11px] text-gray-400">
                        {r.leaveTypeName} • {r.totalDays} day(s) ({r.startDate} to {r.endDate})
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-300">
                    Approved
                  </Badge>
                </div>
              ))}
            {requests.filter((r) => r.status === "APPROVED").length === 0 && (
              <p className="py-8 text-center text-xs text-gray-400">No approved leaves scheduled in this period.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Leave Types Management */}
      {activeTab === "types" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leave Types & Policies</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Define company leave types, annual allowances, paid/unpaid deduction rules, and badge colors
              </p>
            </div>
            {canManagePolicy && (
              <div className="flex items-center gap-2">
                {leaveTypes.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteAllModal(true)}
                    className="gap-1.5 border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete All Types
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    setTypeModal({
                      open: true,
                      mode: "create",
                      code: "",
                      name: "",
                      daysPerYear: 12,
                      paid: true,
                      colorCode: "#10B981",
                      description: "",
                    })
                  }
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Leave Type
                </Button>
              </div>
            )}
          </div>

          {leaveTypes.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-50/50 dark:bg-slate-900/50 p-8">
              <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Palmtree className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">No Leave Types Configured</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                All previous leave types have been cleared. As an administrator, click <strong>"+ Add Leave Type"</strong> above to create custom leave categories tailored for your company.
              </p>
              {canManagePolicy && (
                <Button
                  size="sm"
                  onClick={() =>
                    setTypeModal({
                      open: true,
                      mode: "create",
                      code: "",
                      name: "",
                      daysPerYear: 12,
                      paid: true,
                      colorCode: "#10B981",
                      description: "",
                    })
                  }
                  className="mt-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Leave Type
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveTypes.map((type) => (
                <div
                  key={type.id}
                  className="p-5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:border-gray-300 dark:hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 shrink-0"
                          style={{ backgroundColor: type.colorCode || "#10B981" }}
                        />
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">{type.name}</h4>
                          <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">{type.code}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${type.paid
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                      >
                        {type.paid ? "Paid Quota" : "Unpaid (LOP)"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-3 leading-relaxed">
                      {type.description || "No policy description provided."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-semibold">
                        Annual Quota
                      </span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                        {type.daysPerYear > 0 ? `${type.daysPerYear} days / year` : "Accrued / Flexible"}
                      </p>
                    </div>

                    {canManagePolicy && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Edit Leave Type"
                          onClick={() =>
                            setTypeModal({
                              open: true,
                              mode: "edit",
                              id: type.id,
                              code: type.code,
                              name: type.name,
                              daysPerYear: type.daysPerYear,
                              paid: type.paid,
                              colorCode: type.colorCode || "#10B981",
                              description: type.description || "",
                            })
                          }
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete Leave Type"
                          onClick={() => setDeleteTypeModal({ open: true, type })}
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <Palmtree className="w-5 h-5" />
                <span>Apply for Leave</span>
              </div>
              <button
                onClick={() => setIsApplyOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              {/* Employee Selection */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">Employee</label>
                <select
                  value={applyEmployeeId}
                  onChange={(e) => setApplyEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  required
                >
                  {employees.map((e) => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.employeeName} ({e.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">Leave Type</label>
                {leaveTypes.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
                    ⚠️ No leave types are currently configured. Please configure at least one leave type under the "Leave Types" tab before applying for leave.
                  </div>
                ) : (
                  <select
                    value={applyLeaveType}
                    onChange={(e) => setApplyLeaveType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name} ({t.paid ? `${t.daysPerYear} days/yr` : "Unpaid / LOP"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Day Type */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">Day Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setApplyDayType(type)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${applyDayType === type
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400"
                        }`}
                    >
                      {type.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">From Date</label>
                  <input
                    type="date"
                    value={applyStartDate}
                    onChange={(e) => {
                      setApplyStartDate(e.target.value)
                      if (applyDayType !== "FULL_DAY" || e.target.value > applyEndDate) {
                        setApplyEndDate(e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">To Date</label>
                  <input
                    type="date"
                    disabled={applyDayType !== "FULL_DAY"}
                    value={applyDayType === "FULL_DAY" ? applyEndDate : applyStartDate}
                    onChange={(e) => setApplyEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Live Duration and Balance Callout */}
              <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-1.5 font-bold text-gray-900 dark:text-white">{calculatedDays} day(s)</span>
                </div>
                {applyBalances.length > 0 && (
                  <div>
                    <span className="text-gray-500">Remaining Quota:</span>
                    <span className="ml-1.5 font-bold text-emerald-600">
                      {applyBalances.find((b) => b.leaveTypeCode === applyLeaveType)?.remainingDays ?? "—"} days
                    </span>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">Reason for Leave</label>
                <textarea
                  rows={2}
                  placeholder="Provide context for supervisor review..."
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsApplyOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || calculatedDays <= 0 || leaveTypes.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Dialog (Approve / Reject) */}
      {reviewModal.open && reviewModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {reviewModal.action === "approve" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Approve Leave Request</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>Reject Leave Request</span>
                </>
              )}
            </h3>

            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              You are about to {reviewModal.action} the leave request for{" "}
              <strong>{reviewModal.request.employeeName}</strong> for {reviewModal.request.totalDays} day(s) (
              {reviewModal.request.leaveTypeName}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Review Remarks
              </label>
              <textarea
                rows={2}
                value={reviewModal.remarks}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, remarks: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                placeholder={reviewModal.action === "approve" ? "Approved by supervisor" : "Reason for rejection..."}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewModal({ open: false, request: null, action: "approve", remarks: "" })}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submitting}
                onClick={handleReviewAction}
                className={
                  reviewModal.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirm ${reviewModal.action}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal.open && cancelModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Cancel Leave Request</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Restore balance and cancel time-off</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to cancel the leave request for{" "}
              <strong>{cancelModal.request.employeeName}</strong> ({cancelModal.request.totalDays} day(s) {cancelModal.request.leaveTypeName})? Any deducted days will be immediately restored to the employee's balance.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setCancelModal({ open: false, request: null })}
              >
                Keep Request
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submitting}
                onClick={confirmCancelLeave}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5 font-medium"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                {submitting ? "Cancelling..." : "Yes, Cancel Leave"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Leave Type Modal */}
      {typeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <Sliders className="w-5 h-5" />
                <span>{typeModal.mode === "create" ? "Create New Leave Type" : "Edit Leave Type"}</span>
              </div>
              <button
                onClick={() => setTypeModal((prev) => ({ ...prev, open: false }))}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeaveType} className="space-y-4 text-xs">
              {/* Leave Type Name */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">
                  Leave Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maternity Leave, Study Leave"
                  value={typeModal.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setTypeModal((prev) => ({
                      ...prev,
                      name: val,
                      code:
                        prev.mode === "create"
                          ? val.toUpperCase().replace(/[^A-Z0-9]+/g, "_")
                          : prev.code,
                    }))
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">
                  System Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. MATERNITY_LEAVE"
                  value={typeModal.code}
                  disabled={typeModal.mode === "edit"}
                  onChange={(e) => setTypeModal((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-mono uppercase disabled:opacity-50"
                  required
                />
              </div>

              {/* Days Allowed per Year & Paid Flag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">
                    Annual Quota (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={typeModal.daysPerYear}
                    onChange={(e) => setTypeModal((prev) => ({ ...prev, daysPerYear: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">
                    Compensation
                  </label>
                  <div className="flex items-center gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setTypeModal((prev) => ({ ...prev, paid: true }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${typeModal.paid
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400"
                        }`}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeModal((prev) => ({ ...prev, paid: false }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${!typeModal.paid
                          ? "border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400"
                        }`}
                    >
                      Unpaid (LOP)
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Picker Palette */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1.5">
                  Badge Color
                </label>
                <div className="flex items-center gap-2">
                  {[
                    "#3B82F6", // Blue
                    "#10B981", // Emerald
                    "#EF4444", // Red
                    "#8B5CF6", // Purple
                    "#F59E0B", // Amber
                    "#EC4899", // Pink
                    "#06B6D4", // Cyan
                    "#6366F1", // Indigo
                  ].map((hex) => (
                    <button
                      type="button"
                      key={hex}
                      onClick={() => setTypeModal((prev) => ({ ...prev, colorCode: hex }))}
                      className={`w-6 h-6 rounded-full transition-transform ${typeModal.colorCode === hex ? "scale-125 ring-2 ring-offset-2 ring-emerald-500" : "hover:scale-110"
                        }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={typeModal.colorCode}
                    onChange={(e) => setTypeModal((prev) => ({ ...prev, colorCode: e.target.value }))}
                    className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent p-0 ml-1"
                    title="Choose custom color"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">
                  Description / Eligibility Policy
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain when this leave can be taken..."
                  value={typeModal.description}
                  onChange={(e) => setTypeModal((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTypeModal((prev) => ({ ...prev, open: false }))}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : typeModal.mode === "create" ? "Create Policy" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Leave Type Confirmation Modal */}
      {deleteTypeModal.open && deleteTypeModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Leave Type</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Permanent policy removal</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete the leave type <strong>{deleteTypeModal.type.name}</strong> ({deleteTypeModal.type.code})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setDeleteTypeModal({ open: false, type: null })}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submitting}
                onClick={confirmDeleteLeaveType}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5 font-medium"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {submitting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete ALL Leave Types Confirmation Modal */}
      {deleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete All Leave Types</h3>
                <p className="text-xs text-red-500 font-medium">Irreversible bulk action</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>all {leaveTypes.length} configured leave types</strong>? This will clear all existing categories and employee balance records so you can configure custom categories from scratch.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setDeleteAllModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submitting}
                onClick={confirmDeleteAllLeaveTypes}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5 font-medium"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {submitting ? "Deleting All..." : "Yes, Delete All Types"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
