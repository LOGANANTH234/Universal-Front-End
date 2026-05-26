"use client"

import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ChangePasswordModalProps {
  employeeName: string
  open: boolean
  onClose: () => void
  onSubmit: (newPassword: string, confirmPassword: string) => Promise<void>
}

export default function ChangePasswordModal({
  employeeName,
  open,
  onClose,
  onSubmit,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{
    newPassword?: string
    confirmPassword?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!newPassword.trim()) {
      newErrors.newPassword = "Password fields cannot be empty"
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Password fields cannot be empty"
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setMessage(null)

    try {
      await onSubmit(newPassword, confirmPassword)
      setMessage({
        type: "success",
        text: "Password updated successfully.",
      })
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (error: any) {
      const errorMessage = error?.message || "Unable to update password. Please try again."
      setMessage({
        type: "error",
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNewPassword("")
    setConfirmPassword("")
    setErrors({})
    setMessage(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Change Password</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              New Password
            </label>
            <Input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (errors.newPassword) {
                  setErrors({ ...errors, newPassword: undefined })
                }
              }}
              disabled={loading}
              className={`h-11 ${
                errors.newPassword
                  ? "border-red-500 dark:border-red-400"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: undefined })
                }
              }}
              disabled={loading}
              className={`h-11 ${
                errors.confirmPassword
                  ? "border-red-500 dark:border-red-400"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-md text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  )
}
