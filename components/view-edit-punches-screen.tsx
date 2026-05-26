'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useHasAction, useHasModule, MODULES, ACTIONS } from '@/lib/permission-utils'
import { useToast } from '@/hooks/use-toast'
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
import { AlertCircle, Plus, Edit2, Trash2, RefreshCw, Loader2, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react'
import PunchAddModal from './punch-add-modal'
import PunchEditModal from './punch-edit-modal'
import PunchDeleteModal from './punch-delete-modal'
import { type Punch } from '@/lib/punch-validation'
import { mockEmployees } from '@/lib/mock-employees'
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns'
import { useAuth } from '@/lib/contexts/auth-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MultiViewCalendar } from './multi-view-calendar'

interface PunchData extends Punch {
  employeeName: string
  status: 'valid' | 'missing-out' | 'overlap' | 'edited'
}

type DateQuickOption = 'today' | 'yesterday' | 'custom'

interface Filters {
  employeeName: string
  dateQuick: DateQuickOption
  customDate: string
  source: string
}

type QuickDateOption = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth'

type DateFilterMode = 'single' | 'range'

const MOCK_EMPLOYEES = mockEmployees

export default function ViewEditPunchesScreen() {
  const { auth } = useAuth()
  const { toast } = useToast()

  // Permission checks
  const hasModuleAccess = useHasModule(MODULES.VIEW_EDIT_PUNCHES)
  const canViewPunches = useHasAction(MODULES.VIEW_EDIT_PUNCHES, ACTIONS.PUNCHES_VIEW)
  const canEditPunches = useHasAction(MODULES.VIEW_EDIT_PUNCHES, ACTIONS.PUNCHES_EDIT)
  const isReadOnly = canViewPunches && !canEditPunches

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Loading state
  const [operationLoading, setOperationLoading] = useState<{
    show: boolean
    message: string
  }>({ show: false, message: '' })

  const [punchData, setPunchData] = useState<PunchData[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      type: 'IN',
      time: '09:00',
      date: yesterday,
      shift: 'Morning',
      source: 'Device',
      note: 'Clock in',
      status: 'valid',
    },
    {
      id: '2',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      type: 'OUT',
      time: '18:00',
      date: yesterday,
      shift: 'Morning',
      source: 'Device',
      note: 'Clock out',
      status: 'valid',
    },
    {
      id: '3',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      type: 'IN',
      time: '08:30',
      date: yesterday,
      shift: 'Morning',
      source: 'Device',
      note: 'Clock in',
      status: 'valid',
    },
    {
      id: '4',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      type: 'OUT',
      time: '17:30',
      date: yesterday,
      shift: 'Morning',
      source: 'Device',
      note: 'Clock out',
      status: 'valid',
    },
    {
      id: '5',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      type: 'IN',
      time: '09:15',
      date: today,
      shift: 'Morning',
      source: 'Device',
      note: 'Clocked in',
      status: 'valid',
    },
    {
      id: '6',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      type: 'IN',
      time: '08:45',
      date: today,
      shift: 'Morning',
      source: 'Device',
      note: 'Clocked in',
      status: 'valid',
    },
  ])

  const todayDate = new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState<string>(todayDate)
  const [apiPunchData, setApiPunchData] = useState<PunchData[]>([])

  // Employee list fetched from /api/employees/getAllEmployees
  const [employeeList, setEmployeeList] = useState<{ id: string; name: string }[]>([])
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false)

  const [filters, setFilters] = useState<Filters>({
    employeeName: '',
    dateQuick: 'today',
    customDate: todayDate,
    source: 'all',
  })

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPunch, setSelectedPunch] = useState<PunchData | null>(null)
  const [changes, setChanges] = useState<Map<string, PunchData>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const employees = mockEmployees

  // Fetch employees using a confirmed valid token, then auto-select the first one
  const fetchEmployees = async (token: string) => {
    console.log('[v0] fetchEmployees triggered')
    setIsEmployeesLoading(true)
    try {
      const response = await fetch('http://localhost:8080/api/employees/getAllPermittedEmployees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('[v0] fetchEmployees response status:', response.status)
      if (!response.ok) throw new Error(`Failed to fetch employees: ${response.statusText}`)
      const data = await response.json()
      console.log('[v0] fetchEmployees raw data length:', data?.length)

      const mapped = (data || [])
        .map((emp: any) => ({
          employeeId: emp.employeeId?.toString() || emp.id?.toString() || '',
          name:
            emp.name ||
            emp.employeeName ||
            (emp.firstName || emp.lastName
              ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
              : ''),
        }))
        .filter((e: any) => e.name)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

      setEmployeeList(mapped)
      console.log('[v0] employeeList set with', mapped.length, 'entries')

      // Auto-select the first employee as the default filter
      if (mapped.length > 0) {
        setFilters(prev => ({ ...prev, employeeName: mapped[0].name }))
      }
    } catch (err) {
      console.error('[v0] Error fetching employees:', err)
    } finally {
      setIsEmployeesLoading(false)
    }
  }

  // Date navigation handlers
  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate)
    const previousDate = subDays(currentDate, 1)
    const newDateStr = previousDate.toISOString().split('T')[0]
    setSelectedDate(newDateStr)
    setFilters(f => ({ ...f, customDate: newDateStr }))
    fetchPunchData(newDateStr)
  }

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate)
    const nextDate = addDays(currentDate, 1)
    const newDateStr = nextDate.toISOString().split('T')[0]
    setSelectedDate(newDateStr)
    setFilters(f => ({ ...f, customDate: newDateStr }))
    fetchPunchData(newDateStr)
  }

  const handleDateSelect = (date: Date) => {
    const newDateStr = format(date, 'yyyy-MM-dd')
    setSelectedDate(newDateStr)
    setFilters(f => ({ ...f, customDate: newDateStr }))
    setIsCalendarOpen(false)
    fetchPunchData(newDateStr)
  }

  // Convert selectedDate string to Date object for calendar
  const selectedDateObj = startOfDay(parseISO(selectedDate))

  const fetchPunchData = async (dateStr: string, showPageLoader = true) => {
    setIsLoading(true)
    if (showPageLoader) setIsPageLoading(true)
    setError(null)
    try {
      if (!auth || !auth.token) {
        console.log('[v0] No auth context or token available')
        setError('Unauthorized – Please login again.')
        setIsLoading(false)
        return
      }

      const token = auth.token
      const url = `/api/punch/${dateStr}`
      console.log('[v0] Fetching from URL:', url)
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      console.log('[v0] Response status:', response.status, response.statusText)
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[v0] API response data:', data)

      const punchesWithEmployeeNames: PunchData[] = (data || []).map((punch: any) => {
        const employeeId = punch.employeeId?.toString() || ''
        return {
          id: punch.id?.toString() || Date.now().toString(),
          employeeId: employeeId,
          employeeName: punch.employeeName || 'Unknown',
          date: punch.attendanceDate || punch.date || '',
          time: punch.punchTime || punch.time || '',
          type: punch.punchType === 'IN' || punch.type === 'IN' ? 'IN' : 'OUT',
          source: punch.source || 'System',
          shift: punch.shift || 'Morning',
          status: punch.status || 'valid',
        }
      })

      setApiPunchData(punchesWithEmployeeNames)

      // Fetch employees once using the same confirmed valid token.
      // Only runs on first load (employeeList still empty).
      if (employeeList.length === 0) {
        fetchEmployees(token)
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch punch data'
      console.log('[v0] Error fetching punch data:', errorMsg, err)
      setError(errorMsg)
      setApiPunchData([])
    } finally {
      setIsLoading(false)
      setIsPageLoading(false)
    }
  }

  useEffect(() => {
    if (auth && auth.token) {
      console.log('[v0] Component mounted with auth, calling fetchPunchData with date:', todayDate)
      fetchPunchData(todayDate)
    } else if (auth === null) {
      console.log('[v0] Auth loading complete but no token available')
    }
  }, [auth])

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr)
    fetchPunchData(dateStr)
  }

  const convertTo12Hour = (time: string): string => {
    if (time === '--') return '--'
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const calculateDailySummary = (punches: PunchData[]) => {
    if (punches.length === 0) {
      return { firstIn: '--', lastOut: '--', firstInDate: '--', lastOutDate: '--', workedMins: 0, breakMins: 0 }
    }

    const inPunches = punches.filter(p => p.type === 'IN').sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })
    const outPunches = punches.filter(p => p.type === 'OUT').sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.time.localeCompare(a.time)
    })

    const firstInPunch = inPunches.length > 0 ? inPunches[0] : null
    const lastOutPunch = outPunches.length > 0 ? outPunches[0] : null

    const firstIn = firstInPunch ? convertTo12Hour(firstInPunch.time) : '--'
    const lastOut = lastOutPunch ? convertTo12Hour(lastOutPunch.time) : '--'

    return {
      firstIn,
      lastOut,
      firstInDate: firstInPunch?.date || '--',
      lastOutDate: lastOutPunch?.date || '--',
      workedMins: 0,
      breakMins: 0,
    }
  }

  const applyQuickDateFilter = (option: QuickDateOption) => {
    let dateFrom: Date, dateTo: Date
    const todayNow = new Date()
    if (option === 'today') {
      dateFrom = startOfDay(todayNow)
      dateTo = endOfDay(todayNow)
    } else if (option === 'yesterday') {
      const yesterdayDate = new Date(todayNow.getTime() - 24 * 60 * 60 * 1000)
      dateFrom = startOfDay(yesterdayDate)
      dateTo = endOfDay(yesterdayDate)
    } else if (option === 'thisWeek') {
      dateFrom = startOfWeek(todayNow)
      dateTo = endOfWeek(todayNow)
    } else {
      dateFrom = startOfMonth(todayNow)
      dateTo = endOfMonth(todayNow)
    }

    setFilters(prev => ({
      ...prev,
      dateQuick: option,
      customDate: '',
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    }))
  }

  // Filter punches by selected employee name and source
  const filteredPunches = useMemo(() => {
    return apiPunchData.filter(punch => {
      if (filters.employeeName && punch.employeeName !== filters.employeeName) return false
      if (filters.source !== 'all' && punch.source !== filters.source) return false
      return true
    })
  }, [apiPunchData, filters])

  const handleAddPunch = (punch: Omit<Punch, 'id'>) => {
    if (!canEditPunches) return
    setOperationLoading({ show: true, message: 'Adding punch...' })
    try {
      const newPunch: PunchData = {
        ...punch,
        id: Date.now().toString(),
        employeeName: employees.find(e => e.id === (punch as any).employeeId)?.name || 'Unknown',
        status: 'edited',
      }
      const newChanges = new Map(changes)
      newChanges.set(newPunch.id, newPunch)
      setChanges(newChanges)
      setApiPunchData(prev => [...prev, newPunch])
    } finally {
      setOperationLoading({ show: false, message: '' })
      setTimeout(() => fetchPunchData(selectedDate, false), 500)
    }
  }

  const handleAddPunchPair = (inPunch: Omit<Punch, 'id'>, outPunch: Omit<Punch, 'id'>) => {
    setOperationLoading({ show: true, message: 'Adding punch pair...' })
    try {
      const inId = Date.now().toString()
      const outId = (Date.now() + 1).toString()

      const newInPunch: PunchData = {
        ...inPunch,
        id: inId,
        employeeName: employees.find(e => e.id === (inPunch as any).employeeId)?.name || 'Unknown',
        status: 'edited',
      }

      const newOutPunch: PunchData = {
        ...outPunch,
        id: outId,
        employeeName: employees.find(e => e.id === (outPunch as any).employeeId)?.name || 'Unknown',
        status: 'edited',
      }

      setApiPunchData(prev => [...prev, newInPunch, newOutPunch])

      const newChanges = new Map(changes)
      newChanges.set(inId, newInPunch)
      newChanges.set(outId, newOutPunch)
      setChanges(newChanges)

      setIsAddModalOpen(false)
    } finally {
      setOperationLoading({ show: false, message: '' })
      setTimeout(() => fetchPunchData(selectedDate, false), 500)
    }
  }

  const handleEditPunch = (punchId: string, punch: Punch) => {
    if (!canEditPunches) return
    setOperationLoading({ show: true, message: 'Updating punch...' })
    try {
      const newChanges = new Map(changes)
      const existing = apiPunchData.find(p => p.id === punchId)
      if (existing) {
        const updated: PunchData = {
          ...existing,
          ...punch,
          status: 'edited',
        }
        newChanges.set(punchId, updated)
        setChanges(newChanges)
        setApiPunchData(prev => prev.map(p => p.id === punchId ? updated : p))
      }
      setIsEditModalOpen(false)
    } finally {
      setOperationLoading({ show: false, message: '' })
      setTimeout(() => fetchPunchData(selectedDate, false), 500)
    }
  }

  const handleDeletePunch = async (punchId: string) => {
    if (!canEditPunches) return
    setOperationLoading({ show: true, message: 'Deleting punch...' })

    try {
      if (!auth || !auth.token) {
        console.log('[v0] No auth context or token available for delete')
        throw new Error('Unauthorized – Please login again.')
      }

      const token = auth.token
      const url = `http://localhost:8080/api/punch/delete/${punchId}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMsg = errorData?.message || errorData?.validationMessages?.[0] || `Delete failed: ${response.statusText}`
        console.log('[v0] Delete API error:', errorMsg)
        throw new Error(errorMsg)
      }

      setApiPunchData(prev => prev.filter(p => p.id !== punchId))
      setIsDeleteModalOpen(false)
      setTimeout(() => fetchPunchData(selectedDate, false), 500)
    } catch (error) {
      console.error('[v0] Error deleting punch:', error)
      const errorMsg = error instanceof Error ? error.message : 'Something went wrong. Please try again.'

      try {
        const messages = JSON.parse(errorMsg)
        if (Array.isArray(messages)) {
          throw error
        }
      } catch {
        // Not validation messages, treat as generic error
      }

      throw error
    } finally {
      setOperationLoading({ show: false, message: '' })
    }
  }

  const handleSaveChanges = () => {
    if (!canEditPunches) return
    if (changes.size === 0) {
      alert('No changes to save')
      return
    }

    const updated = Array.from(changes.values())
    setApiPunchData(prev => {
      const map = new Map(prev.map(p => [p.id, p]))
      updated.forEach(p => map.set(p.id, p))
      return Array.from(map.values())
    })
    setChanges(new Map())
    alert(`${changes.size} changes saved successfully`)
  }

  const handleResetChanges = () => {
    setSelectedDate(todayDate)
    setChanges(new Map())
    fetchPunchData(todayDate)
  }

  const handleLoadPunches = () => {
    fetchPunchData(selectedDate)
  }

  // PAGE LOADER — shown on initial load and date switches only
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Loading punch records...
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Please wait while we fetch the data
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">View & Edit Punches</h1>
          <p className="text-muted-foreground mt-1">Manage Employee Punch Records</p>
        </div>

        {/* Date Header with Navigation */}
        <div className="flex items-center gap-3 py-4 border-b border-slate-200 dark:border-slate-700">
          <Button
            onClick={handlePreviousDay}
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            disabled={isLoading}
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="gap-2 h-9 px-3 hover:bg-slate-100 dark:hover:bg-slate-800">
                <CalendarIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {format(selectedDateObj, 'EEEE, MMM dd, yyyy')}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <MultiViewCalendar
                selected={selectedDateObj}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleNextDay}
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            disabled={isLoading}
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>

          {/* Refresh button */}
          <Button
            onClick={handleLoadPunches}
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-500 dark:border-green-900 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Inputs row */}
        <div className="flex items-center gap-3">

          {/* Employee Filter */}
          <div className="w-48">
            <Select
              value={filters.employeeName}
              onValueChange={(value) => setFilters(prev => ({ ...prev, employeeName: value }))}
              disabled={isEmployeesLoading}
            >
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder={isEmployeesLoading ? 'Loading...' : 'Select Employee'} />
              </SelectTrigger>
              <SelectContent>
                {employeeList.map(emp => (
                  <SelectItem key={emp.id} value={emp.name}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="w-48">
            <Select
              value={filters.source}
              onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
            >
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="HIKVISION">HIKVISION</SelectItem>
                <SelectItem value="MANUAL">MANUAL</SelectItem>
                <SelectItem value="HIKVISION_MANUAL">HIKVISION_MANUAL</SelectItem>
                <SelectItem value="SYSTEM_AUTO">SYSTEM_AUTO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Button */}
          {canEditPunches && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="outline"
              className="h-9 gap-1 text-sm px-3 whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          )}

          {/* Reset Button */}
          {canEditPunches && (
            <Button
              onClick={handleResetChanges}
              variant="destructive"
              className="h-9 gap-1 text-sm px-3 whitespace-nowrap"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Punch Details Table */}
      {filteredPunches.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No punches found for the selected filters
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Source</TableHead>
                {canEditPunches && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPunches.map(punch => (
                <TableRow key={punch.id}>
                  <TableCell className="font-medium">{punch.employeeName}</TableCell>
                  <TableCell className="text-sm">
                    {punch.date ? format(parseISO(punch.date), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      punch.type === 'IN'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {punch.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{punch.time || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{punch.source}</TableCell>
                  {canEditPunches && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPunch(punch)
                            setIsEditModalOpen(true)
                          }}
                          className="gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => {
                            setSelectedPunch(punch)
                            setIsDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modals */}
      <PunchAddModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAdd={handleAddPunch}
        onAddPair={handleAddPunchPair}
        allPunches={apiPunchData}
        workDate={selectedDate}
        employeeId={
          filters.employeeName
            ? employeeList.find(e => e.name === filters.employeeName)?.employeeId ||
              apiPunchData.find(p => p.employeeName === filters.employeeName)?.employeeId
            : undefined
        }
        authToken={auth?.token}
        onRefresh={() => fetchPunchData(selectedDate, false)}
      />
      {selectedPunch && (
        <PunchEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          punch={selectedPunch}
          allPunches={apiPunchData}
          onSave={(updatedPunch) => handleEditPunch(selectedPunch.id, updatedPunch)}
          onRefresh={() => fetchPunchData(selectedDate, false)}
          workDate={selectedDate}
        />
      )}
      {selectedPunch && (
        <PunchDeleteModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          punch={selectedPunch}
          onConfirm={handleDeletePunch}
        />
      )}

      {/* Operation Loading Overlay */}
      {operationLoading.show && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-[70] flex items-center justify-center">
          <div className="bg-gradient-to-br from-card via-card to-card/95 rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 border border-border/50 backdrop-blur-md min-w-[320px] animate-in fade-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative">
                <svg className="w-20 h-20" viewBox="0 0 100 100">
                  <circle
                    className="text-muted/20"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-blue-500 animate-spin"
                    strokeWidth="8"
                    strokeDasharray="60 1000"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    style={{
                      animation: 'spin 2s linear infinite',
                      transformOrigin: '50px 50px',
                    }}
                  />
                </svg>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">{operationLoading.message}</p>
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}