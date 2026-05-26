"use client"

import { Loader2 } from "lucide-react"

interface PayslipDownloadLoaderProps {
  isLoading: boolean
  employeeName: string
}

export function PayslipDownloadLoader({ isLoading, employeeName }: PayslipDownloadLoaderProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} />

      {/* Centered loader content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="rounded-full bg-background p-6 shadow-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Payslip is downloading for {employeeName}…</p>
        </div>
      </div>
    </div>
  )
}
