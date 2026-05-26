"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WarningDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function WarningDialog({ isOpen, title, message, onConfirm, onCancel }: WarningDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header with Icon */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-11 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-md"
            >
              Continue Anyway
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
