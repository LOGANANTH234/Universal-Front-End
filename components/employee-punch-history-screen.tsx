'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useHasModule, MODULES } from '@/lib/permission-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, CalendarIcon, ArrowUp, ArrowDown, X, ChevronDown, GripVertical } from 'lucide-react'
import { format, parseISO, startOfDay } from 'date-fns'
import { useAuth } from '@/lib/contexts/auth-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MultiViewCalendar } from './multi-view-calendar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PunchData {
  id: string
  employeeId: string
  employeeName: string
  type: 'IN' | 'OUT'
  time: string
  date: string
  shift: string
  source: string
  note?: string
  status: 'valid' | 'missing-out' | 'overlap' | 'edited'
}

type SortColumn = 'employeeName' | 'date' | 'time'
type SortDirection = 'asc' | 'desc'

interface SortEntry {
  column: SortColumn
  direction: SortDirection
}

const PUNCH_SOURCES = ['HIKVISION', 'MANUAL', 'HIKVISION_MANUAL', 'SYSTEM_AUTO'] as const

const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  employeeName: 'Employee',
  date: 'Date',
  time: 'Time',
}

const DEFAULT_SORTS: SortEntry[] = [{ column: 'date', direction: 'asc' }]

// ── SortableHeader ────────────────────────────────────────────────────────────

