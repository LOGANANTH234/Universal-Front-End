"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface ModernMonthPickerProps {
  value: string // Format: "yyyy-mm"
  onChange: (date: string) => void
  placeholder?: string
}

export function ModernMonthPicker({
  value,
  onChange,
  placeholder = "Pick a month",
}: ModernMonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [displayYear, setDisplayYear] = useState(
    value ? parseInt(value.split("-")[0]) : new Date().getFullYear()
  )

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const monthNamesShort = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const getCurrentMonth = () => {
    if (!value) return null
    const [year, month] = value.split("-")
    return { year: parseInt(year), month: parseInt(month) }
  }

  const current = getCurrentMonth()
  const currentMonthIndex = current?.month ? current.month - 1 : -1

  const handlePrevYear = () => {
    setDisplayYear(displayYear - 1)
  }

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDisplayYear(parseInt(e.target.value))
  }

  const handleMonthSelect = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0")
    const newValue = `${displayYear}-${monthStr}`
    onChange(newValue)
    setOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    onChange(`${year}-${month}`)
    setDisplayYear(year)
    setOpen(false)
  }

  const displayValue = value
    ? (() => {
        const [year, month] = value.split("-")
        const monthIndex = parseInt(month) - 1
        return `${monthNames[monthIndex]} ${year}`
      })()
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-10 px-3 py-2 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-900"
        >
          <Calendar className="mr-2 h-4 w-4 text-slate-600 flex-shrink-0" />
          <span className="text-slate-900 font-medium">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-white rounded-lg shadow-lg border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-white rounded-t-lg">
          <div className="text-xs font-medium text-blue-100">Selected Month</div>
          <div className="text-lg font-bold">{displayValue}</div>
        </div>

        {/* Month Picker */}
        <div className="p-3">
          {/* Year Selector */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Year</label>
            <select
              value={displayYear}
              onChange={handleYearSelect}
              className="w-full px-2 py-1.5 text-xs border-2 border-blue-300 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 text-slate-900 font-semibold hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {Array.from({ length: 21 }, (_, i) => displayYear - 10 + i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {monthNamesShort.map((month, idx) => (
              <button
                key={idx}
                onClick={() => handleMonthSelect(idx)}
                className={`
                  p-2 text-xs font-semibold rounded-md transition-all
                  ${currentMonthIndex === idx && current?.year === displayYear
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-slate-900 hover:bg-slate-100"
                  }
                `}
              >
                {month}
              </button>
            ))}
          </div>

          {/* Footer with Today button */}
          <div className="mt-3 pt-3 border-t border-slate-200">
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
