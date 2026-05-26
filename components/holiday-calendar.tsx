"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"

interface Holiday {
  id: string
  date: Date
  name: string
  description?: string
}

interface HolidayCalendarProps {
  holidays: Holiday[]
  onDateClick?: (date: Date) => void
}

export function HolidayCalendar({ holidays, onDateClick }: HolidayCalendarProps) {
  const [currentYear] = useState(new Date().getFullYear())
  const [expandedMonth, setExpandedMonth] = useState<number | null>(0)

  const months = [
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

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getHolidaysForMonth = (month: number) => {
    return holidays.filter((h) => h.date.getMonth() === month && h.date.getFullYear() === currentYear)
  }

  const getDaysInMonth = (month: number) => {
    return new Date(currentYear, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number) => {
    return new Date(currentYear, month, 1).getDay()
  }

  const renderCalendarDays = (month: number) => {
    const daysInMonth = getDaysInMonth(month)
    const firstDay = getFirstDayOfMonth(month)
    const monthHolidays = getHolidaysForMonth(month)
    const days = []

    // Empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 text-gray-200"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, month, day)
      const dayHoliday = monthHolidays.find((h) => h.date.getDate() === day)

      days.push(
        <button
          key={day}
          onClick={() => onDateClick?.(date)}
          className={`p-2 rounded text-sm font-medium transition-colors relative group ${
            dayHoliday ? "bg-red-500 text-white hover:bg-red-600" : "text-gray-700 hover:bg-blue-50"
          }`}
          title={dayHoliday?.name || ""}
        >
          {day}
          {dayHoliday && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
              {dayHoliday.name}
            </div>
          )}
        </button>,
      )
    }

    return days
  }

  return (
    <div className="space-y-6">
      {months.map((month, monthIndex) => {
        const monthHolidays = getHolidaysForMonth(monthIndex)
        const isExpanded = expandedMonth === monthIndex

        return (
          <div key={monthIndex} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Month Header */}
            <button
              onClick={() => setExpandedMonth(isExpanded ? null : monthIndex)}
              className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-150 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">
                  {month} {currentYear}
                </h3>
                {monthHolidays.length > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                    {monthHolidays.length}
                  </span>
                )}
              </div>
              <ChevronRight className={`h-5 w-5 text-gray-600 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>

            {/* Calendar Grid */}
            {isExpanded && (
              <div className="p-4">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">{renderCalendarDays(monthIndex)}</div>

                {/* Holidays List for Month */}
                {monthHolidays.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Holidays</p>
                    <div className="space-y-1">
                      {monthHolidays
                        .sort((a, b) => a.date.getDate() - b.date.getDate())
                        .map((holiday) => (
                          <div key={holiday.id} className="p-2 bg-red-50 rounded border border-red-200">
                            <p className="text-sm font-medium text-red-700">
                              {holiday.date.getDate()} - {holiday.name}
                            </p>
                            {holiday.description && (
                              <p className="text-xs text-red-600 mt-0.5">{holiday.description}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
