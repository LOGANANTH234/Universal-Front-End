"use client"
import { API_BASE_URL } from "@/lib/branding-config"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Trash2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  DollarSign,
  RotateCw,
} from "lucide-react"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import { useAuth } from "@/lib/contexts/auth-context"
import { Holiday, useHolidayCache } from "@/lib/contexts/holiday-cache-context"

interface HolidayBackendDto {
  id?: number
  holidayDate: string
  holidayName: string
  year?: number
  month?: number
  day?: number
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function HolidayManagementScreen() {
  const holidayCache = useHolidayCache()
  const { auth } = useAuth()
  const token = auth?.token || (typeof window !== "undefined" ? localStorage.getItem("token") : null)

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [holidays, setHolidays] = useState<Holiday[]>(
    holidayCache.getHolidaysForYear(new Date().getFullYear()) || []
  )
  const [loading, setLoading] = useState<boolean>(
    !holidayCache.hasLoadedYear(new Date().getFullYear())
  )
  const [saving, setSaving] = useState<boolean>(false)
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [existingHolidayDialog, setExistingHolidayDialog] = useState<Holiday | null>(null)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "", date: "" })
  const [selectedDate, setSelectedDate] = useState<string>("")

  // Permission checks
  const canViewHoliday = useHasAction(MODULES.HOLIDAY_MANAGEMENT, ACTIONS.HOLIDAY_VIEW)
  const canEditHoliday = useHasAction(MODULES.HOLIDAY_MANAGEMENT, ACTIONS.HOLIDAY_EDIT)
  const isReadOnly = canViewHoliday && !canEditHoliday

  const getApiBase = () => {
    return process.env.NEXT_PUBLIC_API_URL || API_BASE_URL
  }

  // Synchronize holidays when holidayCache changes for selectedYear
  useEffect(() => {
    const cached = holidayCache.getHolidaysForYear(selectedYear)
    if (cached) {
      setHolidays(cached)
    }
  }, [selectedYear, holidayCache])

  // Load holidays for selected year from backend API once, then cache
  const fetchHolidays = useCallback(async (year: number, forceRefresh = false) => {
    if (!token) return
    if (holidayCache.hasLoadedYear(year) && !forceRefresh) {
      const cached = holidayCache.getHolidaysForYear(year)
      if (cached) {
        setHolidays(cached)
        setLoading(false)
      }
      return
    }
    setLoading(true)
    setNotice(null)
    try {
      const baseUrl = getApiBase()
      const res = await fetch(`${baseUrl}/api/holidays/year/${year}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        throw new Error(`Failed to load holidays (status ${res.status})`)
      }

      const data: HolidayBackendDto[] = await res.json()
      const mapped: Holiday[] = (data || []).map((item) => ({
        id: item.id ? item.id.toString() : item.holidayDate,
        date: item.holidayDate,
        name: item.holidayName,
      }))

      setHolidays(mapped)
      holidayCache.setHolidaysForYear(year, mapped)
    } catch (err: any) {
      console.error("Error fetching holidays:", err)
      setNotice({ type: "error", text: err?.message || "Failed to load holidays from server" })
    } finally {
      setLoading(false)
    }
  }, [token, holidayCache])

  useEffect(() => {
    if (token) {
      fetchHolidays(selectedYear)
    }
  }, [selectedYear, token, fetchHolidays])

  // Count holidays in a specific month
  const getHolidayCountForMonth = (monthIndex: number) => {
    return holidays.filter((h) => {
      const [y, m] = h.date.split("-")
      return Number.parseInt(m) === monthIndex + 1 && Number.parseInt(y) === selectedYear
    }).length
  }

  const getDaysInMonth = (monthIndex: number) => {
    return new Date(selectedYear, monthIndex + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (monthIndex: number) => {
    return new Date(selectedYear, monthIndex, 1).getDay()
  }

  const getHolidayForDate = (date: string) => {
    return holidays.find((h) => h.date === date)
  }

  const handleExistingHolidayClick = (holiday: Holiday) => {
    setExistingHolidayDialog(holiday)
  }

  const handleEditFromExistingDialog = (holiday: Holiday) => {
    if (!canEditHoliday) return
    setEditingHoliday(holiday)
    setSelectedDate(holiday.date)
    setFormData({
      name: holiday.name,
      description: holiday.description || "",
      date: holiday.date,
    })
    setExistingHolidayDialog(null)
    setIsDialogOpen(true)
  }

  const handleDeleteFromExistingDialog = async (holiday: Holiday) => {
    if (!canEditHoliday) return
    const success = await handleDeleteHoliday(holiday)
    if (success) {
      setExistingHolidayDialog(null)
    }
  }

  const handleOpenAddDialog = (date?: string) => {
    if (!canEditHoliday) return
    setEditingHoliday(null)
    if (date) {
      setSelectedDate(date)
      setFormData({ name: "", description: "", date })
    } else {
      setSelectedDate("")
      setFormData({ name: "", description: "", date: "" })
    }
    setIsDialogOpen(true)
  }

  // Save / Update Holiday to backend & trigger salary calculation
  const handleSaveHoliday = async () => {
    if (!formData.name.trim() || !selectedDate || !token) return
    setSaving(true)
    setNotice(null)

    try {
      const baseUrl = getApiBase()
      const payload = {
        holidayDate: selectedDate,
        holidayName: formData.name.trim(),
      }

      const res = await fetch(`${baseUrl}/api/holidays`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`Failed to save holiday (status ${res.status})`)
      }

      const savedDto: HolidayBackendDto = await res.json()
      const savedHoliday: Holiday = {
        id: savedDto.id ? savedDto.id.toString() : selectedDate,
        date: savedDto.holidayDate || selectedDate,
        name: savedDto.holidayName || formData.name.trim(),
      }

      setHolidays((prev) => {
        const filtered = prev.filter((h) => h.date !== savedHoliday.date)
        return [...filtered, savedHoliday]
      })
      holidayCache.addOrUpdateHoliday(savedHoliday)

      setIsDialogOpen(false)
      setFormData({ name: "", description: "", date: "" })
      setSelectedDate("")

      setNotice({
        type: "success",
        text: `Holiday "${savedHoliday.name}" marked for ${savedHoliday.date}! Regular shift salary has been calculated and saved for all active employees.`,
      })
    } catch (err: any) {
      console.error("Error saving holiday:", err)
      setNotice({ type: "error", text: err?.message || "Failed to save holiday." })
    } finally {
      setSaving(false)
    }
  }

  // Delete Holiday from backend & recalculate daily salary
  const handleDeleteHoliday = async (holiday: Holiday): Promise<boolean> => {
    if (!canEditHoliday || !token) return false
    setSaving(true)
    setNotice(null)

    try {
      const baseUrl = getApiBase()
      const res = await fetch(`${baseUrl}/api/holidays/${holiday.date}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete holiday (status ${res.status})`)
      }

      setHolidays((prev) => prev.filter((h) => h.date !== holiday.date))
      holidayCache.deleteHoliday(holiday.date)

      setNotice({
        type: "info",
        text: `Holiday "${holiday.name}" deleted for ${holiday.date}. Daily salary has been recalculated.`,
      })
      return true
    } catch (err: any) {
      console.error("Error deleting holiday:", err)
      setNotice({ type: "error", text: err?.message || "Failed to delete holiday." })
      return false
    } finally {
      setSaving(false)
    }
  }

  // Render a Month Calendar Card
  const renderMonthCard = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex)
    const firstDay = getFirstDayOfMonth(monthIndex)
    const holidayCount = getHolidayCountForMonth(monthIndex)
    const calendarDays: (string | null)[] = []

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      calendarDays.push(dateStr)
    }

    return (
      <Card
        key={monthIndex}
        className="p-4 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
      >
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTHS[monthIndex]}
            </h3>
            {holidayCount > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400 border border-red-200 dark:border-red-900">
                {holidayCount} {holidayCount === 1 ? "Holiday" : "Holidays"}
              </span>
            ) : (
              <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">0 Holidays</span>
            )}
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
              <div
                key={`${day}-${idx}`}
                className={`text-center text-xs font-semibold h-5 flex items-center justify-center ${idx === 0
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-gray-500 dark:text-slate-400"
                  }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-7"></div>
              }

              const holiday = getHolidayForDate(date)
              const dayNum = Number.parseInt(date.split("-")[2], 10)
              const dayOfWeek = new Date(selectedYear, monthIndex, dayNum).getDay()
              const isSunday = dayOfWeek === 0

              return (
                <button
                  key={date}
                  onClick={() => {
                    if (holiday) {
                      handleExistingHolidayClick(holiday)
                    } else if (canEditHoliday) {
                      handleOpenAddDialog(date)
                    }
                  }}
                  disabled={!canEditHoliday && !holiday}
                  className={`h-7 rounded-md text-xs font-medium transition-all flex items-center justify-center relative group ${holiday
                    ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 shadow-sm cursor-pointer font-bold ring-2 ring-red-400/40"
                    : canEditHoliday
                      ? isSunday
                        ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-gray-200 dark:border-slate-800 cursor-pointer"
                        : "text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 cursor-pointer"
                      : "text-gray-400 dark:text-slate-600 border border-gray-100 dark:border-slate-800/60 cursor-not-allowed"
                    }`}
                  title={
                    holiday
                      ? `★ ${holiday.name} (Click to manage)`
                      : canEditHoliday
                        ? `Click to mark ${date} as holiday`
                        : "View-only access"
                  }
                >
                  {dayNum}
                  {holiday && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Month Holidays Summary List */}
        {holidayCount > 0 ? (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-red-500" />
              <span>Holidays in {MONTHS[monthIndex]}</span>
            </p>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {holidays
                .filter((h) => {
                  const [y, m] = h.date.split("-")
                  return Number.parseInt(m) === monthIndex + 1 && Number.parseInt(y) === selectedYear
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((holiday) => (
                  <div
                    key={holiday.id}
                    className="p-1.5 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-900/60 text-xs group hover:border-red-400 dark:hover:border-red-700 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => handleExistingHolidayClick(holiday)}
                  >
                    <span className="font-semibold text-gray-900 dark:text-red-200 truncate pr-1">
                      {holiday.name}
                    </span>
                    <span className="text-red-700 dark:text-red-400 font-mono text-[11px] shrink-0">
                      {new Date(holiday.date).getDate()} {MONTHS[monthIndex].slice(0, 3)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 pt-2 text-center text-[11px] text-gray-400 dark:text-slate-600 border-t border-gray-100 dark:border-slate-800/60">
            No holidays set
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Holiday Management
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Configure company public holidays for <span className="font-semibold text-gray-900 dark:text-white">{selectedYear}</span>.
            </p>
            {isReadOnly && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> View-only access. You cannot add or remove holidays.
              </p>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Year Selector */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                onClick={() => setSelectedYear((y) => y - 1)}
                title="Previous Year"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-bold text-gray-900 dark:text-white font-mono">
                {selectedYear}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                onClick={() => setSelectedYear((y) => y + 1)}
                title="Next Year"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHolidays(selectedYear, true)}
              disabled={loading || saving}
              className="h-8 px-2.5 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 gap-1.5 cursor-pointer shadow-2xs"
              title="Refresh holidays from server"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline text-xs">Refresh</span>
            </Button>

            {/* Add Holiday Button */}
            {false && (
              <Button
                size="sm"
                onClick={() => handleOpenAddDialog()}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Add Holiday</span>
              </Button>
            )}
          </div>
        </div>

        {/* Salary Rule Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-blue-950/30 border border-emerald-200 dark:border-emerald-900/60 shadow-sm text-sm">
          <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0 mt-0.5">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-emerald-900 dark:text-emerald-300">
              Automatic Regular Shift Salary Calculation:
            </span>{" "}
            <span className="text-emerald-800 dark:text-emerald-400">
              When a day is marked as a holiday, all active employees with an assigned regular shift will automatically have their regular shift salary amount calculated and saved for that day during salary generation.
            </span>
          </div>
        </div>

        {/* Notifications / Status Feedback */}
        {notice && (
          <div
            className={`p-3.5 rounded-lg text-sm flex items-center justify-between transition-all ${notice.type === "success"
              ? "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : notice.type === "error"
                ? "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === "success" && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />}
              {notice.type === "error" && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
              {notice.type === "info" && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
              <span>{notice.text}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Loading holidays for {selectedYear}...</p>
          </div>
        ) : (
          /* 12-Month Calendar Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MONTHS.map((_, monthIndex) => renderMonthCard(monthIndex))}
          </div>
        )}

        {/* View / Manage Existing Holiday Dialog */}
        <Dialog open={!!existingHolidayDialog} onOpenChange={(open) => !open && setExistingHolidayDialog(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 text-gray-900 dark:text-white border-gray-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                {existingHolidayDialog?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="py-3 space-y-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-slate-800/70 rounded-lg border border-gray-100 dark:border-slate-700/60 space-y-1.5">
                <p className="text-gray-600 dark:text-slate-300">
                  <span className="font-semibold text-gray-800 dark:text-white">Date:</span>{" "}
                  <span className="font-mono">{existingHolidayDialog?.date}</span>
                </p>
                <p className="text-gray-600 dark:text-slate-300">
                  <span className="font-semibold text-gray-800 dark:text-white">Salary Status:</span>{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Regular shift amount credited to active employees
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 flex-wrap sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setExistingHolidayDialog(null)}
                className="border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300"
              >
                Close
              </Button>

              {canEditHoliday && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => existingHolidayDialog && handleEditFromExistingDialog(existingHolidayDialog)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    disabled={saving}
                    onClick={() => existingHolidayDialog && handleDeleteFromExistingDialog(existingHolidayDialog)}
                    className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add / Edit Holiday Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 text-gray-900 dark:text-white border-gray-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {editingHoliday ? "Edit Holiday" : "Mark Date as Holiday"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Date {canEditHoliday && "*"}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={!canEditHoliday}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${!canEditHoliday
                    ? "border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed"
                    : "border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Holiday Name {canEditHoliday && "*"}
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Diwali, Christmas, Republic Day"
                  disabled={!canEditHoliday}
                  className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold">Note:</span> Saving this holiday will automatically calculate and save regular shift salary for all active employees for this date.
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="gap-1.5 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              {canEditHoliday && (
                <Button
                  onClick={handleSaveHoliday}
                  disabled={!formData.name.trim() || !selectedDate || saving}
                  className="bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {editingHoliday ? "Update Holiday" : "Save Holiday"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
