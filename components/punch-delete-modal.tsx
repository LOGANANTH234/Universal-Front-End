'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, AlertCircle } from 'lucide-react'

interface Punch {
  id: string
  type: 'IN' | 'OUT'
  time: string
  date: string
  note?: string
}

interface PunchDeleteModalProps {
  punch: Punch
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (punchId: string) => Promise<void>
}

export default function PunchDeleteModal({ punch, open, onOpenChange, onConfirm }: PunchDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [validationMessages, setValidationMessages] = useState<string[]>([])

  // Reset validation messages when modal opens
  useEffect(() => {
    if (open) {
      setValidationMessages([])
    }
  }, [open])

  const handleConfirmDelete = async () => {
    setIsLoading(true)
    setValidationMessages([])

    try {
      await onConfirm(punch.id)
      // If no error was thrown, close the dialog
      onOpenChange(false)
    } catch (error) {
      // Extract validation messages from error if they exist
      const errorMsg = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      
      try {
        const messages = JSON.parse(errorMsg)
        if (Array.isArray(messages)) {
          setValidationMessages(messages)
          // Keep dialog open to display validation messages
          return
        }
      } catch {
        // Not validation messages, treat as generic error - parent toast will handle it
      }
      
      // Generic error - close dialog and let parent toast handle it
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle size={24} />
            <DialogTitle className="text-xl font-bold">Delete Punch?</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Are you sure you want to delete this punch?<br />
            The paired IN/OUT record will also be deleted.
          </DialogDescription>
        </DialogHeader>

        {validationMessages.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
            {validationMessages.map((message, index) => (
              <div key={index} className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-900 dark:text-red-100">{message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Confirm Delete'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
