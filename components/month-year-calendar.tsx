"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type View = "month" | "year"

interface MonthYearCalendarProps {
  selected: Date
  onSelect: (date: Date) => void
  fromYear?: number
  toYear?: number
}

export function MonthYearCalendar({
  selected,
  onSelect,
  fromYear = 2020,
  toYear = 2030,
}: MonthYearCalendarProps) {
  const [view, setView] = useState<View>("month")
  const [displayDate, setDisplayDate] = useState(selected)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const monthNamesShort = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  // Generate year range
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i)

  const handlePrevious = () => {
    if (view === "month") {
      setDisplayDate(new Date(displayDate.getFullYear() - 1, displayDate.getMonth(), 1))
    } else if (view === "year") {
      setDisplayDate(new Date(displayDate.getFullYear() - 12, displayDate.getMonth(), 1))
    }
  }

  const handleNext = () => {
    if (view === "month") {
      setDisplayDate(new Date(displayDate.getFullYear() + 1, displayDate.getMonth(), 1))
    } else if (view === "year") {
      setDisplayDate(new Date(displayDate.getFullYear() + 12, displayDate.getMonth(), 1))
    }
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(displayDate.getFullYear(), monthIndex, 1)
    onSelect(newDate)
  }

  const handleYearSelect = (year: number) => {
    setDisplayDate(new Date(year, displayDate.getMonth(), 1))
    setView("month")
  }

  const handleToday = () => {
    const today = new Date()
    setDisplayDate(today)
    setView("month")
    onSelect(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const isCurrentMonth = (monthIndex: number) => {
    const currentDate = new Date()
    return monthIndex === currentDate.getMonth() && 
           displayDate.getFullYear() === currentDate.getFullYear()
  }

  const isSelectedMonth = (monthIndex: number) => {
    return monthIndex === selected.getMonth() && 
           displayDate.getFullYear() === selected.getFullYear()
  }

  return (
    <div className="p-4 w-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          {view === "month" && (
            <Button
              variant="ghost"
              size="sm"
              className="font-bold text-base hover:bg-blue-100"
              onClick={() => setView("year")}
            >
              {displayDate.getFullYear()}
            </Button>
          )}
          {view === "year" && (
            <div className="font-bold text-base">
              {displayDate.getFullYear() - 6} - {displayDate.getFullYear() + 5}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Month View */}
      {view === "month" && (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {monthNamesShort.map((month, idx) => (
              <Button
                key={month}
                variant="ghost"
                className={cn(
                  "h-12 font-semibold text-sm rounded-lg transition-all",
                  isCurrentMonth(idx) && "ring-2 ring-blue-400",
                  isSelectedMonth(idx) 
                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" 
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                )}
                onClick={() => handleMonthSelect(idx)}
              >
                {month}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Year View */}
      {view === "year" && (
        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
          {years.map((year) => (
            <Button
              key={year}
              variant="ghost"
              className={cn(
                "h-12 font-semibold text-sm rounded-lg transition-all",
                displayDate.getFullYear() === year && "ring-2 ring-blue-400",
                selected.getFullYear() === year 
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              )}
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      )}

      {/* Today button at the bottom of calendar */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium"
          onClick={handleToday}
        >
          Today
        </Button>
      </div>
    </div>
  )
}
