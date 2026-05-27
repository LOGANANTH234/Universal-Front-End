'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { Punch } from '@/lib/punch-validation'
import { useAuth } from '@/lib/contexts/auth-context'

interface PunchEditModalProps {
  punch: Punch
  allPunches: Punch[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (punch: Punch) => void
  onRefresh?: () => void
  shiftStart?: string
  shiftEnd?: string
  workDate?: string
}

export default function PunchEditModal({ 
  punch, 
  allPunches,
  open, 
  onOpenChange, 
  onSave,
  onRefresh,
  shiftStart,
  shiftEnd,
  workDate = punch.date
}: PunchEditModalProps) {
  const { auth } = useAuth()
  
  // Helper functions
  const convert24to12 = (timeStr: string) => {
    // Handle both formats: "09:11" (24h) and "09:11 am" (12h with period)
    const trimmed = timeStr.trim()
    const hasPeriod = /\s?(am|pm)/i.test(trimmed)
    
    if (hasPeriod) {
      // Already in 12h format: "09:11 am" or "09:11 PM"
      const match = trimmed.match(/(\d{1,2}):(\d{2})\s?(am|pm)/i)
      if (match) {
        const hours = match[1].padStart(2, '0')
        const minutes = match[2]
        const period = match[3].toUpperCase() as 'AM' | 'PM'
        return { hours, minutes, period }
      }
    } else {
      // 24h format: "09:11"
      const [hrs, mins] = trimmed.split(':').map(Number)
      const period = hrs >= 12 ? 'PM' : 'AM'
      const hours12 = hrs % 12 || 12
      return { hours: hours12.toString().padStart(2, '0'), minutes: mins.toString().padStart(2, '0'), period }
    }
    
    // Fallback
    return { hours: '00', minutes: '00', period: 'AM' }
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getAllowedDates = () => {
    const d = new Date(workDate)
    const d1 = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    return [
      workDate,
      d1.toISOString().split('T')[0]
    ]
  }

  const [type, setType] = useState<'IN' | 'OUT'>(punch.type)
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  const [date, setDate] = useState(punch.date)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiValidationMessages, setApiValidationMessages] = useState<string[]>([])

  // When modal opens OR punch changes, reset form with new punch data
  useEffect(() => {
    if (open) {
      const initialTime = convert24to12(punch.time)
      setType(punch.type)
      setHours(initialTime.hours)
      setMinutes(initialTime.minutes)
      setPeriod(initialTime.period)
      setDate(punch.date)
      setApiValidationMessages([])
    }
  }, [open, punch])

  const convert12to24 = () => {
    let hrs = parseInt(hours)
    if (period === 'PM' && hrs !== 12) hrs += 12
    if (period === 'AM' && hrs === 12) hrs = 0
    return `${hrs.toString().padStart(2, '0')}:${minutes}`
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    setApiValidationMessages([])

    try {
      const token = auth?.token
      if (!token) {
        return
      }

      const requestBody = {
        date,
        hour: hours,
        minute: minutes,
        amPm: period,
      }

      const response = await fetch(`http://13.206.112.19:8080/api/punch/update/${punch.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      // Check for validation messages in response
      if (data.validationMessages && Array.isArray(data.validationMessages) && data.validationMessages.length > 0) {
        setApiValidationMessages(data.validationMessages)
        return
      }

      // Success response - close modal and refresh
      if (response.ok) {
        const updatedPunch = {
          ...punch,
          type,
          time: convert12to24(),
          date,
          note: '',
        }

        onSave(updatedPunch)
        onRefresh?.()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('[v0] Error saving punch:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Punch</DialogTitle>
        </DialogHeader>

        {apiValidationMessages.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
            {apiValidationMessages.map((message, index) => (
              <div key={index} className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-900 dark:text-red-100">{message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Type
            </Label>
            <Select value={type} disabled>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">IN</SelectItem>
                <SelectItem value="OUT">OUT</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Type cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Time</Label>
            <div className="flex gap-2 items-center">
              <Select value={hours || ''} onValueChange={setHours}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const h = (i + 1).toString().padStart(2, '0')
                    return <SelectItem key={h} value={h}>{h}</SelectItem>
                  })}
                </SelectContent>
              </Select>
              <span className="text-lg font-semibold">:</span>
              <Select value={minutes || ''} onValueChange={setMinutes}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => {
                    const m = i.toString().padStart(2, '0')
                    return <SelectItem key={m} value={m}>{m}</SelectItem>
                  })}
                </SelectContent>
              </Select>
              <Select value={period || 'AM'} onValueChange={(value) => setPeriod(value as 'AM' | 'PM')}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Select value={date} onValueChange={setDate}>
              <SelectTrigger id="date">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAllowedDates().map((d) => (
                  <SelectItem key={d} value={d}>
                    {formatDateDisplay(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
