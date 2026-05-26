'use client';

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import type { LiveAttendanceResponse, LiveAttendanceData } from '@/lib/attendance-types'

export function useLiveAttendance() {
  const { auth } = useAuth()
  const [data, setData] = useState<LiveAttendanceData[]>([])
  const [stats, setStats] = useState<LiveAttendanceResponse['stats'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!auth?.token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/live-attendance', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch live attendance: ${response.statusText}`)
      }

      const result: LiveAttendanceResponse = await response.json()
      
      // Transform API response to component format
      const parseHours = (timeStr: string): { hours: number; minutes: number } => {
        if (!timeStr) return { hours: 0, minutes: 0 }
        const hoursMatch = timeStr.match(/(\d+)h/)
        const minutesMatch = timeStr.match(/(\d+)m/)
        return {
          hours: hoursMatch ? parseInt(hoursMatch[1]) : 0,
          minutes: minutesMatch ? parseInt(minutesMatch[1]) : 0,
        }
      }

      const transformedData: LiveAttendanceData[] = result.employees.map((emp) => {
        const [shiftStart, shiftEnd] = emp.shiftTiming.split(' - ')
        const workedParsed = parseHours(emp.workedHours)
        const remainingParsed = parseHours(emp.remainingHours)
        
        // Transform punch details if available
        const punchDetails = emp.punchDetails?.map((punch) => ({
          id: punch.id.toString(),
          employeeId: punch.employeeId,
          employeeName: emp.employeeName,
          attendanceDate: punch.attendanceDate,
          punchType: punch.punchType,
          punchTime: punch.punchTime,
          source: punch.source,
        })) || []
        
        return {
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          employeeRole: emp.role,
          status: emp.status,
          clockInTime: emp.latestIn,
          latestPunchTime: emp.latestOut,
          workedHours: workedParsed.hours,
          workedMinutes: workedParsed.minutes,
          pay: 0,
          remainingHours: remainingParsed.hours,
          remainingMinutes: remainingParsed.minutes,
          shiftStartTime: shiftStart,
          shiftEndTime: shiftEnd,
          inside: emp.inside,
          lateBy: emp.lateBy,
          punchDetails,
        }
      })

      setData(transformedData)
      setStats(result.stats)
    } catch (err) {
      console.error('[v0] Error fetching live attendance:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch live attendance')
    } finally {
      setLoading(false)
    }
  }, [auth?.token])

  // Load initial data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, stats, loading, error, refetch: fetchData }
}
