"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Shift } from "@/lib/types"
import { X } from 'lucide-react'

interface ShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shift: Shift | Omit<Shift, "id">) => void
  initialShift: Shift | null
}

export default function ShiftModal({ isOpen, onClose, onSave, initialShift }: ShiftModalProps) {
  const [formData, setFormData] = useState<Omit<Shift, "id">>({
    employee: "",
    position: "",
    date: "",
    type: "morning",
    startTime: "09:00",
    endTime: "17:00",
    status: "pending",
  })

  useEffect(() => {
    if (initialShift) {
      setFormData({
        employee: initialShift.employee,
        position: initialShift.position,
        date: initialShift.date,
        type: initialShift.type,
        startTime: initialShift.startTime,
        endTime: initialShift.endTime,
        status: initialShift.status,
      })
    } else {
      setFormData({
        employee: "",
        position: "",
        date: "",
        type: "morning",
        startTime: "09:00",
        endTime: "17:00",
        status: "pending",
      })
    }
  }, [initialShift, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (initialShift) {
      onSave({
        ...formData,
        id: initialShift.id,
      } as Shift)
    } else {
      onSave(formData)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">{initialShift ? "Edit Shift" : "Create New Shift"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Employee Name</label>
            <Input
              type="text"
              name="employee"
              value={formData.employee}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Position</label>
            <Input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Cashier"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date</label>
            <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Shift Type</label>
            <Select name="type" value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (6AM - 2PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (2PM - 10PM)</SelectItem>
                <SelectItem value="night">Night (10PM - 6AM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Time</label>
              <Input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">End Time</label>
              <Input type="time" name="endTime" value={formData.endTime} onChange={handleChange} disabled required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <Select name="status" value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {initialShift ? "Update Shift" : "Create Shift"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
