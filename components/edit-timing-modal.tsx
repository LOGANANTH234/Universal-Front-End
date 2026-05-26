'use client'

import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, X, Edit2, Trash2, Plus, AlertCircle } from 'lucide-react'
import type { LiveAttendanceData } from '@/lib/attendance-types'
import PunchEditModal from './punch-edit-modal'
import PunchDeleteModal from './punch-delete-modal'
import PunchAddModal from './punch-add-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface EditTimingModalProps {
  attendance: LiveAttendanceData
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Punch {
  id: string
  type: 'IN' | 'OUT'
  time: string
  date: string
  note?: string
  shift?: string // Added shift field to identify which shift this punch belongs to
}

export default function EditTimingModal({ attendance, open, onOpenChange }: EditTimingModalProps) {
  const [punches, setPunches] = useState<Punch[]>([
    { id: '1', type: 'IN', time: '09:00', date: '2025-11-16', note: 'First clock in', shift: 'Morning Shift' },
    { id: '2', type: 'OUT', time: '12:00', date: '2025-11-16', note: 'Lunch break', shift: 'Morning Shift' },
    { id: '3', type: 'IN', time: '13:00', date: '2025-11-16', note: 'Back from lunch', shift: 'Afternoon Shift' },
    { id: '4', type: 'OUT', time: '17:00', date: '2025-11-16', note: 'End of afternoon', shift: 'Afternoon Shift' },
    { id: '5', type: 'IN', time: '18:00', date: '2025-11-16', note: 'Evening shift start', shift: 'Evening Shift' },
    { id: '6', type: 'OUT', time: '22:00', date: '2025-11-16', note: 'End of day', shift: 'Evening Shift' },
  ])

  const [editingPunch, setEditingPunch] = useState<Punch | null>(null)
  const [deletingPunch, setDeletingPunch] = useState<Punch | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const handleEditPunch = (updatedPunch: Punch) => {
    setPunches(punches.map(p => p.id === updatedPunch.id ? updatedPunch : p))
    setEditingPunch(null)
    // TODO: Recalculate working segments, breaks, shift totals, and salary
  }

  const handleDeletePunch = (punchId: string) => {
    setPunches(punches.filter(p => p.id !== punchId))
    setDeletingPunch(null)
    // TODO: Recalculate working segments, breaks, shift totals, and salary
  }

  const handleAddPunch = (newPunch: Omit<Punch, 'id'>) => {
    const punch: Punch = {
      id: Date.now().toString(),
      ...newPunch
    }
    setPunches([...punches, punch].sort((a, b) => a.time.localeCompare(b.time)))
    setIsAddModalOpen(false)
    // TODO: Recalculate working segments, breaks, shift totals, and salary
  }

  const groupPunchesByShift = (punches: Punch[]) => {
    const grouped: Record<string, Punch[]> = {}
    
    punches.forEach(punch => {
      const shift = punch.shift || 'Unassigned'
      if (!grouped[shift]) {
        grouped[shift] = []
      }
      grouped[shift].push(punch)
    })
    
    return grouped
  }

  const groupedPunches = groupPunchesByShift(punches)

  const getShiftColor = (shift: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'Morning Shift': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
      'Afternoon Shift': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
      'Evening Shift': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
      'Night Shift': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
    }
    return colors[shift] || { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-800' }
  }

  const handleSaveChanges = () => {
    setShowSaveConfirm(false)
    onOpenChange(false)
    // TODO: Send updated punches to backend
    console.log('[v0] Saving punch changes:', punches)
  }

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          
          <DialogPrimitive.Content className="fixed inset-0 z-50 w-screen h-screen bg-background overflow-auto">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  <DialogPrimitive.Title className="text-2xl font-bold">
                    Edit Timing for {attendance.employeeName}
                  </DialogPrimitive.Title>
                </div>
                <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-6 w-6 text-red-600 border-foreground border border-solid rounded-sm" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </div>

              {/* Employee Info */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-2xl">
                    {attendance.employeeName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{attendance.employeeName}</div>
                    <div className="text-sm text-muted-foreground">{attendance.employeeRole}</div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-blue-600 dark:text-blue-400">
                      <Clock className="w-4 h-4" />
                      Shift: {attendance.shiftStartTime} – {attendance.shiftEndTime}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Punch Entries</h3>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedPunches).map(([shift, shiftPunches]) => {
                    const colors = getShiftColor(shift)
                    return (
                      <div key={shift} className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}>
                        <h4 className={`font-semibold mb-3 ${colors.text} flex items-center gap-2`}>
                          <Clock className="w-4 h-4" />
                          {shift}
                        </h4>
                        <div className="space-y-3">
                          {shiftPunches.map((punch) => (
                            <div 
                              key={punch.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 rounded text-xs font-semibold ${
                                  punch.type === 'IN' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {punch.type}
                                </div>
                                <div>
                                  <div className="font-medium">{formatTime12Hour(punch.time)}</div>
                                  <div className="text-sm text-muted-foreground">{punch.date}</div>
                                </div>
                                {punch.note && (
                                  <div className="text-sm text-muted-foreground italic">
                                    {punch.note}
                                  </div>
                                )}
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {punches.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No punch entries yet. Click "Add Punch" to create one.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Confirm Save Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save all punch entry changes for {attendance.employeeName}? 
              This will update their attendance records and may affect their salary calculation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveChanges}>
              Yes, Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingPunch && (
        <PunchEditModal
          punch={editingPunch}
          allPunches={punches}
          open={!!editingPunch}
          onOpenChange={(open) => !open && setEditingPunch(null)}
          onSave={handleEditPunch}
          shiftStart={attendance.shiftStartTime}
          shiftEnd={attendance.shiftEndTime}
        />
      )}

      {deletingPunch && (
        <PunchDeleteModal
          punch={deletingPunch}
          open={!!deletingPunch}
          onOpenChange={(open) => !open && setDeletingPunch(null)}
          onConfirm={() => handleDeletePunch(deletingPunch.id)}
        />
      )}

      <PunchAddModal
        allPunches={punches}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAdd={handleAddPunch}
        shiftStart={attendance.shiftStartTime}
        shiftEnd={attendance.shiftEndTime}
      />
    </>
  )
}
