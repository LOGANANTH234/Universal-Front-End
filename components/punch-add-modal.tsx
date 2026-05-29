'use client'

import { AlertTriangle, AlertCircle, Loader2 } from "lucide-react"

import { useState, useEffect } from "react"

import { validatePunch, type ValidationResult } from '@/lib/punch-validation'
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
import type { Punch } from '@/lib/punch-validation'

interface PunchAddModalProps {
  allPunches: Punch[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (punch: Omit<Punch, 'id'>) => void
  onAddPair?: (inPunch: Omit<Punch, 'id'>, outPunch: Omit<Punch, 'id'>) => void
  shiftStart?: string
  shiftEnd?: string
  workDate?: string
  employeeId?: string
  authToken?: string
  onRefresh?: () => Promise<void>
}

export default function PunchAddModal({ 
  allPunches,
  open, 
  onOpenChange, 
  onAdd,
  onAddPair,
  shiftStart,
  shiftEnd,
  workDate = new Date().toISOString().split('T')[0],
  employeeId,
  authToken,
  onRefresh
}: PunchAddModalProps) {
  const [shift, setShift] = useState('Morning')
  const [type, setType] = useState<'IN' | 'OUT'>('IN')
  const [inHours, setInHours] = useState('09')
  const [inMinutes, setInMinutes] = useState('00')
  const [inPeriod, setInPeriod] = useState<'AM' | 'PM'>('AM')
  const [outHours, setOutHours] = useState('05')
  const [outMinutes, setOutMinutes] = useState('00')
  const [outPeriod, setOutPeriod] = useState<'AM' | 'PM'>('PM')
  const [note, setNote] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true })
  const [showOvertimeConfirm, setShowOvertimeConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationMessages, setValidationMessages] = useState<string[]>([])

  const availableShifts = ['Morning', 'Afternoon', 'Evening', 'Night']

  // Get allowed dates: workDate (D) and next day (D+1)
  const getAllowedDates = () => {
    const d = new Date(workDate)
    const d1 = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    return [
      workDate,
      d1.toISOString().split('T')[0]
    ]
  }

  const [inDate, setInDate] = useState(workDate)
  const [outDate, setOutDate] = useState(workDate)

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Debug logging
  useEffect(() => {
    console.log("[v0] PunchAddModal mounted/updated with:")
    console.log("[v0] workDate prop:", workDate)
    console.log("[v0] inDate state:", inDate)
    console.log("[v0] outDate state:", outDate)
    console.log("[v0] getAllowedDates():", getAllowedDates())
  }, [workDate, inDate, outDate])

  const convert12to24 = (hrs: string, mins: string, period: 'AM' | 'PM') => {
    let hour = parseInt(hrs)
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return `${hour.toString().padStart(2, '0')}:${mins}`
  }

  // Clear validation messages when modal opens
  useEffect(() => {
    if (open) {
      console.log("[v0] Modal opened, workDate:", workDate)
      console.log("[v0] Setting inDate to:", workDate, "and outDate to:", workDate)
      setValidationMessages([])
      setValidationResult({ isValid: true })
      // Ensure dates are set to workDate when modal opens
      setInDate(workDate)
      setOutDate(workDate)
    }
  }, [open, workDate])

  useEffect(() => {
    const inTime = convert12to24(inHours, inMinutes, inPeriod)
    const outTime = convert12to24(outHours, outMinutes, outPeriod)
    
    // Validate IN punch
    const inPunch = {
      type: 'IN' as const,
      time: inTime,
      date: inDate,
      note: '',
      shift,
    }
    
    const result = validatePunch(inPunch, allPunches, undefined, shiftStart, shiftEnd)
    setValidationResult(result)
  }, [inHours, inMinutes, inPeriod, inDate, outHours, outMinutes, outPeriod, outDate, shift, allPunches, shiftStart, shiftEnd])

  const validateMandatoryFields = (): string[] => {
    const errors: string[] = []

    // Validate IN time
    if (!inHours || inHours.trim() === '') {
      errors.push('IN hour is mandatory')
    }
    if (!inMinutes || inMinutes.trim() === '') {
      errors.push('IN minute is mandatory')
    }
    if (!inPeriod) {
      errors.push('IN AM/PM is mandatory')
    }
    if (!inDate) {
      errors.push('IN date is mandatory')
    }

    // Validate OUT time
    if (!outHours || outHours.trim() === '') {
      errors.push('OUT hour is mandatory')
    }
    if (!outMinutes || outMinutes.trim() === '') {
      errors.push('OUT minute is mandatory')
    }
    if (!outPeriod) {
      errors.push('OUT AM/PM is mandatory')
    }
    if (!outDate) {
      errors.push('OUT date is mandatory')
    }

    // Validate shift
    if (!shift || shift.trim() === '') {
      errors.push('Shift is mandatory')
    }

    return errors
  }

  const handleAdd = async () => {
    console.log("[v0] handleAdd called with:")
    console.log("[v0] inDate:", inDate, "outDate:", outDate)
    console.log("[v0] inTime: 09:00 AM, outTime: 05:00 PM")
    
    // Validate mandatory fields
    const mandatoryErrors = validateMandatoryFields()
    if (mandatoryErrors.length > 0) {
      setValidationMessages(mandatoryErrors)
      console.log("[v0] Validation errors:", mandatoryErrors)
      return
    }

    // Validate IN punch first
    if (!validationResult.isValid) {
      return
    }

    const inTime = convert12to24(inHours, inMinutes, inPeriod)
    const outTime = convert12to24(outHours, outMinutes, outPeriod)
    
    const inPunch = {
      type: 'IN' as const,
      time: inTime,
      date: inDate,
      note: '',
      shift,
    }

    const outPunch = {
      type: 'OUT' as const,
      time: outTime,
      date: outDate,
      note: note.trim(),
      shift,
    }

    // Validate OUT punch
    const outValidation = validatePunch(outPunch, [...allPunches, inPunch], undefined, shiftStart, shiftEnd)
    if (!outValidation.isValid) {
      setValidationResult(outValidation)
      return
    }

    if (outValidation.warning) {
      setShowOvertimeConfirm(true)
      return
    }

    // If we have API integration, call the API instead of onAddPair
    if (employeeId && authToken) {
      await handleAddPairAPI(inPunch, outPunch)
    } else {
      // Fallback to local handling if no API integration
      if (onAddPair) {
        onAddPair(inPunch, outPunch)
      } else {
        onAdd(inPunch)
        onAdd(outPunch)
      }
      
      // Reset form
      resetForm()
    }
  }

  const handleAddPairAPI = async (inPunch: any, outPunch: any) => {
    setIsLoading(true)
    setValidationMessages([])

    try {
      console.log("[v0] Calling add-pair API for employee:", employeeId)
      
      const requestBody = {
        attendanceDate: workDate,
        inDate: inPunch.date,
        inHour: inHours,
        inMinute: inMinutes,
        inAmPm: inPeriod,
        outDate: outPunch.date,
        outHour: outHours,
        outMinute: outMinutes,
        outAmPm: outPeriod,
      }

      console.log("[v0] Request body:", requestBody)

      const response = await fetch(`http://13.206.112.19:8080/api/punch/add-pair/${employeeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log("[v0] Add-pair response:", data)

      // Check for validation messages in response
      if (data.validationMessages && Array.isArray(data.validationMessages) && data.validationMessages.length > 0) {
        console.log("[v0] Validation messages received:", data.validationMessages)
        setValidationMessages(data.validationMessages)
        // Keep modal open to display validation messages
        return
      }

      // Success response - no validation messages
      if (response.ok) {
        console.log("[v0] Punch pair added successfully")
        
        // Close modal and refresh list
        resetForm()
        onOpenChange(false)
        
        // Refresh the punch list
        if (onRefresh) {
          await onRefresh()
        }
      } else {
        // API error
        const errorMsg = data.message || "Something went wrong. Please try again."
        console.log("[v0] Add-pair API error:", errorMsg)
      }
    } catch (error) {
      console.error('[v0] Error calling add-pair API:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setShift('Morning')
    setInHours('09')
    setInMinutes('00')
    setInPeriod('AM')
    setOutHours('05')
    setOutMinutes('00')
    setOutPeriod('PM')
    setInDate(workDate)
    setOutDate(workDate)
    setNote('')
    setValidationResult({ isValid: true })
    setShowOvertimeConfirm(false)
    setValidationMessages([])
    console.log("[v0] resetForm called - setting dates to workDate:", workDate)
  }

  const handleOvertimeConfirm = async () => {
    // Implement the logic for handling overtime confirmation
    setShowOvertimeConfirm(false)
    await handleAdd()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Punch (IN & OUT Pair)</DialogTitle>
        </DialogHeader>

        {validationMessages.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
            {validationMessages.map((message, index) => (
              <div key={index} className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-900 dark:text-red-100">{message}</p>
              </div>
            ))}
          </div>
        )}

        {!validationResult.isValid && validationResult.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{validationResult.error}</p>
          </div>
        )}

        {validationResult.isValid && validationResult.warning && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800 dark:text-orange-200">{validationResult.warning}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleOvertimeConfirm} className="bg-orange-600 hover:bg-orange-700">
                Allow Overtime
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">IN Time</Label>
            <div className="flex gap-2">
              <Select value={inHours} onValueChange={setInHours}>
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
              <span className="flex items-center text-xl font-bold">:</span>
              <Select value={inMinutes} onValueChange={setInMinutes}>
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
              <Select value={inPeriod} onValueChange={(value) => setInPeriod(value as 'AM' | 'PM')}>
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
            <Label className="text-sm font-medium">OUT Time</Label>
            <div className="flex gap-2">
              <Select value={outHours} onValueChange={setOutHours}>
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
              <span className="flex items-center text-xl font-bold">:</span>
              <Select value={outMinutes} onValueChange={setOutMinutes}>
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
              <Select value={outPeriod} onValueChange={(value) => setOutPeriod(value as 'AM' | 'PM')}>
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
            <Label htmlFor="inDate" className="text-sm font-medium">
              IN Date
            </Label>
            <Select value={inDate} onValueChange={setInDate}>
              <SelectTrigger id="inDate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAllowedDates().map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatDateDisplay(date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outDate" className="text-sm font-medium">
              OUT Date
            </Label>
            <Select value={outDate} onValueChange={setOutDate}>
              <SelectTrigger id="outDate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAllowedDates().map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatDateDisplay(date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            className="bg-primary"
            disabled={!validationResult.isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Pair'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
