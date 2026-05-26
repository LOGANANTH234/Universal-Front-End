"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"

interface ModernDatePickerProps {
  value: Date
  onChange: (date: Date) => void
  placeholder?: string
  formatPattern?: string
}

export function ModernDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  formatPattern = "dd-MMM-yyyy",
}: ModernDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [displayDate, setDisplayDate] = useState(new Date(value))

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get calendar grid
  const getDaysInMonth = () => {
    const year = displayDate.getFullYear()
    const month = displayDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: Array<{ date: number; isCurrentMonth: boolean; fullDate: Date }> = []

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, daysInPrevMonth - i),
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i),
      })
    }

    // Next month days
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i),
      })
    }

    return days
  }

  const isSelected = (date: Date) => {
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    )
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handlePrevMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1))
  }

  const handleDateSelect = (date: Date) => {
    onChange(date)
    setDisplayDate(date)
    setOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    onChange(today)
    setDisplayDate(today)
    setOpen(false)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value)
    setDisplayDate(new Date(displayDate.getFullYear(), month))
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value)
    setDisplayDate(new Date(year, displayDate.getMonth()))
  }

  const days = getDaysInMonth()
  const currentYear = displayDate.getFullYear()
  const currentMonth = displayDate.getMonth()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-10 px-3 py-2 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-900"
        >
          <Calendar className="mr-2 h-4 w-4 text-slate-600 flex-shrink-0" />
          <span className="text-slate-900 font-medium">
            {format(value, formatPattern)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-white rounded-lg shadow-lg border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-white rounded-t-lg">
          <div className="text-xs font-medium text-blue-100">Selected Date</div>
          <div className="text-lg font-bold">{format(value, formatPattern)}</div>
        </div>

        {/* Calendar */}
        <div className="p-3">
          {/* Month and Year Selectors */}
          <div className="flex gap-2 mb-3">
            <select
              value={currentMonth}
              onChange={handleMonthChange}
              className="flex-1 px-2 py-1.5 text-xs border-2 border-blue-300 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 text-slate-900 font-semibold hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {monthNames.map((month, idx) => (
                <option key={idx} value={idx}>{month}</option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={handleYearChange}
              className="px-2 py-1.5 text-xs border-2 border-blue-300 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 text-slate-900 font-semibold hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {Array.from({ length: 21 }, (_, i) => currentYear - 10 + i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-slate-500 py-1"
              >
                {day.charAt(0)}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => handleDateSelect(day.fullDate)}
                className={`
                  p-1 text-xs font-medium rounded transition-all
                  ${!day.isCurrentMonth ? "text-slate-200" : ""}
                  ${isSelected(day.fullDate)
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : isToday(day.fullDate) && day.isCurrentMonth
                    ? "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
                    : day.isCurrentMonth
                    ? "text-slate-900 hover:bg-slate-100"
                    : ""
                  }
                `}
                disabled={!day.isCurrentMonth}
              >
                {day.date}
              </button>
            ))}
          </div>

          {/* Footer with Today button */}
          <div className="mt-2 pt-2 border-t border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="w-full text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium h-7"
            >
              Today
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
