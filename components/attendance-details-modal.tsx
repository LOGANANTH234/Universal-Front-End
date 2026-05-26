'use client'

import { useState } from 'react'
import { X, Clock, Plus, Edit2, Trash2 } from 'lucide-react'
import type { LiveAttendanceData } from "@/lib/attendance-types"
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog"
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import PunchEditModal from './punch-edit-modal'
import PunchDeleteModal from './punch-delete-modal'
import PunchAddModal from './punch-add-modal'

export type PunchType = 'IN' | 'OUT'

export interface PunchEntry {
  id: string
  type: PunchType
  time: string
  date: string
  note?: string
}

interface AttendanceDetailsModalProps {
  attendance: LiveAttendanceData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AttendanceDetailsModal({
  attendance,
  open,
  onOpenChange,
}: AttendanceDetailsModalProps) {
  const [punchEntries, setPunchEntries] = useState<PunchEntry[]>([
    { id: '1', type: 'IN', time: '09:00 AM', date: '2025-11-16', note: '' },
    { id: '2', type: 'OUT', time: '12:00 PM', date: '2025-11-16', note: '' },
    { id: '3', type: 'IN', time: '01:00 PM', date: '2025-11-16', note: '' },
    { id: '4', type: 'OUT', time: '02:00 PM', date: '2025-11-16', note: '' },
  ])
  
  const [editingPunch, setEditingPunch] = useState<PunchEntry | null>(null)
  const [deletingPunchId, setDeletingPunchId] = useState<string | null>(null)
  const [isAddingPunch, setIsAddingPunch] = useState(false)

  const handleEditPunch = (punch: PunchEntry) => {
    setEditingPunch(punch)
  }

  const handleSaveEdit = (updatedPunch: PunchEntry) => {
    setPunchEntries(punches => 
      punches.map(p => p.id === updatedPunch.id ? updatedPunch : p)
    )
    setEditingPunch(null)
    // TODO: Recalculate shift totals and salary
  }

  const handleDeletePunch = (id: string) => {
    setPunchEntries(punches => punches.filter(p => p.id !== id))
    setDeletingPunchId(null)
    // TODO: Recalculate shift totals and salary
  }

  const handleAddPunch = (newPunch: Omit<PunchEntry, 'id'>) => {
    const punch: PunchEntry = {
      ...newPunch,
      id: `${Date.now()}`,
    }
    setPunchEntries(punches => [...punches, punch])
    setIsAddingPunch(false)
    // TODO: Recalculate shift totals and salary
  }

  if (!attendance) return null

  const morningShift = [
    { timeBlock: '09:00 AM – 12:00 PM', status: 'Work', rate: '₹100/hr', calculation: '3 hrs × ₹100', total: '₹300' },
    { timeBlock: '12:00 PM – 01:00 PM', status: 'Break', rate: '–', calculation: '–', total: '–' },
    { timeBlock: '01:00 PM – 02:00 PM', status: 'Work', rate: '₹100/hr', calculation: '1 hr × ₹100', total: '₹100' },
  ]

  const afternoonShift = [
    { timeBlock: '02:00 PM – 04:00 PM', status: 'Work', rate: '₹100/hr', calculation: '2 hrs × ₹100', total: '₹200' },
    { timeBlock: '04:00 PM – 04:30 PM', status: 'Break', rate: '–', calculation: '–', total: '–' },
    { timeBlock: '04:30 PM – 06:00 PM', status: 'Work', rate: '₹100/hr', calculation: '1.5 hrs × ₹100', total: '₹150' },
  ]

  const eveningShift = [
    { timeBlock: '06:00 PM – 08:00 PM', status: 'Work', rate: '₹100/hr', calculation: '2 hrs × ₹100', total: '₹200' },
    { timeBlock: '08:00 PM – 08:30 PM', status: 'Break', rate: '–', calculation: '–', total: '–' },
    { timeBlock: '08:30 PM – 10:00 PM', status: 'Work', rate: '₹100/hr', calculation: '1.5 hrs × ₹100', total: '₹150' },
  ]

  const nightShift = [
    { timeBlock: '10:00 PM – 12:00 AM', status: 'Work', rate: '₹120/hr', calculation: '2 hrs × ₹120', total: '₹240' },
    { timeBlock: '12:00 AM – 12:30 AM', status: 'Break', rate: '–', calculation: '–', total: '–' },
    { timeBlock: '12:30 AM – 02:00 AM', status: 'Work', rate: '₹120/hr', calculation: '1.5 hrs × ₹120', total: '₹180' },
  ]

  const morningShiftTotal = 400
  const afternoonShiftTotal = 350
  const eveningShiftTotal = 350
  const nightShiftTotal = 420

  const shifts = [
    {
      name: 'Morning Shift',
      data: morningShift,
      total: morningShiftTotal,
      color: 'blue',
      borderClass: 'border-blue-100',
      headerBg: 'from-blue-50 to-blue-100',
      headerBorder: 'border-blue-200',
      totalBg: 'bg-blue-50',
      totalBorder: 'border-blue-200',
      totalText: 'text-blue-600',
      hoverBg: 'hover:bg-blue-50/50',
      titleColor: 'text-blue-700',
      indicatorBg: 'bg-blue-500'
    },
    {
      name: 'Afternoon Shift',
      data: afternoonShift,
      total: afternoonShiftTotal,
      color: 'orange',
      borderClass: 'border-orange-100',
      headerBg: 'from-orange-50 to-orange-100',
      headerBorder: 'border-orange-200',
      totalBg: 'bg-orange-50',
      totalBorder: 'border-orange-200',
      totalText: 'text-orange-600',
      hoverBg: 'hover:bg-orange-50/50',
      titleColor: 'text-orange-700',
      indicatorBg: 'bg-orange-500'
    },
    {
      name: 'Evening Shift',
      data: eveningShift,
      total: eveningShiftTotal,
      color: 'purple',
      borderClass: 'border-purple-100',
      headerBg: 'from-purple-50 to-purple-100',
      headerBorder: 'border-purple-200',
      totalBg: 'bg-purple-50',
      totalBorder: 'border-purple-200',
      totalText: 'text-purple-600',
      hoverBg: 'hover:bg-purple-50/50',
      titleColor: 'text-purple-700',
      indicatorBg: 'bg-purple-500'
    },
    {
      name: 'Night Shift',
      data: nightShift,
      total: nightShiftTotal,
      color: 'indigo',
      borderClass: 'border-indigo-100',
      headerBg: 'from-indigo-50 to-indigo-100',
      headerBorder: 'border-indigo-200',
      totalBg: 'bg-indigo-50',
      totalBorder: 'border-indigo-200',
      totalText: 'text-indigo-600',
      hoverBg: 'hover:bg-indigo-50/50',
      titleColor: 'text-indigo-700',
      indicatorBg: 'bg-indigo-500'
    }
  ]

  const fullTotal = shifts.reduce((sum, shift) => sum + shift.total, 0)

  const mockData = {
    todaySalary: fullTotal,
    weekSalary: 8400.00,
    monthSalary: 33600.00,
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/30" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 w-screen h-screen overflow-y-auto bg-white border-4 border-gray-200"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="fixed right-4 top-4 sm:right-6 sm:top-6 md:right-8 md:top-8 rounded-lg p-2 hover:bg-gray-100 transition-colors z-50 bg-white shadow-md border"
            >
              <X size={20} className="text-red-700" />
            </button>

            <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 lg:pt-0 lg:pb-1.5">
              <div className="max-w-7xl mx-auto pt-12 sm:pt-14 pb-6 md:pt-0.5 sm:space-y-0.5 my-0">
                <div className="flex items-center gap-3 sm:gap-4 mb-6">
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-semibold bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"
                  >
                    {attendance.employeeName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {attendance.employeeName.toLowerCase()}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md text-white text-xs font-medium shadow-sm bg-red-600">
                        {attendance.employeeRole}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-gray-600">
                      <Clock size={14} className="text-card-foreground" />
                      <span className="font-semibold">{attendance.shiftStartTime} - {attendance.shiftEndTime}</span>
                    </div>
                  </div>
                </div>

                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  {shifts.map((shift, shiftIndex) => (
                    <div key={shiftIndex} className="space-y-2 sm:space-y-3">
                      <h3 className={`text-base sm:text-lg font-bold ${shift.titleColor} flex items-center gap-2`}>
                        <span className={`w-1 h-5 sm:h-6 ${shift.indicatorBg} rounded-full`}></span>
                        {shift.name}
                      </h3>
                      <div className={`border-2 ${shift.headerBorder} rounded-lg overflow-hidden shadow-sm overflow-x-auto`}>
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow className={`bg-gradient-to-r ${shift.headerBg} border-b-2 ${shift.headerBorder}`}>
                              <TableHead className={`font-bold text-gray-800 text-xs sm:text-sm whitespace-nowrap border-r ${shift.headerBorder}`}>Time Block</TableHead>
                              <TableHead className={`font-bold text-gray-800 text-xs sm:text-sm border-r ${shift.headerBorder}`}>Status</TableHead>
                              <TableHead className={`font-bold text-gray-800 text-xs sm:text-sm border-r ${shift.headerBorder}`}>Rate</TableHead>
                              <TableHead className={`font-bold text-gray-800 text-xs sm:text-sm hidden sm:table-cell border-r ${shift.headerBorder}`}>Calculation</TableHead>
                              <TableHead className="font-bold text-gray-800 text-xs sm:text-sm text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shift.data.map((row, index) => (
                              <TableRow key={index} className={`${shift.hoverBg} transition-colors`}>
                                <TableCell className={`font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap border-r ${shift.borderClass}`}>{row.timeBlock}</TableCell>
                                <TableCell className={`border-r ${shift.borderClass}`}>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-xs font-medium ${
                                    row.status === 'Work' 
                                      ? 'bg-green-100 text-green-700 border border-green-200' 
                                      : 'bg-orange-100 text-orange-700 border border-orange-200'
                                  }`}>
                                    {row.status}
                                  </span>
                                </TableCell>
                                <TableCell className={`text-gray-700 text-xs sm:text-sm border-r ${shift.borderClass}`}>{row.rate}</TableCell>
                                <TableCell className={`text-gray-600 text-xs sm:text-sm hidden sm:table-cell border-r ${shift.borderClass}`}>{row.calculation}</TableCell>
                                <TableCell className={`text-right font-bold ${shift.totalText} text-xs sm:text-sm`}>{row.total}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className={`flex justify-end items-center gap-2 px-3 py-2 ${shift.totalBg} rounded-lg border ${shift.totalBorder}`}>
                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Shift Total:</span>
                        <span className={`font-bold text-lg sm:text-xl ${shift.totalText}`}>₹{shift.total}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 shadow-sm mb-6 px-4 sm:py-1.5">
                  <span className="text-base sm:text-lg font-bold text-green-600">Full Total</span>
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{fullTotal}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-7xl mx-auto pb-8">
                <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 text-center shadow-sm hover:shadow-md transition-shadow sm:py-5">
                  <div className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Today Salary</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">₹{mockData.todaySalary.toFixed(2)}</div>
                </div>
                <div className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">This Week</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">₹{mockData.weekSalary.toFixed(2)}</div>
                </div>
                <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide">This Month</div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">₹{mockData.monthSalary.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {editingPunch && (
        <PunchEditModal
          punch={editingPunch}
          open={!!editingPunch}
          onOpenChange={(open) => !open && setEditingPunch(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingPunchId && (
        <PunchDeleteModal
          open={!!deletingPunchId}
          onOpenChange={(open) => !open && setDeletingPunchId(null)}
          onConfirm={() => handleDeletePunch(deletingPunchId)}
        />
      )}

      {isAddingPunch && (
        <PunchAddModal
          open={isAddingPunch}
          onOpenChange={setIsAddingPunch}
          onAdd={handleAddPunch}
        />
      )}
    </>
  )
}
