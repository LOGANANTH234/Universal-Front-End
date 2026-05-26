'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { MultiViewCalendar } from '@/components/multi-view-calendar'

interface AttendanceSummaryRecord {
  id: number
  employeeId: string
  employeeName: string
  attendanceDate: string
  firstIn: string
  lastOut: string
  workedMinutes: string | number
  breakMinutes: string | number
  liveStatus?: string
}

export default function DailyAttendanceSummaryScreen() {
  const { auth } = useAuth()

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const [summaryData, setSummaryData]                 = useState<AttendanceSummaryRecord[]>([])
  const [uniqueEmployeeNames, setUniqueEmployeeNames] = useState<string[]>([])

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [startDate, setStartDate]           = useState(todayStr)
  const [endDate, setEndDate]               = useState(todayStr)

  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
  const [isEndCalendarOpen, setIsEndCalendarOpen]     = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const startDateObj = parseISO(startDate)
  const endDateObj   = parseISO(endDate)

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth?.token || !startDate || !endDate) return

    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          page: '0',
          size: '1000000',
        })

        const res = await fetch(
          `http://localhost:8080/api/live-attendance/summary-history?${params}`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        )
        if (!res.ok) throw new Error(`API error: ${res.statusText}`)

        const page = await res.json()

        setSummaryData(page.content || [])
        setUniqueEmployeeNames(
          Array.from(new Set((page.content || []).map((r: AttendanceSummaryRecord) => r.employeeName))).sort() as string[]
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setSummaryData([])
      } finally {
        setIsLoading(false)
      }
    }

    run()
  }, [auth, startDate, endDate])

  // Client-side employee filter
  const filteredData = summaryData.filter(r =>
    employeeFilter === 'all' || r.employeeName === employeeFilter
  )

  const formatDateTime = (s: string) => {
    if (!s) return 'N/A'
    try { return format(parseISO(s), 'MMM dd, yyyy HH:mm') } catch { return s }
  }

  const formatDuration = (val: string | number | undefined) => {
    if (val === null || val === undefined || val === '') return '—'
    if (typeof val === 'string') {
      const cleaned = val.replace(':', ' ').trim()
      if (cleaned === '0h 0m' || cleaned === '0h 00m') return '—'
      return cleaned
    }
    if (val === 0) return '—'
    const h = Math.floor(val / 60), m = val % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  return (
    <div className="w-full space-y-6 p-6">

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Employee */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 font-semibold text-sm">Employee</Label>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="h-9 w-44 text-sm bg-white border-slate-300">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {uniqueEmployeeNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 font-semibold text-sm">From Date</Label>
            <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 px-2 py-1 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-900 text-sm">
                  <CalendarIcon className="mr-1 h-3 w-3 text-slate-600 flex-shrink-0" />
                  <span className="text-slate-900 font-medium text-sm">{format(startDateObj, 'MMM dd, yyyy')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <MultiViewCalendar
                  selected={startDateObj}
                  onSelect={(date) => { setStartDate(format(date, 'yyyy-MM-dd')); setIsStartCalendarOpen(false) }}
                  fromYear={2020} toYear={2030}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 font-semibold text-sm">To Date</Label>
            <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 px-2 py-1 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-900 text-sm">
                  <CalendarIcon className="mr-1 h-3 w-3 text-slate-600 flex-shrink-0" />
                  <span className="text-slate-900 font-medium text-sm">{format(endDateObj, 'MMM dd, yyyy')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <MultiViewCalendar
                  selected={endDateObj}
                  onSelect={(date) => { setEndDate(format(date, 'yyyy-MM-dd')); setIsEndCalendarOpen(false) }}
                  fromYear={2020} toYear={2030}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Total record count */}
          {!isLoading && filteredData.length > 0 && (
            <div className="space-y-1 flex-shrink-0">
              <Label className="text-slate-700 font-semibold text-sm">Total Records</Label>
              <div className="h-9 flex items-center px-3 rounded-md border border-slate-300 bg-slate-50">
                <span className="text-sm font-bold text-slate-800">{filteredData.length.toLocaleString()}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4 text-red-800">{error}</div>
        </Card>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">Attendance Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Employee Name</TableHead>
                <TableHead>Attendance Date</TableHead>
                <TableHead>First In</TableHead>
                <TableHead>Last Out</TableHead>
                <TableHead className="text-right">Worked</TableHead>
                <TableHead className="text-right">Break</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((record, index) => (
                  <TableRow key={record.id || index} className="h-14">
                    <TableCell className="font-medium py-4">{record.employeeName}</TableCell>
                    <TableCell className="py-4">
                      {record.attendanceDate ? format(parseISO(record.attendanceDate), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="py-4">{formatDateTime(record.firstIn)}</TableCell>
                    <TableCell className="py-4">{formatDateTime(record.lastOut)}</TableCell>
                    <TableCell className="text-right py-4 font-mono">{formatDuration(record.workedMinutes)}</TableCell>
                    <TableCell className="text-right py-4 font-mono">{formatDuration(record.breakMinutes)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No attendance records found for the selected criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}