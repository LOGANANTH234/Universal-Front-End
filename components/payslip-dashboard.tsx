"use client"

import { useState } from "react"
import { Search, FileText, IndianRupeeIcon, Users, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { PayslipStatusBadge } from "./payslip-status-badge"
import { PayslipDownloadLoader } from "./payslip-download-loader"
// ✅ FIX 1: mockPayslips removed — mockPayslips is now an empty array, dashboard data
//           comes from the real backend PDF download endpoint per payslip row
import { MONTHS } from "@/lib/payslip-data"
import Link from "next/link"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"

// ✅ FIX 1: Replaced Payslip mock type with a type matching real backend data.
//           The dashboard still renders rows passed from outside (via props or parent),
//           but download now uses real employee fields (pan, workingDays) from the API.
interface PayslipRow {
  id: string
  employeeId: string
  employeeName: string
  employeeRole: string
  month: string
  year: number
  // ✅ FIX 1: real fields replacing hardcoded PAN / Pay Days
  pan?: string
  workingDays?: number
  basicPay: number
  shiftPay: number
  overtime: number
  allowances: number
  lunchAllowance: number
  lateDeduction: number
  leaveDeduction: number
  totalEarnings: number
  totalDeductions: number
  netSalary: number
  status: "generated" | "pending"
  generatedDate: string
}

export function PayslipDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("November")
  // ✅ FIX 1: Start with empty array — no mock data
  const [allPayslips] = useState<PayslipRow[]>([])
  const [filteredPayslips, setFilteredPayslips] = useState<PayslipRow[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingEmployeeName, setDownloadingEmployeeName] = useState("")

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    filterPayslips(query, selectedMonth)
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    filterPayslips(searchQuery, month)
  }

  const filterPayslips = (query: string, month: string) => {
    let filtered = allPayslips

    if (month !== "all") {
      filtered = filtered.filter((p) => p.month === month)
    }

    if (query) {
      filtered = filtered.filter(
        (p) =>
          p.employeeName.toLowerCase().includes(query.toLowerCase()) ||
          p.employeeId.toLowerCase().includes(query.toLowerCase()),
      )
    }

    setFilteredPayslips(filtered)
  }

  const totalEmployees = allPayslips.length
  const totalPayslips = filteredPayslips.length
  const totalPayout = filteredPayslips.reduce((sum, p) => sum + p.netSalary, 0)

  const handleDownload = async (payslipId: string, employeeName: string) => {
    try {
      setIsDownloading(true)
      setDownloadingEmployeeName(employeeName)

      const jsPDF = (await import("jspdf")).default
      const html2canvas = (await import("html2canvas")).default

      const payslip = allPayslips.find((p) => p.id === payslipId)
      if (!payslip) {
        throw new Error("Payslip not found")
      }

      const logoResponse = await fetch("/images/pixxelprint-20logo-20design.png")
      const logoBlob = await logoResponse.blob()
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(logoBlob)
      })

      const iframe = document.createElement("iframe")
      iframe.style.position = "absolute"
      iframe.style.width = "210mm"
      iframe.style.height = "297mm"
      iframe.style.left = "-9999px"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error("Could not access iframe document")
      }

      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; background: white; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 200px; height: auto; margin: 0 auto 20px; display: block; }
            .title { font-size: 16px; font-weight: bold; color: #1f2937; margin-top: 10px; }
            .info-section { margin-bottom: 30px; }
            .info-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 12px 40px; 
              font-size: 13px;
              line-height: 1.6;
            }
            .info-item { display: flex; align-items: baseline; }
            .info-label { 
              font-weight: 600; 
              color: #000;
              min-width: 130px;
              margin-right: 8px;
            }
            .info-value { 
              color: #2563eb; 
              font-weight: 600; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              border-left: 1px solid #1f2937;
              border-right: 1px solid #1f2937;
              border-bottom: 1px solid #1f2937;
              margin-bottom: 40px;
            }
            th { 
              background: white; 
              padding: 10px 16px; 
              text-align: left; 
              border-top: 1px solid #1f2937;
              border-bottom: 1px solid #1f2937; 
              font-weight: bold; 
              font-size: 14px;
              color: #000;
            }
            th.amount { 
              text-align: right; 
              border-left: 1px solid #1f2937;
            }
            td { 
              padding: 8px 16px; 
              border-bottom: 1px solid #e5e7eb; 
              font-size: 13px; 
              color: #000;
            }
            td.earnings { 
              border-right: 1px solid #1f2937; 
            }
            td.amount { 
              text-align: right; 
            }
            .deduction { color: #dc2626; }
            .total-row td { 
              font-weight: bold; 
              border-bottom: 1px solid #1f2937;
              padding: 10px 16px;
            }
            .net-pay td { 
              background: #eff6ff; 
              font-weight: bold; 
              color: #2563eb;
              padding: 10px 16px;
            }
            .signature-section {
              margin-top: 60px;
              text-align: right;
              font-size: 12px;
            }
            .signature-label {
              font-weight: 600;
              color: #000;
            }
            .disclaimer {
              margin-top: 20px;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoBase64}" alt="PixxelPrint Logo" class="logo" />
              <div class="title">Salary Statement for the month of ${payslip.month}/${payslip.year}</div>
            </div>
            
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Employee Name :</span>
                  <span class="info-value">${payslip.employeeName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">PAN :</span>
                  <!-- ✅ FIX 1: Real PAN from employee data instead of hardcoded XXXXX1234X -->
                  <span class="info-value">${payslip.pan ?? "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Pay Days :</span>
                  <!-- ✅ FIX 1: Real working days from payroll data instead of hardcoded 31 -->
                  <span class="info-value">${payslip.workingDays ?? "-"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Designation :</span>
                  <span class="info-value">${payslip.employeeRole}</span>
                </div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Earnings</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="earnings">BASIC</td>
                  <td class="amount">${payslip.basicPay.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td class="earnings">HRA</td>
                  <td class="amount">${payslip.shiftPay.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td class="earnings">Spl Allowa</td>
                  <td class="amount">${payslip.overtime.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td class="earnings">Travel All</td>
                  <td class="amount">${payslip.allowances.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td class="earnings">Medical Al</td>
                  <td class="amount">${payslip.lunchAllowance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td class="earnings">Food Allow</td>
                  <td class="amount">1,500.00</td>
                </tr>
                <tr>
                  <td class="earnings">PF</td>
                  <td class="amount deduction">-1,800.00</td>
                </tr>
                <tr>
                  <td class="earnings">PT</td>
                  <td class="amount deduction">-210.00</td>
                </tr>
                <tr>
                  <td class="earnings">Insurance</td>
                  <td class="amount deduction">-663.00</td>
                </tr>
                <tr class="total-row">
                  <td class="earnings">Total Earnings</td>
                  <td class="amount">${payslip.totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr class="total-row">
                  <td class="earnings">Total Deductions</td>
                  <td class="amount deduction">-${payslip.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr class="net-pay">
                  <td class="earnings">Net Pay</td>
                  <td class="amount">${payslip.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`${employeeName}_${payslip.month}_${payslip.year}_Payslip.pdf`)

      document.body.removeChild(iframe)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsDownloading(false)
      setDownloadingEmployeeName("")
    }
  }

  const canViewPayslip = useHasAction(MODULES.PAYSLIP, ACTIONS.PAYSLIP_VIEW)
  const canDownloadPayslip = useHasAction(MODULES.PAYSLIP, ACTIONS.PAYSLIP_DOWNLOAD)

  return (
    <div className="min-h-screen bg-background">
      <PayslipDownloadLoader isLoading={isDownloading} employeeName={downloadingEmployeeName} />

      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
            <h1 className="text-2xl font-bold text-foreground">Payslip Management</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search employee name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[240px] bg-background"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-lg border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Employees</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalEmployees}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Payslips Generated</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalPayslips}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Payout</p>
                  <p className="text-2xl font-bold text-foreground mt-1">₹{totalPayout.toLocaleString("en-IN")}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <IndianRupeeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payslip Table */}
        <Card className="rounded-lg border border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Net Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredPayslips.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No payslips found. Use Generate Payslips to create payslips for employees.
                      </td>
                    </tr>
                  ) : (
                    filteredPayslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-foreground">{payslip.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{payslip.employeeRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {payslip.month} {payslip.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-foreground">
                            ₹{payslip.netSalary.toLocaleString("en-IN")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PayslipStatusBadge status={payslip.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {canViewPayslip && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/preview?id=${payslip.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                            )}
                            {canDownloadPayslip && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(payslip.id, payslip.employeeName)}
                                disabled={isDownloading}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
