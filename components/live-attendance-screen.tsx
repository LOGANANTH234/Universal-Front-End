"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Users, UserCheck, Coffee, UserX, Clock, X, CalendarIcon, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AttendanceCard from "./attendance-card"
import type { LiveAttendanceData } from "@/lib/attendance-types"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import { useLiveAttendance } from "@/hooks/use-live-attendance"
import { useAuth } from "@/lib/contexts/auth-context"

export default function LiveAttendanceScreen() {
  const { data: attendanceData, stats: liveStats, loading: isLoading, error: fetchError, refetch } = useLiveAttendance()
  const { auth } = useAuth()

  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedShift, setSelectedShift] = useState<string>("All Shifts")
  const [selectedRole, setSelectedRole] = useState<string>("All Roles")
  const [currentDate] = useState(new Date())

  const [employeeSearch, setEmployeeSearch] = useState<string>("")
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch backend shifts for name labels only
  const [backendShifts, setBackendShifts] = useState<{ name: string; startTime: string; endTime: string }[]>([])

  useEffect(() => {
    if (!auth?.token) return
    fetch("/api/shifts", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data: { id: number; name: string; startTime: string; endTime: string }[]) => {
        setBackendShifts(data.map((s) => ({ name: s.name, startTime: s.startTime, endTime: s.endTime })))
      })
      .catch((err) => console.error("[v0] Failed to fetch shifts:", err))
  }, [auth?.token])

  // Derive unique shift combos directly from attendanceData (avoids any format mismatch).
  // Backend shift names are matched by normalising case for display labels.
  const applicableShifts = useMemo(() => {
    const seen = new Set<string>()
    const result: { key: string; label: string; startTime: string; endTime: string }[] = []

    attendanceData.forEach((emp) => {
      const key = `${emp.shiftStartTime}|||${emp.shiftEndTime}`
      if (seen.has(key)) return
      seen.add(key)

      const matched = backendShifts.find(
        (s) =>
          s.startTime.toUpperCase() === emp.shiftStartTime.toUpperCase() &&
          s.endTime.toUpperCase() === emp.shiftEndTime.toUpperCase()
      )

      result.push({
        key,
        label: matched ? matched.name : `${emp.shiftStartTime} – ${emp.shiftEndTime}`,
        startTime: emp.shiftStartTime,
        endTime: emp.shiftEndTime,
      })
    })

    return result
  }, [attendanceData, backendShifts])

  const uniqueEmployees = useMemo(
    () => [...new Set(attendanceData.map((a) => a.employeeName))],
    [attendanceData],
  )
  const uniqueRoles = useMemo(
    () => ["All Roles", ...new Set(attendanceData.map((a) => a.employeeRole))],
    [attendanceData],
  )

  const suggestions = useMemo(() => {
    if (!employeeSearch.trim()) return []
    return uniqueEmployees.filter((name) =>
      name.toLowerCase().startsWith(employeeSearch.toLowerCase())
    )
  }, [employeeSearch, uniqueEmployees])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleEmployeeSelect = (name: string) => {
    setEmployeeSearch(name)
    setSelectedEmployee(name)
    setShowSuggestions(false)
  }

  const handleEmployeeSearchChange = (value: string) => {
    setEmployeeSearch(value)
    setSelectedEmployee(value.trim() === "" ? "" : value)
    setShowSuggestions(value.trim().length > 0)
  }

  const handleEmployeeClear = () => {
    setEmployeeSearch("")
    setSelectedEmployee("")
    setShowSuggestions(false)
  }

  const metrics = useMemo(() => {
    const lateArrivals = attendanceData.filter((item) => {
      const lb = item.lateBy
      return lb && lb !== "--" && lb !== "0m" && lb !== "0h 0m" && lb.trim() !== ""
    }).length

    if (liveStats) {
      return {
        total: liveStats.totalEmployees,
        clockedIn: liveStats.working,
        onBreak: liveStats.onBreak,
        absent: liveStats.absent,
        lateArrivals,
      }
    }
    return { total: 0, clockedIn: 0, onBreak: 0, absent: 0, lateArrivals }
  }, [liveStats, attendanceData])

  const filteredAttendance = useMemo(() => {
    const [filterStart, filterEnd] = selectedShift !== "All Shifts"
      ? selectedShift.split("|||")
      : [null, null]

    return attendanceData.filter((item) => {
      const statusMatch = selectedStatus === "All" || item.status?.trim().toUpperCase() === selectedStatus.trim().toUpperCase()
      const employeeMatch =
        selectedEmployee === "" ||
        item.employeeName.toLowerCase().startsWith(selectedEmployee.toLowerCase())
      const roleMatch = selectedRole === "All Roles" || item.employeeRole === selectedRole
      const shiftMatch =
        selectedShift === "All Shifts" ||
        (item.shiftStartTime === filterStart && item.shiftEndTime === filterEnd)
      return statusMatch && employeeMatch && roleMatch && shiftMatch
    })
  }, [attendanceData, selectedStatus, selectedEmployee, selectedRole, selectedShift])

  const clearFilters = () => {
    setSelectedStatus("All")
    setSelectedEmployee("")
    setEmployeeSearch("")
    setSelectedShift("All Shifts")
    setSelectedRole("All Roles")
  }

  const hasActiveFilters =
    selectedStatus !== "All" ||
    selectedEmployee !== "" ||
    selectedShift !== "All Shifts" ||
    selectedRole !== "All Roles"

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    return date.toLocaleDateString("en-US", options)
  }

  const canViewSummary = useHasAction(MODULES.LIVE_ATTENDANCE, ACTIONS.LIVE_VIEW_SUMMARY)
  const canEditPunch = useHasAction(MODULES.LIVE_ATTENDANCE, ACTIONS.LIVE_EDIT_PUNCH)

  const filterWidth = "w-[160px]"
  const employeeWidth = "w-[210px]"

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Top Date Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-border shadow-sm">
        <div className="flex items-center justify-center gap-4 px-6 py-4">
          <div className="flex items-center gap-2 h-auto py-2 px-3">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">{formatDate(currentDate)}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2 flex items-center"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="text-xs font-medium">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 max-w-7xl mx-auto">

          {/* Stats */}
          {canViewSummary && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-400 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Employees</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.total}</p>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 dark:bg-green-400 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Working</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.clockedIn}</p>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-600 dark:bg-yellow-400 flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">On Break</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{metrics.onBreak}</p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 dark:bg-red-400 flex items-center justify-center">
                  <UserX className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Absent</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.absent}</p>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-600 dark:bg-orange-400 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Late Arrivals</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metrics.lateArrivals}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6">
            {/* Labels row */}
            <div className="flex items-center gap-3 mb-1.5">
              <span className={`text-xs font-semibold text-muted-foreground uppercase tracking-wide ${employeeWidth}`}>Employee</span>
              <span className={`text-xs font-semibold text-muted-foreground uppercase tracking-wide ${filterWidth}`}>Status</span>
              <span className={`text-xs font-semibold text-muted-foreground uppercase tracking-wide ${filterWidth}`}>Shift</span>
              <span className={`text-xs font-semibold text-muted-foreground uppercase tracking-wide ${filterWidth}`}>Role</span>
            </div>

            {/* Inputs row */}
            <div className="flex items-center gap-3">

              {/* Employee Search */}
              <div className={`relative ${employeeWidth}`} ref={searchRef}>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
                <Input
                  value={employeeSearch}
                  onChange={(e) => handleEmployeeSearchChange(e.target.value)}
                  onFocus={() => { if (employeeSearch.trim().length > 0) setShowSuggestions(true) }}
                  placeholder="Search employee..."
                  className="pl-8 pr-7 h-9 text-sm w-full"
                />
                {employeeSearch && (
                  <button
                    onClick={handleEmployeeClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((name) => (
                      <button
                        key={name}
                        onMouseDown={() => handleEmployeeSelect(name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <span className="font-semibold">{name.slice(0, employeeSearch.length)}</span>
                        <span className="text-muted-foreground">{name.slice(employeeSearch.length)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className={filterWidth}>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="WORKING">Present</SelectItem>
                    <SelectItem value="ON_BREAK">On Break</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shift — from backend, only applicable shifts shown */}
              <div className={filterWidth}>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Shifts">All Shifts</SelectItem>
                    {applicableShifts.map((shift) => (
                      <SelectItem key={shift.key} value={shift.key}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role */}
              <div className={filterWidth}>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 h-9 px-3 text-sm bg-transparent whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))" }}
          >
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Loading live attendance data...</p>
              </div>
            ) : fetchError ? (
              <div className="col-span-full text-center py-12">
                <p className="text-red-600">Error: {fetchError}</p>
              </div>
            ) : filteredAttendance.length > 0 ? (
              filteredAttendance.map((item) => (
                <AttendanceCard key={item.employeeId} attendance={item} canEditPunch={canEditPunch} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No attendance records found for the selected filters.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
