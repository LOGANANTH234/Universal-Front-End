"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { mockPayslips } from "@/lib/payslip-data"
import Image from "next/image"
import { AppNavigation } from "@/components/app-navigation"
import { useEffect } from "react"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const payslipId = searchParams.get("id")
  const shouldDownload = searchParams.get("download")

  const payslip = mockPayslips.find((p) => p.id === payslipId)

  useEffect(() => {
    if (shouldDownload === "true") {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [shouldDownload])

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
          {/* Header - Hide on print */}
          <div className="border-b border-border bg-white print:hidden shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="rounded-lg">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </Link>
                  <h1 className="text-2xl font-bold text-gray-900">Payslip Preview</h1>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg print:shadow-none">
                <div className="p-8 print:p-8">
                  <div className="flex flex-col items-center mb-6">
                    <Image
                      src="/images/design-mode/v0_image-2.png"
                      alt="PixxelPrint Solution"
                      width={150}
                      height={50}
                      className="mb-4 text-white bg-popover"
                    />
                    <h2 className="text-lg font-bold text-gray-800">
                      Salary Statement for the month of {payslip.month}/{payslip.year}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-6 text-sm">
                    <div className="flex">
                      <span className="font-medium w-32">Employee Name : </span>
                      <span className="text-blue-600 font-semibold text-sm">{payslip.employeeName}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">PAN : </span>
                      <span className="text-blue-600 font-semibold text-sm">XXXXX1234X</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">Pay Days : </span>
                      <span className="font-semibold text-sm text-blue-600">31</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Designation : </span>
                      <span className="text-blue-600 font-semibold text-sm">{payslip.employeeRole}</span>
                    </div>
                  </div>

                  <div className="border border-gray-800 mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left px-3 py-0 font-bold border-r border-gray-800 h-7 align-middle">
                            Earnings
                          </th>
                          <th className="text-right py-0 font-bold h-7 align-middle px-3 w-6/12">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">BASIC</td>
                          <td className="px-3 py-0 text-right h-6 align-middle">
                            {payslip.basicPay.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">HRA</td>
                          <td className="px-3 py-0 text-right h-6 align-middle">
                            {payslip.shiftPay.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">Spl Allowa</td>
                          <td className="px-3 py-0 text-right h-6 align-middle">
                            {payslip.overtime.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">Travel All</td>
                          <td className="px-3 py-0 text-right h-6 align-middle">
                            {payslip.allowances.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">Medical Al</td>
                          <td className="px-3 py-0 text-right h-6 align-middle">
                            {payslip.lunchAllowance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">Food Allow</td>
                          <td className="px-3 py-0 text-right h-6 align-middle">1,500.00</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">PF</td>
                          <td className="px-3 py-0 text-right text-red-600 h-6 align-middle">
                            {1800 > 0
                              ? `-${(1800).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                              : (1800).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">PT</td>
                          <td className="px-3 py-0 text-right text-red-600 h-6 align-middle">
                            {210 > 0
                              ? `-${(210).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                              : (210).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-3 py-0 border-r border-gray-800 h-6 align-middle">Insurance</td>
                          <td className="px-3 py-0 text-right text-red-600 h-6 align-middle">
                            {663 > 0
                              ? `-${(663).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                              : (663).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-800 font-bold">
                          <td className="px-3 py-0 border-r border-gray-800 h-7 align-middle">Total Earnings</td>
                          <td className="px-3 py-0 text-right h-7 align-middle">
                            {payslip.totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-800 font-bold">
                          <td className="px-3 py-0 border-r border-gray-800 h-7 align-middle">Total Deductions</td>
                          <td className="px-3 py-0 text-right text-red-600 h-7 align-middle">
                            {payslip.totalDeductions > 0
                              ? `-${payslip.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                              : payslip.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-800 font-bold bg-blue-50">
                          <td className="px-3 py-0 border-r border-gray-800 h-7 align-middle">Net Pay</td>
                          <td className="px-3 py-0 text-right text-blue-600 h-7 align-middle">
                            {payslip.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-right mt-8">
                    <div className="inline-block"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </RouteGuard>
  )
}
