'use client'

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
  SHIFT_START: { bg: 'bg-red-100', text: 'text-red-800' },
  SHIFT_END:   { bg: 'bg-orange-100', text: 'text-orange-800' },
  ABSENT:      { bg: 'bg-slate-100', text: 'text-slate-800' },
  EARLY_LEAVE: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  DEFAULT:     { bg: 'bg-blue-100', text: 'text-blue-800' },
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
  const [pageSize, setPageSize] = useState(100)

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
          `http://13.206.112.19:8080/api/warnings/by-range?${params.toString()}`,
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
  const endItem   = Math.min((pageNo + 1) * pageSize, totalElements)

  // Compute totalPages client-side to guard against stale backend values
  const computedTotalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pageSize)
  const isFirstPage = pageNo === 0
  const isLastPage  = endItem >= totalElements

  return (
    <div className="w-full space-y-6 px-6 py-8">
      {/* ── Filters + Pagination Controls ─────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end justify-between">

          {/* Left: filters */}
          <div className="flex flex-wrap gap-4 items-end">
            {/* Employee */}
            <div className="space-y-1 flex-shrink-0">
              <Label className="text-slate-700 font-semibold text-sm">Employee</Label>
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
              <Label className="text-slate-700 font-semibold text-sm">Start Date</Label>
              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-2 py-1 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-900 text-sm"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3 text-slate-600 flex-shrink-0" />
                    <span className="text-slate-900 font-medium text-sm">
                      {startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <Label className="text-slate-700 font-semibold text-sm">End Date</Label>
              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-2 py-1 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-900 text-sm"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3 text-slate-600 flex-shrink-0" />
                    <span className="text-slate-900 font-medium text-sm">
                      {endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                <Label className="text-slate-700 font-semibold text-sm">Total Records</Label>
                <div className="h-9 flex items-center px-3 rounded-md border border-slate-300 bg-slate-50">
                  <span className="text-sm font-bold text-slate-800">{totalElements.toLocaleString()}</span>
                </div>
              </div>
            )}

            {computedTotalPages > 0 && (
              <>
                {/* Rows per page */}
                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold text-sm">Rows per page</Label>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => { setPageSize(Number(v)); setPageNo(0) }}
                  >
                    <SelectTrigger className="h-9 w-24 text-sm bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page info + 4 navigation buttons */}
                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold text-sm">
                    Page {pageNo + 1} of {computedTotalPages}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline" size="icon"
                      className="h-9 w-9 border-slate-300 bg-white"
                      onClick={() => setPageNo(0)}
                      disabled={isFirstPage}
                      title="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      className="h-9 w-9 border-slate-300 bg-white"
                      onClick={() => setPageNo((p) => Math.max(0, p - 1))}
                      disabled={isFirstPage}
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      className="h-9 w-9 border-slate-300 bg-white"
                      onClick={() => setPageNo((p) => Math.min(computedTotalPages - 1, p + 1))}
                      disabled={isLastPage}
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      className="h-9 w-9 border-slate-300 bg-white"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Warning Records</h2>
          {!loading && totalElements > 0 && (
            <span className="text-sm text-slate-500">
              Showing {startItem}–{endItem} of {totalElements.toLocaleString()} records
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading warning data...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 border-r border-slate-200">Employee Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 border-r border-slate-200">Warning Date</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-900 border-r border-slate-200">Expected Time</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-900 border-r border-slate-200">Actual Time</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-900 border-r border-slate-200">Late Minutes</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-900 border-r border-slate-200">Penalty Applied</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">Warning Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((record) => {
                    const badgeStyle = getWarningBadge(record.warningType)
                    return (
                      <tr key={record.id} className="border-b border-slate-200 hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 border-r border-slate-200">{record.employeeName}</td>
                        <td className="px-6 py-4 text-slate-700 border-r border-slate-200">{record.warningDate}</td>
                        <td className="px-6 py-4 text-center border-r border-slate-200">
                          <span className="text-slate-700 font-medium">{record.expectedTime}</span>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-200">
                          <span className="text-slate-700 font-medium">{record.actualTime}</span>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-200">
                          <span className="text-slate-700 font-medium">{record.lateMinutes}</span>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-200">
                          {record.penaltyApplied ? (
                            <Badge className="bg-red-100 text-red-800 border-red-300">Yes</Badge>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${badgeStyle.bg} ${badgeStyle.text} border`}>
                            {record.warningType}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
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