function SortableHeader({
  column,
  label,
  sorts,
  onSort,
}: {
  column: SortColumn
  label: string
  sorts: SortEntry[]
  onSort: (col: SortColumn, dir: SortDirection | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const idx = sorts.findIndex(s => s.column === column)
  const isActive = idx !== -1
  const entry = isActive ? sorts[idx] : null
  const priority = isActive ? idx + 1 : null

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 font-semibold text-xs uppercase tracking-wide select-none rounded px-1 py-0.5 transition-colors ${
          isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {label}

        {/* Priority badge — only shown when multiple sorts are active */}
        {isActive && sorts.length > 1 && (
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold leading-none">
            {priority}
          </span>
        )}

        {isActive ? (
          entry!.direction === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-blue-600" />
          ) : (
            <ArrowDown className="w-3 h-3 text-blue-600" />
          )
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-md shadow-lg py-1 min-w-[148px]">
          <button
            onClick={() => { onSort(column, 'asc'); setOpen(false) }}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${
              isActive && entry!.direction === 'asc' ? 'text-blue-600 font-medium' : 'text-slate-700'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Sort ascending
          </button>
          <button
            onClick={() => { onSort(column, 'desc'); setOpen(false) }}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${
              isActive && entry!.direction === 'desc' ? 'text-blue-600 font-medium' : 'text-slate-700'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Sort descending
          </button>
          {isActive && (
            <>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => { onSort(column, null); setOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Remove sort
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Draggable sort pill ───────────────────────────────────────────────────────

function SortPill({
  entry,
  index,
  total,
  onRemove,
  onToggleDir,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  entry: SortEntry
  index: number
  total: number
  onRemove: () => void
  onToggleDir: () => void
  onDragStart: (i: number) => void
  onDragOver: (e: React.DragEvent, i: number) => void
  onDrop: (i: number) => void
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(e, index) }}
      onDrop={() => onDrop(index)}
      className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full cursor-grab active:cursor-grabbing select-none"
    >
      {total > 1 && (
        <GripVertical className="w-3 h-3 text-blue-400 flex-shrink-0" />
      )}

      {/* Priority badge */}
      {total > 1 && (
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold leading-none flex-shrink-0">
          {index + 1}
        </span>
      )}

      <span>{SORT_COLUMN_LABELS[entry.column]}</span>

      {/* Toggle direction */}
      <button
        onClick={onToggleDir}
        className="hover:text-blue-900 transition-colors flex items-center"
        aria-label={`Toggle direction for ${SORT_COLUMN_LABELS[entry.column]}`}
      >
        {entry.direction === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )}
      </button>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:text-blue-900 transition-colors"
        aria-label={`Remove sort by ${SORT_COLUMN_LABELS[entry.column]}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmployeePunchHistoryScreen() {
  const { auth } = useAuth()
  const hasModuleAccess = useHasModule(MODULES.VIEW_EDIT_PUNCHES)

  const today = new Date().toISOString().split('T')[0]

  const [punchData, setPunchData]                     = useState<PunchData[]>([])
  const [uniqueEmployeeNames, setUniqueEmployeeNames] = useState<string[]>([])

  const [employeeName, setEmployeeName] = useState('all')
  const [typeFilter, setTypeFilter]     = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate]     = useState(today)

  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
  const [isEndCalendarOpen, setIsEndCalendarOpen]     = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Multi-sort: ordered array, index 0 = primary sort
  const [sorts, setSorts] = useState<SortEntry[]>(DEFAULT_SORTS)

  // Drag-and-drop ref
  const dragIdx = useRef<number | null>(null)

  const startDateObj = startOfDay(parseISO(startDate))
  const endDateObj   = startOfDay(parseISO(endDate))

  // ── sort handlers ─────────────────────────────────────────────────────────

  /**
   * Called from column header dropdowns.
   * - dir === null  → remove this column from the sort list
   * - dir !== null, column already present → update its direction in-place
   * - dir !== null, column not present     → append as lowest-priority sort
   */
  const handleSort = useCallback((col: SortColumn, dir: SortDirection | null) => {
    setSorts(prev => {
      const existing = prev.findIndex(s => s.column === col)
      if (dir === null) {
        const next = prev.filter(s => s.column !== col)
        return next.length > 0 ? next : DEFAULT_SORTS
      }
      if (existing !== -1) {
        return prev.map((s, i) => i === existing ? { ...s, direction: dir } : s)
      }
      return [...prev, { column: col, direction: dir }]
    })
  }, [])

  const handleRemovePill = useCallback((index: number) => {
    setSorts(prev => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : DEFAULT_SORTS
    })
  }, [])

  // Click the arrow on a pill to flip its direction
  const handleToggleDir = useCallback((index: number) => {
    setSorts(prev =>
      prev.map((s, i) =>
        i === index ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' } : s
      )
    )
  }, [])

  const handleClearAllSorts = useCallback(() => setSorts(DEFAULT_SORTS), [])

  // Drag-to-reorder pills
  const handleDragStart = useCallback((i: number) => { dragIdx.current = i }, [])
  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault() }, [])
  const handleDrop      = useCallback((targetIdx: number) => {
    const from = dragIdx.current
    if (from === null || from === targetIdx) return
    setSorts(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
    dragIdx.current = null
  }, [])

  // ── server fetch ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!auth?.token || !startDate || !endDate) return
    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const url =
          `http://localhost:8080/api/punch/history` +
          `?startDate=${startDate}&endDate=${endDate}&page=0&size=1000000`
        const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } })
        if (!res.ok) throw new Error(`API error: ${res.statusText}`)
        const page = await res.json()
        const mapped: PunchData[] = (page.content || []).map((p: any) => ({
          id:           p.id?.toString() || Date.now().toString(),
          employeeId:   p.employeeId?.toString() || '',
          employeeName: p.employeeName || 'Unknown',
          date:         p.attendanceDate || p.date || '',
          time:         p.punchTime || p.time || '',
          type:         p.punchType === 'IN' || p.type === 'IN' ? 'IN' : 'OUT',
          source:       p.source || 'SYSTEM_AUTO',
          shift:        p.shift || 'Morning',
          status:       p.status || 'valid',
          note:         p.note || '',
        }))
        setPunchData(mapped)
        setUniqueEmployeeNames(Array.from(new Set(mapped.map(p => p.employeeName))).sort())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch punch data')
        setPunchData([])
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [auth, startDate, endDate])

  // ── filter + multi-sort ───────────────────────────────────────────────────

  const getValue = (punch: PunchData, col: SortColumn): string => {
    switch (col) {
      case 'employeeName': return punch.employeeName.toLowerCase()
      case 'date':         return punch.date
      case 'time':         return punch.time
    }
  }

  const filteredPunches = useMemo(() => {
    const filtered = punchData.filter(p => {
      if (employeeName !== 'all' && p.employeeName !== employeeName) return false
      if (typeFilter   !== 'all' && p.type         !== typeFilter)   return false
      if (sourceFilter !== 'all' && p.source        !== sourceFilter) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      for (const { column, direction } of sorts) {
        const aVal = getValue(a, column)
        const bVal = getValue(b, column)
        if (aVal < bVal) return direction === 'asc' ? -1 : 1
        if (aVal > bVal) return direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [punchData, employeeName, typeFilter, sourceFilter, sorts])

  const isDefaultSort =
    sorts.length === 1 && sorts[0].column === 'date' && sorts[0].direction === 'asc'

  // ── group punches by date (preserving sort order) ─────────────────────────
  const groupedByDate = useMemo(() => {
    const groups: { date: string; punches: PunchData[] }[] = []
    const seen = new Map<string, number>()
    for (const punch of filteredPunches) {
      const key = punch.date || 'unknown'
      if (seen.has(key)) {
        groups[seen.get(key)!].punches.push(punch)
      } else {
        seen.set(key, groups.length)
        groups.push({ date: key, punches: [punch] })
      }
    }
    return groups
  }, [filteredPunches])

  // ── access guard ──────────────────────────────────────────────────────────

  if (!hasModuleAccess) {
    return (
      <div className="p-6">
        <Card className="border-amber-200 bg-amber-50">
          <div className="p-4 text-amber-800">You do not have access to this module.</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Employee Punch History</h2>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Employee */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 font-semibold text-sm">Employee</Label>
            <Select value={employeeName} onValueChange={setEmployeeName}>
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
            <Label className="text-slate-700 font-semibold text-sm">Start Date</Label>
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
            <Label className="text-slate-700 font-semibold text-sm">End Date</Label>
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

          {/* Type */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 font-semibold text-sm">Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-32 text-sm bg-white border-slate-300">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IN">IN</SelectItem>
                <SelectItem value="OUT">OUT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-1 flex-shrink-0">
            <Label className="text-slate-700 font-semibold text-sm">Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9 w-44 text-sm bg-white border-slate-300">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {PUNCH_SOURCES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Records */}
          {!isLoading && filteredPunches.length > 0 && (
            <div className="space-y-1 flex-shrink-0">
              <Label className="text-slate-700 font-semibold text-sm">Total Records</Label>
              <div className="h-9 flex items-center px-3 rounded-md border border-slate-300 bg-slate-50">
                <span className="text-sm font-bold text-slate-800">{filteredPunches.length.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Sort pills ──────────────────────────────────────────────────── */}
        {!isDefaultSort && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Sorted by:</span>
            {sorts.map((entry, i) => (
              <SortPill
                key={entry.column}
                entry={entry}
                index={i}
                total={sorts.length}
                onRemove={() => handleRemovePill(i)}
                onToggleDir={() => handleToggleDir(i)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
            <button
              onClick={handleClearAllSorts}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2 ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4 text-red-800">{error}</div>
        </Card>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">Punch Records</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>
                  <SortableHeader column="employeeName" label="Employee" sorts={sorts} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader column="date" label="Date" sorts={sorts} onSort={handleSort} />
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600">
                  Type
                </TableHead>
                <TableHead>
                  <SortableHeader column="time" label="Time" sorts={sorts} onSort={handleSort} />
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600">
                  Source
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  </TableCell>
                </TableRow>
              ) : groupedByDate.length > 0 ? (
                groupedByDate.map(({ date, punches: dayPunches }, groupIdx) => {
                  const dateLabel = date && date !== 'unknown'
                    ? format(parseISO(date), 'EEEE, MMM dd yyyy')
                    : 'Unknown Date'
                  const isFirstGroup = groupIdx === 0

                  return (
                    <>
                      {/* ── Date separator row ── */}
                      <TableRow key={`date-header-${date}`} className={`${!isFirstGroup ? 'border-t-2 border-slate-300' : ''}`}>
                        <TableCell
                          colSpan={5}
                          className="py-2 px-4 bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                              {dateLabel}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {dayPunches.length} {dayPunches.length === 1 ? 'record' : 'records'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* ── Data rows for this date ── */}
                      {dayPunches.map(punch => (
                        <TableRow key={punch.id} className="h-12 border-t border-slate-100">
                          <TableCell className="font-medium py-3">{punch.employeeName}</TableCell>
                          <TableCell className="text-sm py-3 text-slate-500">
                            {punch.date ? format(parseISO(punch.date), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              punch.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {punch.type}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono py-3">{punch.time || 'N/A'}</TableCell>
                          <TableCell className="py-3">
                            <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {punch.source}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No punch records found for the selected criteria
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