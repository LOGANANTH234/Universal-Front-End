'use client'
import { API_BASE_URL } from "@/lib/branding-config"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { SearchableComboBox } from './searchable-combo-box'
import { MultiViewCalendar } from './multi-view-calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface WarningRecord {
  id: number
  employeeName: string
  warningDate: string
  lateMinutes: string
  penaltyApplied: boolean
  warningType: string
  expectedTime: string
  actualTime: string
}

interface ApiResponse {
  id: number
  employeeId: string
  employeeName: string
  warningDate: string
  lateMinutes: string
  penaltyApplied: boolean
  warningType: string
  expectedTime: string
  actualTime: string
}

// Spring Page<T> response shape
interface PageResponse {
  content: ApiResponse[]
  totalElements: number
  totalPages: number
  number: number       // current page (0-indexed)
  size: number
  first: boolean
  last: boolean
}

const WARNING_TYPE_BADGES: Record<string, { bg: string; text: string }> = {
  SHIFT_START: { bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-red-800 dark:text-red-300' },
  SHIFT_END: { bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-800 dark:text-orange-300' },
  ABSENT: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200' },
  EARLY_LEAVE: { bg: 'bg-yellow-100 dark:bg-yellow-950/60', text: 'text-yellow-800 dark:text-yellow-300' },
  DEFAULT: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300' },
}

const PAGE_SIZE_OPTIONS = [100, 200, 300, 400, 500]

const getWeekMonday = (): Date => {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const getWeekSaturday = (): Date => {
  const monday = getWeekMonday()
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  saturday.setHours(0, 0, 0, 0)
  return saturday
}

const toDateString = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function WarningsScreen() {
  const { auth } = useAuth()

  // Filters
  const [startDate, setStartDate] = useState(getWeekMonday())
  const [endDate, setEndDate] = useState(getWeekSaturday())
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)

  // Pagination
  const [pageNo, setPageNo] = useState(0)
  const [pageSize, setPageSize] = useState(10000)

  // Data
  const [data, setData] = useState<WarningRecord[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // All employees seen so far (across pages) for the combobox
  const [allEmployees, setAllEmployees] = useState<string[]>([])

  // Reset to page 0 when filters change
  useEffect(() => {
    setPageNo(0)
  }, [startDate, endDate, selectedEmployee])

  useEffect(() => {
    const fetchWarningsData = async () => {
      if (!auth?.token) {
        setError('Authentication token not available')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          from: toDateString(startDate),
          to: toDateString(endDate),
          pageNo: String(pageNo),
          size: String(pageSize),
        })

        const response = await fetch(
          `${API_BASE_URL}/api/warnings/by-range?${params.toString()}`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`)
        }

        const page: PageResponse = await response.json()

        const transformedData: WarningRecord[] = page.content.map((item) => ({
          id: item.id,
          employeeName: item.employeeName,
          warningDate: item.warningDate,
          lateMinutes: item.lateMinutes,
          penaltyApplied: item.penaltyApplied,
          warningType: item.warningType,
          expectedTime: item.expectedTime,
          actualTime: item.actualTime,
        }))

        setData(transformedData)
        setTotalElements(page.totalElements)
        setTotalPages(page.totalPages)

        // Accumulate unique employee names for the filter combobox
        setAllEmployees((prev) => {
          const merged = new Set([...prev, ...page.content.map((r) => r.employeeName)])
          return Array.from(merged).sort()
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        console.error('Error fetching warnings data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWarningsData()
  }, [startDate, endDate, pageNo, pageSize, auth?.token])

  // Client-side employee filter (within the current page)
  const filteredData = data.filter((record) =>
    selectedEmployee ? record.employeeName === selectedEmployee : true
  )

  const employees = useMemo(() => [
    { value: '', label: 'All Employees' },
    ...allEmployees.map((emp) => ({ value: emp, label: emp })),
  ], [allEmployees])

  const getWarningBadge = (warningType: string) =>
    WARNING_TYPE_BADGES[warningType] ?? WARNING_TYPE_BADGES.DEFAULT

  // Pagination helpers
  const startItem = totalElements === 0 ? 0 : pageNo * pageSize + 1
  const endItem = Math.min((pageNo + 1) * pageSize, totalElements)

  // Compute totalPages client-side to guard against stale backend values
  const computedTotalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pageSize)
  const isFirstPage = pageNo === 0
  const isLastPage = endItem >= totalElements

  return (
    <div className="w-full space-y-6 px-6 py-8 text-slate-900 dark:text-slate-100">
      {/* ── Filters + Pagination Controls ─────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end justify-between">

          {/* Left: filters */}
          <div className="flex flex-wrap gap-4 items-end">
            {/* Employee */}
            <div className="space-y-1 flex-shrink-0">
              <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Employee</Label>
              <SearchableComboBox
                options={employees}
                value={selectedEmployee}
                onValueChange={(v) => { setSelectedEmployee(v); setPageNo(0) }}
                placeholder="Select employee..."
                searchPlaceholder="Search employees..."
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1 flex-shrink-0">
              <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Start Date</Label>
              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-2 py-1 justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100 text-sm"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                      {startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="start">
                  <MultiViewCalendar
                    selected={startDate}
                    onSelect={(date) => { setStartDate(date); setIsStartCalendarOpen(false) }}
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-1 flex-shrink-0">
              <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">End Date</Label>
              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-2 py-1 justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100 text-sm"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                      {endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="start">
                  <MultiViewCalendar
                    selected={endDate}
                    onSelect={(date) => { setEndDate(date); setIsEndCalendarOpen(false) }}
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Right: total count + rows-per-page + 4-button page nav */}
          <div className="flex items-end gap-4 flex-shrink-0">

            {/* Total record count */}
            {!loading && totalElements > 0 && (
              <div className="space-y-1">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Total Records</Label>
                <div className="h-9 flex items-center px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{totalElements.toLocaleString()}</span>
                </div>
              </div>
            )}

            {computedTotalPages > 0 && (
              <>
                {/* Rows per page */}
                <div className="space-y-1">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Rows per page</Label>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => { setPageSize(Number(v)); setPageNo(0) }}
                  >
                    <SelectTrigger className="h-9 w-24 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page info + 4 navigation buttons */}
                <div className="space-y-1">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                    Page {pageNo + 1} of {computedTotalPages}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline" size="icon"
                      className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setPageNo(0)}
                      disabled={isFirstPage}
                      title="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setPageNo((p) => Math.max(0, p - 1))}
                      disabled={isFirstPage}
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setPageNo((p) => Math.min(computedTotalPages - 1, p + 1))}
                      disabled={isLastPage}
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setPageNo(computedTotalPages - 1)}
                      disabled={isLastPage}
                      title="Last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Warning Records</h2>
          {!loading && totalElements > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing {startItem}–{endItem} of {totalElements.toLocaleString()} records
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading warning data...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">Employee Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">Warning Date</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">Expected Time</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">Actual Time</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">Late Minutes</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">Penalty Applied</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-200">Warning Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((record) => {
                    const badgeStyle = getWarningBadge(record.warningType)
                    return (
                      <tr key={record.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">{record.employeeName}</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{record.warningDate}</td>
                        <td className="px-6 py-4 text-center border-r border-slate-200 dark:border-slate-800">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{record.expectedTime}</span>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-200 dark:border-slate-800">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{record.actualTime}</span>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-200 dark:border-slate-800">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{record.lateMinutes}</span>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-200 dark:border-slate-800">
                          {record.penaltyApplied ? (
                            <Badge className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-900/60">Yes</Badge>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${badgeStyle.bg} ${badgeStyle.text} border border-slate-200/80 dark:border-slate-700/80`}>
                            {record.warningType}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                      No warning records found for the selected filters.
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