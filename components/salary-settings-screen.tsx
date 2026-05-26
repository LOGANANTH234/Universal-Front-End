"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit2, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SalaryConfig {
  id: string
  shift: string
  shiftTime: string
  hourlyRate: number
  otRate: number
  allowance: number
  graceMinutes: number
  penaltyPerMinute: number
  warningThreshold: number
}

export function SalarySettingsScreen() {
  const [configs, setConfigs] = useState<SalaryConfig[]>([
    {
      id: "1",
      shift: "Morning",
      shiftTime: "09:00 - 18:00",
      hourlyRate: 150,
      otRate: 225,
      allowance: 100,
      graceMinutes: 5,
      penaltyPerMinute: 5,
      warningThreshold: 3,
    },
    {
      id: "2",
      shift: "Evening",
      shiftTime: "14:00 - 23:00",
      hourlyRate: 160,
      otRate: 240,
      allowance: 120,
      graceMinutes: 5,
      penaltyPerMinute: 5,
      warningThreshold: 3,
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SalaryConfig | null>(null)
  const [formData, setFormData] = useState<Partial<SalaryConfig>>({})

  const handleAddNew = () => {
    setEditingConfig(null)
    setFormData({
      shift: "",
      shiftTime: "",
      hourlyRate: 0,
      otRate: 0,
      allowance: 0,
      graceMinutes: 5,
      penaltyPerMinute: 5,
      warningThreshold: 3,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (config: SalaryConfig) => {
    setEditingConfig(config)
    setFormData(config)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingConfig) {
      setConfigs(
        configs.map((c) =>
          c.id === editingConfig.id ? { ...editingConfig, ...formData } : c
        )
      )
    } else {
      const newConfig: SalaryConfig = {
        id: Date.now().toString(),
        ...formData,
      } as SalaryConfig
      setConfigs([...configs, newConfig])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setConfigs(configs.filter((c) => c.id !== id))
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: isNaN(Number(value)) ? value : Number(value),
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Salary Settings</h1>
        <p className="text-gray-500 mt-1">Configure shift salary and OT rates</p>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Add New Config
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Edit" : "Add"} Salary Configuration
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shift">Shift Name</Label>
                <Input
                  id="shift"
                  name="shift"
                  value={formData.shift || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Morning"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftTime">Shift Time</Label>
                <Input
                  id="shiftTime"
                  name="shiftTime"
                  value={formData.shiftTime || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 09:00 - 18:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  value={formData.hourlyRate || ""}
                  onChange={handleInputChange}
                  placeholder="150"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otRate">OT Rate (₹/hour)</Label>
                <Input
                  id="otRate"
                  name="otRate"
                  type="number"
                  value={formData.otRate || ""}
                  onChange={handleInputChange}
                  placeholder="225"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowance">Daily Allowance (₹)</Label>
                <Input
                  id="allowance"
                  name="allowance"
                  type="number"
                  value={formData.allowance || ""}
                  onChange={handleInputChange}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graceMinutes">Grace Minutes</Label>
                <Input
                  id="graceMinutes"
                  name="graceMinutes"
                  type="number"
                  value={formData.graceMinutes || ""}
                  onChange={handleInputChange}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="penaltyPerMinute">Penalty Per Late Minute (₹)</Label>
                <Input
                  id="penaltyPerMinute"
                  name="penaltyPerMinute"
                  type="number"
                  value={formData.penaltyPerMinute || ""}
                  onChange={handleInputChange}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warningThreshold">Warning Threshold (Late Count)</Label>
                <Input
                  id="warningThreshold"
                  name="warningThreshold"
                  type="number"
                  value={formData.warningThreshold || ""}
                  onChange={handleInputChange}
                  placeholder="3"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Salary Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift</TableHead>
                  <TableHead>Shift Time</TableHead>
                  <TableHead className="text-right">Hourly Rate</TableHead>
                  <TableHead className="text-right">OT Rate</TableHead>
                  <TableHead className="text-right">Allowance</TableHead>
                  <TableHead className="text-center">Grace (min)</TableHead>
                  <TableHead className="text-right">Penalty/min</TableHead>
                  <TableHead className="text-center">Warning Threshold</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{config.shift}</Badge>
                    </TableCell>
                    <TableCell>{config.shiftTime}</TableCell>
                    <TableCell className="text-right">₹{config.hourlyRate}</TableCell>
                    <TableCell className="text-right">₹{config.otRate}</TableCell>
                    <TableCell className="text-right">₹{config.allowance}</TableCell>
                    <TableCell className="text-center">{config.graceMinutes}</TableCell>
                    <TableCell className="text-right">₹{config.penaltyPerMinute}</TableCell>
                    <TableCell className="text-center">
                      {config.warningThreshold}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Hourly Rate:</strong> Base salary per hour for normal working hours
          </p>
          <p>
            <strong>OT Rate:</strong> Overtime payment per hour (usually 1.5x hourly rate)
          </p>
          <p>
            <strong>Grace Minutes:</strong> Minutes allowed for late arrival before penalty
          </p>
          <p>
            <strong>Penalty Per Minute:</strong> Deduction amount for each minute beyond grace
          </p>
          <p>
            <strong>Warning Threshold:</strong> Number of late arrivals before warning is issued
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
