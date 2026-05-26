"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface MonthlyPayrollRecord {
  id: string
  employee: string
  month: string
  workingDays: number
  presentDays: number
  absentDays: number
  normalTotal: number
  otTotal: number
  allowanceTotal: number
  penaltyMinutes: number
  warningTotal: number
  netPay: number
}

interface MonthlyPayrollDrilldownModalProps {
  record: MonthlyPayrollRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MonthlyPayrollDrilldownModal({
  record,
  open,
  onOpenChange,
}: MonthlyPayrollDrilldownModalProps) {
  // Mock attendance data
  const mockDailySalaries = [
    {
      date: "2024-01-02",
      shift: "Morning",
      worked: 480,
      salary: 480,
      pay: 1200,
      status: "present",
    },
    {
      date: "2024-01-03",
      shift: "Morning",
      worked: 470,
      salary: 450,
      pay: 1125,
      status: "present",
    },
    {
      date: "2024-01-04",
      shift: "Morning",
      worked: 0,
      salary: 0,
      pay: 0,
      status: "absent",
    },
  ]

  const attendanceCalendarData = [
    { date: "2024-01-01", status: "holiday" },
    { date: "2024-01-02", status: "present" },
    { date: "2024-01-03", status: "present" },
    { date: "2024-01-04", status: "absent" },
    { date: "2024-01-05", status: "present" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Monthly Payroll Details - {record.employee} ({record.month})
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="breakup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="breakup">Salary Breakup</TabsTrigger>
            <TabsTrigger value="calendar">Attendance Calendar</TabsTrigger>
            <TabsTrigger value="daily">Daily Salary</TabsTrigger>
          </TabsList>

          {/* Tab 1: Salary Breakup */}
          <TabsContent value="breakup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Working Days</p>
                  <p className="text-2xl font-bold">{record.workingDays}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Present Days</p>
                  <p className="text-2xl font-bold text-green-600">{record.presentDays}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Absent Days</p>
                  <p className="text-2xl font-bold text-red-600">{record.absentDays}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{record.warningTotal}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Salary Breakup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Normal Pay</span>
                  <span className="font-medium">₹{record.normalTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total OT Pay</span>
                  <span className="font-medium">₹{record.otTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Allowances</span>
                  <span className="font-medium">₹{record.allowanceTotal}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Penalty Minutes</span>
                  <span className="font-medium">{record.penaltyMinutes}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>Net Pay</span>
                  <span>₹{record.netPay.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Attendance Calendar */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {attendanceCalendarData.map((day) => (
                    <div
                      key={day.date}
                      className={`p-2 rounded text-center text-xs font-medium ${
                        day.status === "present"
                          ? "bg-green-100 text-green-800"
                          : day.status === "absent"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {new Date(day.date).getDate()}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded"></div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded"></div>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                    <span>Holiday</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Daily Salary */}
          <TabsContent value="daily" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead className="text-right">Worked (min)</TableHead>
                  <TableHead className="text-right">Salary (min)</TableHead>
                  <TableHead className="text-right">Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDailySalaries.map((daily) => (
                  <TableRow key={daily.date}>
                    <TableCell>{daily.date}</TableCell>
                    <TableCell>{daily.shift}</TableCell>
                    <TableCell className="text-right">{daily.worked}</TableCell>
                    <TableCell className="text-right">{daily.salary}</TableCell>
                    <TableCell className="text-right">₹{daily.pay}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          daily.status === "present"
                            ? "default"
                            : daily.status === "absent"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {daily.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
