"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { mockPayslips } from "@/lib/payslip-data"
import Image from "next/image"
import { AppNavigation } from "@/components/app-navigation"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

interface EarningItem {
  id: string
  component: string
  amount: number
}

interface DeductionItem {
  id: string
  type: string
  amount: number
}

export default function EditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const payslipId = searchParams.get("id")

  const payslip = mockPayslips.find((p) => p.id === payslipId)

  const [earnings, setEarnings] = useState<EarningItem[]>([
    { id: "1", component: "Basic Pay", amount: payslip?.basicPay || 12000 },
    { id: "2", component: "Shift Pay", amount: payslip?.shiftPay || 4000 },
    { id: "3", component: "Overtime", amount: payslip?.overtime || 2000 },
    { id: "4", component: "Allowances", amount: payslip?.allowances || 500 },
    { id: "5", component: "Lunch Allowance", amount: payslip?.lunchAllowance || 200 },
  ])

  const [deductions, setDeductions] = useState<DeductionItem[]>([
    { id: "1", type: "Late Deduction", amount: payslip?.lateDeduction || 100 },
    { id: "2", type: "Leave Deduction", amount: payslip?.leaveDeduction || 500 },
  ])

  const [notes, setNotes] = useState("")
  const [newEarningName, setNewEarningName] = useState("")
  const [newEarningAmount, setNewEarningAmount] = useState("")
  const [newDeductionName, setNewDeductionName] = useState("")
  const [newDeductionAmount, setNewDeductionAmount] = useState("")
  const [isEarningDialogOpen, setIsEarningDialogOpen] = useState(false)
  const [isDeductionDialogOpen, setIsDeductionDialogOpen] = useState(false)

  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0)
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0)
  const netSalary = totalEarnings - totalDeductions

  const handleEarningUpdate = (id: string, amount: number) => {
    setEarnings((prev) => prev.map((item) => (item.id === id ? { ...item, amount } : item)))
  }

  const handleDeductionUpdate = (id: string, amount: number) => {
    setDeductions((prev) => prev.map((item) => (item.id === id ? { ...item, amount } : item)))
  }

  const handleAddEarning = () => {
    if (newEarningName && newEarningAmount) {
      const newItem: EarningItem = {
        id: Date.now().toString(),
        component: newEarningName,
        amount: Number.parseFloat(newEarningAmount),
      }
      setEarnings([...earnings, newItem])
      setNewEarningName("")
      setNewEarningAmount("")
      setIsEarningDialogOpen(false)
    }
  }

  const handleAddDeduction = () => {
    if (newDeductionName && newDeductionAmount) {
      const newItem: DeductionItem = {
        id: Date.now().toString(),
        type: newDeductionName,
        amount: Number.parseFloat(newDeductionAmount),
      }
      setDeductions([...deductions, newItem])
      setNewDeductionName("")
      setNewDeductionAmount("")
      setIsDeductionDialogOpen(false)
    }
  }

  const handleRemoveEarning = (id: string) => {
    setEarnings((prev) => prev.filter((item) => item.id !== id))
  }

  const handleRemoveDeduction = (id: string) => {
    setDeductions((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSaveDraft = () => {
    console.log("[v0] Saving draft...")
    router.push("/")
  }

  const handleGeneratePayslip = () => {
    console.log("[v0] Generating payslip...")
    router.push(`/preview?id=${payslipId}`)
  }

  if (!payslip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Payslip not found</p>
      </div>
    )
  }

  return (
    <RouteGuard requiredModule={MODULES.PAYSLIP}>
      <>
        <AppNavigation />
        <div className="min-h-screen bg-gray-100">
          <div className="border-b border-border bg-white shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="rounded-lg">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </Link>
                  <Image
                    src="/images/design-mode/PixxelPrint%20Logo%20Design.png"
                    alt="PixxelPrint Solution"
                    width={120}
                    height={40}
                  />
                  <h1 className="text-2xl font-bold text-gray-900">Edit Payslip</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleSaveDraft} className="rounded-lg bg-transparent">
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button onClick={handleGeneratePayslip} className="rounded-lg bg-blue-600 hover:bg-blue-700">
                    Generate Payslip
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <Card className="rounded-lg border border-border bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Image
                      src={payslip.employeeAvatar || "/placeholder.svg"}
                      alt={payslip.employeeName}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{payslip.employeeName}</h2>
                      <p className="text-sm text-gray-600">{payslip.employeeRole}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Employee ID</p>
                      <p className="text-base font-semibold text-gray-900">{payslip.employeeId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Period</p>
                      <p className="text-base font-semibold text-gray-900">
                        {payslip.month} {payslip.year}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Section */}
              <Card className="rounded-lg border border-border bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle>Earnings</CardTitle>
                  <Dialog open={isEarningDialogOpen} onOpenChange={setIsEarningDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Custom Allowance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Custom Allowance</DialogTitle>
                        <DialogDescription>Add a new earning component to this payslip</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="earning-name">Component Name</Label>
                          <Input
                            id="earning-name"
                            placeholder="e.g., Travel Allowance"
                            value={newEarningName}
                            onChange={(e) => setNewEarningName(e.target.value)}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="earning-amount">Amount (₹)</Label>
                          <Input
                            id="earning-amount"
                            type="number"
                            placeholder="0"
                            value={newEarningAmount}
                            onChange={(e) => setNewEarningAmount(e.target.value)}
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEarningDialogOpen(false)} className="rounded-lg">
                          Cancel
                        </Button>
                        <Button onClick={handleAddEarning} className="rounded-lg bg-blue-600 hover:bg-blue-700">
                          Add
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {earnings.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 font-medium text-gray-900">{item.component}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">₹</span>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleEarningUpdate(item.id, Number.parseFloat(e.target.value) || 0)}
                            className="w-32 rounded-lg"
                          />
                          {earnings.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEarning(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Deductions Section */}
              <Card className="rounded-lg border border-border bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle>Deductions</CardTitle>
                  <Dialog open={isDeductionDialogOpen} onOpenChange={setIsDeductionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Custom Deduction
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Custom Deduction</DialogTitle>
                        <DialogDescription>Add a new deduction component to this payslip</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="deduction-name">Deduction Type</Label>
                          <Input
                            id="deduction-name"
                            placeholder="e.g., Loan Repayment"
                            value={newDeductionName}
                            onChange={(e) => setNewDeductionName(e.target.value)}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deduction-amount">Amount (₹)</Label>
                          <Input
                            id="deduction-amount"
                            type="number"
                            placeholder="0"
                            value={newDeductionAmount}
                            onChange={(e) => setNewDeductionAmount(e.target.value)}
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeductionDialogOpen(false)}
                          className="rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddDeduction} className="rounded-lg bg-blue-600 hover:bg-blue-700">
                          Add
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {deductions.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 font-medium text-gray-900">{item.type}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">₹</span>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleDeductionUpdate(item.id, Number.parseFloat(e.target.value) || 0)}
                            className="w-32 rounded-lg"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDeduction(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Totals Section */}
              <Card className="rounded-lg border border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-600">₹{totalEarnings.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">₹{totalDeductions.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">Net Salary</p>
                      <p className="text-3xl font-bold text-blue-600">₹{netSalary.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card className="rounded-lg border border-border bg-white">
                <CardHeader>
                  <CardTitle>Notes / Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add any notes or remarks for this payslip (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] rounded-lg"
                  />
                </CardContent>
              </Card>

              {/* Bottom Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Link href="/">
                  <Button variant="outline" className="rounded-lg bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSaveDraft} className="rounded-lg bg-transparent">
                    Save Draft
                  </Button>
                  <Button onClick={handleGeneratePayslip} className="rounded-lg bg-blue-600 hover:bg-blue-700">
                    Generate Payslip
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </RouteGuard>
  )
}
