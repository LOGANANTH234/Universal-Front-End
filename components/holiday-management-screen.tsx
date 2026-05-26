"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, X } from "lucide-react"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"

interface Holiday {
  id: string
  date: string // YYYY-MM-DD format
  name: string
  description?: string
}

type ChangeType = "add" | "edit" | "remove"
interface Change {
  type: ChangeType
  holiday: Holiday
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

const INITIAL_HOLIDAYS: Holiday[] = [
  {
    id: "1",
    date: "2025-01-26",
    name: "Republic Day",
    description: "National holiday celebrating India's Constitution",
  },
  { id: "2", date: "2025-03-08", name: "Maha Shivaratri", description: "Hindu festival celebrating Lord Shiva" },
  { id: "3", date: "2025-04-17", name: "Ram Navami", description: "Birth of Lord Rama" },
  { id: "4", date: "2025-04-21", name: "Mahavir Jayanti", description: "Birth of Mahavira" },
  { id: "5", date: "2025-10-02", name: "Gandhi Jayanti", description: "Birth of Mahatma Gandhi" },
  { id: "6", date: "2025-10-12", name: "Dussehra", description: "Victory of good over evil" },
  { id: "7", date: "2025-11-01", name: "Diwali", description: "Festival of lights" },
  { id: "8", date: "2025-01-14", name: "Makar Sankranti", description: "Harvest festival" },
]

export function HolidayManagementScreen() {
  const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS)
  const [changes, setChanges] = useState<Change[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [existingHolidayDialog, setExistingHolidayDialog] = useState<Holiday | null>(null)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "", date: "" })
  const [selectedDate, setSelectedDate] = useState<string>("")

  // Permission checks
  const canViewHoliday = useHasAction(MODULES.HOLIDAY_MANAGEMENT, ACTIONS.HOLIDAY_VIEW)
  const canEditHoliday = useHasAction(MODULES.HOLIDAY_MANAGEMENT, ACTIONS.HOLIDAY_EDIT)
  const isReadOnly = canViewHoliday && !canEditHoliday

  const currentYear = new Date().getFullYear()

  const getHolidayCountForMonth = (month: number) => {
    return holidays.filter((h) => {
      const [year, m] = h.date.split("-")
      return Number.parseInt(m) === month + 1 && Number.parseInt(year) === currentYear
    }).length
  }

  const getDaysInMonth = (month: number) => {
    return new Date(currentYear, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number) => {
    return new Date(currentYear, month, 1).getDay()
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

  const handleRemoveFromExistingDialog = (holiday: Holiday) => {
    if (!canEditHoliday) return
    handleDeleteHoliday(holiday)
    setExistingHolidayDialog(null)
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

  const handleSaveHoliday = () => {
    if (!formData.name || !selectedDate) return

    if (editingHoliday) {
      const oldHoliday = editingHoliday
      setHolidays(
        holidays.map((h) =>
          h.id === oldHoliday.id
            ? { ...h, name: formData.name, description: formData.description, date: selectedDate }
            : h,
        ),
      )
      setChanges([
        ...changes.filter((c) => c.holiday.id !== oldHoliday.id),
        {
          type: "edit",
          holiday: { id: oldHoliday.id, date: selectedDate, name: formData.name, description: formData.description },
        },
      ])
    } else {
      const newHoliday: Holiday = {
        id: Date.now().toString(),
        date: selectedDate,
        name: formData.name,
        description: formData.description,
      }
      setHolidays([...holidays, newHoliday])
      setChanges([...changes, { type: "add", holiday: newHoliday }])
    }

    setIsDialogOpen(false)
    setFormData({ name: "", description: "", date: "" })
    setSelectedDate("")
  }

  const handleDeleteHoliday = (holiday: Holiday) => {
    setHolidays(holidays.filter((h) => h.id !== holiday.id))
    setChanges([...changes.filter((c) => c.holiday.id !== holiday.id), { type: "remove", holiday }])
  }

  const handleSaveAll = () => {
    if (!canEditHoliday) return
    setChanges([])
    alert("All changes saved successfully!")
  }

  const hasChanges = changes.length > 0

  const renderMonthCard = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex)
    const firstDay = getFirstDayOfMonth(monthIndex)
    const holidayCount = getHolidayCountForMonth(monthIndex)
    const calendarDays: (string | null)[] = []

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      calendarDays.push(dateStr)
    }

    return (
      <Card key={monthIndex} className="p-4 hover:shadow-md transition-shadow">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {MONTHS[monthIndex]} {holidayCount > 0 && <span className="text-red-600">({holidayCount})</span>}
          </h3>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 h-5">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-6"></div>
            }

            const holiday = getHolidayForDate(date)
            const day = Number.parseInt(date.split("-")[2])

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
                className={`h-6 rounded text-xs font-medium transition-all ${
                  holiday
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-sm cursor-pointer"
                    : canEditHoliday
                      ? "text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer"
                      : "text-gray-400 border border-gray-200 cursor-not-allowed"
                }`}
                title={holiday?.name || (canEditHoliday ? "Click to add holiday" : "View-only access")}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Month Holidays List */}
        {holidayCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Holidays</p>
            <div className="space-y-1">
              {holidays
                .filter((h) => {
                  const [year, m] = h.date.split("-")
                  return Number.parseInt(m) === monthIndex + 1 && Number.parseInt(year) === currentYear
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((holiday) => (
                  <div
                    key={holiday.id}
                    className="p-2 bg-red-50 rounded border border-red-200 text-xs group hover:border-red-300 transition-colors cursor-pointer"
                    onClick={() => handleExistingHolidayClick(holiday)}
                  >
                    <p className="font-medium text-gray-900 line-clamp-1">{holiday.name}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(holiday.date).getDate()} {MONTHS[monthIndex]}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Holiday Management</h1>
            <p className="text-gray-600 mt-1">Manage company holidays for {currentYear}</p>
            {isReadOnly && <p className="text-sm text-amber-600 mt-2">View-only access. You cannot modify holidays.</p>}
          </div>
          {canEditHoliday && (
            <Button
              onClick={handleSaveAll}
              disabled={!hasChanges}
              className={`flex-shrink-0 ${
                hasChanges ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {hasChanges ? `Save All (${changes.length})` : "Save All"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTHS.map((_, monthIndex) => renderMonthCard(monthIndex))}
        </div>

        {/* Edit/Remove Dialog for existing holidays */}
        <Dialog open={!!existingHolidayDialog} onOpenChange={(open) => !open && setExistingHolidayDialog(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Holiday: {existingHolidayDialog?.name}</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {existingHolidayDialog?.date}
              </p>
              {existingHolidayDialog?.description && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {existingHolidayDialog.description}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setExistingHolidayDialog(null)} className="gap-2">
                {canEditHoliday ? "Cancel" : "Close"}
              </Button>
              {canEditHoliday && (
                <>
                  <Button
                    onClick={() => existingHolidayDialog && handleEditFromExistingDialog(existingHolidayDialog)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => existingHolidayDialog && handleRemoveFromExistingDialog(existingHolidayDialog)}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Holiday Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingHoliday ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={!canEditHoliday}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !canEditHoliday
                      ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name {canEditHoliday && "*"}</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Diwali, Christmas"
                  disabled={!canEditHoliday}
                  className={`w-full ${!canEditHoliday ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a description..."
                  disabled={!canEditHoliday}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    !canEditHoliday
                      ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      : "border-gray-300"
                  }`}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="gap-2">
                <X className="h-4 w-4" />
                {canEditHoliday ? "Cancel" : "Close"}
              </Button>
              {canEditHoliday && (
                <Button
                  onClick={handleSaveHoliday}
                  disabled={!formData.name || !selectedDate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingHoliday ? "Update" : "Add"} Holiday
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
