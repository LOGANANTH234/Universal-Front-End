"use client"
import { API_BASE_URL } from "@/lib/branding-config"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle, CalendarIcon, ChevronRight, ChevronLeft } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { SearchableComboBox } from "./searchable-combo-box"
import { MultiViewCalendar } from "./multi-view-calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface OvertimeRecord {
  id: number
  employeeName: string
  workDate: string
  overtimeShiftName: string
  otMinutes: string
  otAmount: number
}

export function OvertimeDetailsScreen() {
  const { auth } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [data, setData] = useState<OvertimeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  useEffect(() => {
    const fetchOvertimeData = async () => {
      if (!auth?.token) {
        setError("Authentication token not available")
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Format date in local timezone (YYYY-MM-DD) to avoid -1 day offset
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`
        const response = await fetch(
          `${API_BASE_URL}/api/payrolls/getOvertTimeSalaryDetails?date=${dateString}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`)
        }

        const apiData: OvertimeRecord[] = await response.json()
        setData(apiData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
        console.error("Error fetching overtime data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOvertimeData()
  }, [selectedDate, auth?.token])

  const filteredData = data.filter((record) =>
    selectedEmployee ? record.employeeName === selectedEmployee : true
  )

  const employees = useMemo(() => {
    const uniqueEmployees = Array.from(new Set(data.map((r) => r.employeeName)))
    return [
      { value: "", label: "All Employees" },
      ...uniqueEmployees.map((emp) => ({ value: emp, label: emp }))
    ]
  }, [data])

  const handlePreviousDay = () => {
    const prevDay = new Date(selectedDate)
    prevDay.setDate(prevDay.getDate() - 1)
    setSelectedDate(prevDay)
  }

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    setSelectedDate(nextDay)
  }

  return (
    <div className="w-full space-y-6 px-6 py-8">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Employee</Label>
            <SearchableComboBox
              options={employees}
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
              placeholder="Select employee..."
              searchPlaceholder="Search employees..."
            />
          </div>
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Select Date</Label>
            <div className="flex items-center gap-2">


              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex-shrink-0"
                onClick={handlePreviousDay}
                title="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-2 py-1 justify-start text-left font-normal bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 text-sm">
                    <CalendarIcon className="mr-1 h-3 w-3 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-slate-900 dark:text-slate-200 font-medium text-sm">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800" align="start">
                  <MultiViewCalendar
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      setIsCalendarOpen(false)
                    }}
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex-shrink-0"
                onClick={handleNextDay}
                title="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Overtime Records</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading overtime data...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">Employee Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">Work Date</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">Shift Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">Worked Hours</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-200">Salary</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700">{record.employeeName}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{record.workDate}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{record.overtimeShiftName}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{record.otMinutes}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">₹{record.otAmount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                      No overtime records found for the selected date and employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}