"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type View = "day" | "month" | "year"

interface MultiViewCalendarProps {
  selected: Date
  onSelect: (date: Date) => void
  fromYear?: number
  toYear?: number
}

export function MultiViewCalendar({
  selected,
  onSelect,
  fromYear = 2020,
  toYear = 2030,
}: MultiViewCalendarProps) {
  const [view, setView] = useState<View>("day")
  const [displayDate, setDisplayDate] = useState(selected)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const monthNamesShort = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Generate year range
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i)

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()
    
    const days: Array<{ date: number; month: "prev" | "current" | "next"; fullDate: Date }> = []
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        month: "prev",
        fullDate: new Date(year, month - 1, daysInPrevMonth - i)
      })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        month: "current",
        fullDate: new Date(year, month, i)
      })
    }
    
    // Next month days
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: "next",
        fullDate: new Date(year, month + 1, i)
      })
    }
    
    return days
  }

  const handlePrevious = () => {
    if (view === "day") {
      setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1))
    } else if (view === "month") {
      setDisplayDate(new Date(displayDate.getFullYear() - 1, displayDate.getMonth(), 1))
    } else if (view === "year") {
      setDisplayDate(new Date(displayDate.getFullYear() - 12, displayDate.getMonth(), 1))
    }
  }

  const handleNext = () => {
    if (view === "day") {
      setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1))
    } else if (view === "month") {
      setDisplayDate(new Date(displayDate.getFullYear() + 1, displayDate.getMonth(), 1))
    } else if (view === "year") {
      setDisplayDate(new Date(displayDate.getFullYear() + 12, displayDate.getMonth(), 1))
    }
  }

  const handleMonthSelect = (monthIndex: number) => {
    setDisplayDate(new Date(displayDate.getFullYear(), monthIndex, 1))
    setView("day")
  }

  const handleYearSelect = (year: number) => {
    setDisplayDate(new Date(year, displayDate.getMonth(), 1))
    setView("month")
  }

  const handleDaySelect = (date: Date) => {
    onSelect(date)
  }

  const handleToday = () => {
    const today = new Date()
    setDisplayDate(today)
    setView("day")
    onSelect(today)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear()
  }

  return (
    <div className="p-3 w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          {view === "day" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold hover:bg-accent"
                onClick={() => setView("month")}
              >
                {monthNames[displayDate.getMonth()]}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold hover:bg-accent"
                onClick={() => setView("year")}
              >
                {displayDate.getFullYear()}
              </Button>
            </>
          )}
          {view === "month" && (
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold hover:bg-accent"
              onClick={() => setView("year")}
            >
              {displayDate.getFullYear()}
            </Button>
          )}
          {view === "year" && (
            <div className="font-semibold text-sm">
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

      {/* Day View */}
      {view === "day" && (
        <div>
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground p-2"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(displayDate).map((day, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 w-full p-0 font-normal",
                  day.month !== "current" && "text-muted-foreground opacity-50",
                  isToday(day.fullDate) && "bg-accent",
                  isSelected(day.fullDate) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => handleDaySelect(day.fullDate)}
              >
                {day.date}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <div className="grid grid-cols-3 gap-2">
          {monthNamesShort.map((month, idx) => (
            <Button
              key={month}
              variant="ghost"
              className={cn(
                "h-16 font-normal",
                displayDate.getMonth() === idx && "bg-accent",
                selected.getMonth() === idx && 
                selected.getFullYear() === displayDate.getFullYear() && 
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleMonthSelect(idx)}
            >
              {month}
            </Button>
          ))}
        </div>
      )}

      {/* Year View */}
      {view === "year" && (
        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
          {years.map((year) => (
            <Button
              key={year}
              variant="ghost"
              className={cn(
                "h-14 font-normal",
                displayDate.getFullYear() === year && "bg-accent",
                selected.getFullYear() === year && 
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      )}

      {/* Today button at the bottom of calendar */}
      <div className="mt-3 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleToday}
        >
          Today
        </Button>
      </div>
    </div>
  )
}
