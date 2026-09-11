"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useTheme } from "@/hooks/use-theme"
import {
  Sliders,
  DollarSign,
  AlertTriangle,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
  Info,
  Clock,
  TrendingUp,
  Percent,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import { TimePickerCompact } from "@/components/time-picker-compact"
import { to12HourFormat } from "@/lib/shift-utils"

interface AppSettings {
  penaltyDeductionEnabled: boolean
  warningsBeforePenalty: number
  themeMode: "dark" | "light"
  penaltyDeductionMinutes: number
  allowanceEligibilityPercent: number
  overtimeMinimumMinutes: number
  dailySalaryCalculationTime: string
}

export function SettingsScreen() {
  const { auth } = useAuth()
  const token = auth?.token
  const { dark, setTheme } = useTheme()
  const canEdit = useHasAction(MODULES.SETTINGS, ACTIONS.SETTINGS_EDIT)

  const [settings, setSettings] = useState<AppSettings>({
    penaltyDeductionEnabled: true,
    warningsBeforePenalty: 3,
    themeMode: dark ? "dark" : "light",
    penaltyDeductionMinutes: 60,
    allowanceEligibilityPercent: 50,
    overtimeMinimumMinutes: 30,
    dailySalaryCalculationTime: "06:30",
  })

  const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const getApiBase = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.206.112.19:8080"
  }

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      if (!token) return
      setLoading(true)
      try {
        const baseUrl = getApiBase()
        const res = await fetch(`${baseUrl}/api/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to load settings (status ${res.status})`)
        }

        const data: AppSettings = await res.json()
        setSettings(data)
        setOriginalSettings(data)

        if (data.themeMode) {
          setTheme(data.themeMode)
        }
      } catch (err: any) {
        console.error("Error fetching settings:", err)
        setOriginalSettings({
          penaltyDeductionEnabled: true,
          warningsBeforePenalty: 3,
          themeMode: dark ? "dark" : "light",
          penaltyDeductionMinutes: 60,
          allowanceEligibilityPercent: 50,
          overtimeMinimumMinutes: 30,
          dailySalaryCalculationTime: "06:30",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [token])

  // Handle Theme Toggle
  const handleThemeChange = (mode: "dark" | "light") => {
    if (!canEdit) return
    setSettings((prev) => ({ ...prev, themeMode: mode }))
    setTheme(mode)
  }

  // Save Settings
  const handleSave = async () => {
    if (!token || !canEdit) return
    setSaving(true)
    setNotice(null)

    try {
      const baseUrl = getApiBase()
      const res = await fetch(`${baseUrl}/api/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        throw new Error(`Failed to save settings (status ${res.status})`)
      }

      const updated: AppSettings = await res.json()
      setSettings(updated)
      setOriginalSettings(updated)
      setTheme(updated.themeMode)

      setNotice({
        type: "success",
        text: "Settings successfully saved and persisted to environment_settings.",
      })
    } catch (err: any) {
      console.error("Error saving settings:", err)
      setNotice({
        type: "error",
        text: err?.message || "Failed to save settings.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings)
      setTheme(originalSettings.themeMode)
      setNotice({ type: "info", text: "Settings restored to saved values." })
    }
  }

  const isDirty = originalSettings
    ? settings.penaltyDeductionEnabled !== originalSettings.penaltyDeductionEnabled ||
    settings.warningsBeforePenalty !== originalSettings.warningsBeforePenalty ||
    settings.themeMode !== originalSettings.themeMode ||
    settings.penaltyDeductionMinutes !== originalSettings.penaltyDeductionMinutes ||
    settings.allowanceEligibilityPercent !== originalSettings.allowanceEligibilityPercent ||
    settings.overtimeMinimumMinutes !== originalSettings.overtimeMinimumMinutes
    : false

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-gray-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-red-600 dark:text-red-500" />
        <p className="text-sm font-medium">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              System environment policies, penalty calculation rules, and display mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!canEdit ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold shadow-xs">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>View Only</span>
            </div>
          ) : (
            <>
              {isDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={saving}
                  className="border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className={`gap-1.5 font-medium transition-all ${isDirty
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer"
                    : "bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed"
                  }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* View-Only Info Banner if user cannot edit */}
      {!canEdit && (
        <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-center gap-2.5 text-xs font-medium">
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>You currently have <strong>view-only</strong> access to Settings. Modification and saving permissions are not granted for your role.</span>
        </div>
      )}

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-sm transition-all ${notice.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
              : notice.type === "error"
                ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200"
            }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : notice.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{notice.text}</div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Columns Table View */}
      <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-800/70 border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3.5 border-r border-gray-200 dark:border-slate-800">Setting</th>
                <th className="px-6 py-3.5 border-r border-gray-200 dark:border-slate-800">Description</th>
                <th className="px-6 py-3.5 text-right">Configure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-sm">

              {/* Column Row 1: Penalty Deduction */}
              <tr className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span>Minus Penalty Amount</span>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl border-r border-gray-200 dark:border-slate-800">
                  Controls whether penalty duration is deducted from salary when employee late arrival exceeds the warning threshold.
                </td>

                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <label className={`relative inline-flex items-center ${canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={settings.penaltyDeductionEnabled}
                      onChange={(e) => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          penaltyDeductionEnabled: e.target.checked,
                        }))
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </td>
              </tr>

              {/* Column Row 2: Penalty Deduction Duration */}
              <tr className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>Penalty Deduction Duration</span>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl border-r border-gray-200 dark:border-slate-800">
                  <div>Duration in minutes deducted from payable work time when late penalty triggers.</div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
                    {settings.penaltyDeductionMinutes} minutes ({Number((settings.penaltyDeductionMinutes / 60).toFixed(1))} hr) deducted per incident
                  </div>
                </td>

                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <div className={`inline-flex items-center border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden ${!canEdit ? "opacity-60 bg-gray-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800"}`}>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          penaltyDeductionMinutes: Math.max(0, prev.penaltyDeductionMinutes - 15),
                        }))
                      }}
                      className={`px-2.5 py-1 font-bold text-sm ${canEdit
                          ? "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                          : "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      disabled={!canEdit}
                      min="0"
                      max="480"
                      step="15"
                      value={settings.penaltyDeductionMinutes}
                      onChange={(e) => {
                        if (!canEdit) return
                        const val = Number.parseInt(e.target.value, 10)
                        setSettings((prev) => ({
                          ...prev,
                          penaltyDeductionMinutes: isNaN(val) ? 0 : Math.max(0, val),
                        }))
                      }}
                      className={`w-14 text-center text-xs font-bold text-gray-900 dark:text-white bg-transparent focus:outline-none ${!canEdit ? "cursor-not-allowed" : ""}`}
                    />
                    <span className="text-[11px] text-gray-400 pr-2">min</span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          penaltyDeductionMinutes: prev.penaltyDeductionMinutes + 15,
                        }))
                      }}
                      className={`px-2.5 py-1 font-bold text-sm ${canEdit
                          ? "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                          : "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>

              {/* Column Row 3: Warnings Threshold */}
              <tr className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span>Warning Threshold</span>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl border-r border-gray-200 dark:border-slate-800">
                  <div>Number of permissible monthly late warnings before salary deduction triggers.</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                    {settings.warningsBeforePenalty === 0
                      ? "Immediate deduction on the 1st late incident"
                      : `${settings.warningsBeforePenalty} free warning(s) — Penalty begins on incident #${settings.warningsBeforePenalty + 1}`}
                  </div>
                </td>

                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <div className={`inline-flex items-center border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden ${!canEdit ? "opacity-60 bg-gray-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800"}`}>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          warningsBeforePenalty: Math.max(0, prev.warningsBeforePenalty - 1),
                        }))
                      }}
                      className={`px-2.5 py-1 font-bold text-sm ${canEdit
                          ? "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                          : "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      disabled={!canEdit}
                      min="0"
                      max="31"
                      value={settings.warningsBeforePenalty}
                      onChange={(e) => {
                        if (!canEdit) return
                        const val = Number.parseInt(e.target.value, 10)
                        setSettings((prev) => ({
                          ...prev,
                          warningsBeforePenalty: isNaN(val) ? 0 : Math.max(0, val),
                        }))
                      }}
                      className={`w-12 text-center text-xs font-bold text-gray-900 dark:text-white bg-transparent focus:outline-none ${!canEdit ? "cursor-not-allowed" : ""}`}
                    />
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          warningsBeforePenalty: prev.warningsBeforePenalty + 1,
                        }))
                      }}
                      className={`px-2.5 py-1 font-bold text-sm ${canEdit
                          ? "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                          : "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>

              {/* Column Row 4: Allowance Eligibility Threshold */}
              <tr className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <Percent className="w-4 h-4" />
                    </div>
                    <span>Allowance Eligibility Threshold</span>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl border-r border-gray-200 dark:border-slate-800">
                  <div>Minimum percentage of shift duration an employee must work (post-penalty) to earn their extra daily allowance.</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    {settings.allowanceEligibilityPercent === 0
                      ? "No minimum required (allowance always awarded)"
                      : `Requires at least ${settings.allowanceEligibilityPercent}% shift presence`}
                  </div>
                </td>

                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <div className={`inline-flex items-center border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden ${!canEdit ? "opacity-60 bg-gray-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800"}`}>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          allowanceEligibilityPercent: Math.max(0, prev.allowanceEligibilityPercent - 5),
                        }))
                      }}
                      className={`px-2.5 py-1 font-bold text-sm ${canEdit
                          ? "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                          : "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      disabled={!canEdit}
                      min="0"
                      max="100"
                      step="5"
                      value={settings.allowanceEligibilityPercent}
                      onChange={(e) => {
                        if (!canEdit) return
                        const val = Number.parseInt(e.target.value, 10)
                        setSettings((prev) => ({
                          ...prev,
                          allowanceEligibilityPercent: isNaN(val) ? 0 : Math.min(100, Math.max(0, val)),
                        }))
                      }}
                      className={`w-12 text-center text-xs font-bold text-gray-900 dark:text-white bg-transparent focus:outline-none ${!canEdit ? "cursor-not-allowed" : ""}`}
                    />
                    <span className="text-[11px] text-gray-400 pr-2">%</span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          allowanceEligibilityPercent: Math.min(100, prev.allowanceEligibilityPercent + 5),
                        }))
                      }}
                      className={`px-2.5 py-1 font-bold text-sm ${canEdit
                          ? "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                          : "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>

              {/* Column Row 5: Overtime Minimum Threshold */}
              <tr className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span>Overtime Minimum Threshold</span>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl border-r border-gray-200 dark:border-slate-800">
                  <div>Minimum extra minutes worked in an overtime shift window before overtime compensation begins calculating.</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                    {settings.overtimeMinimumMinutes === 0
                      ? "All overtime minutes counted (no minimum threshold)"
                      : `Requires at least ${settings.overtimeMinimumMinutes} mins extra work before OT applies`}
                  </div>
                </td>

                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <div className={`inline-flex items-center border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden ${!canEdit ? "opacity-60 bg-gray-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800"}`}>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          overtimeMinimumMinutes: Math.max(0, prev.overtimeMinimumMinutes - 5),
                        }))
                      }}
                      className={`px-2.5 py-1 font-bold text-sm ${canEdit
                          ? "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                          : "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      disabled={!canEdit}
                      min="0"
                      max="240"
                      step="5"
                      value={settings.overtimeMinimumMinutes}
                      onChange={(e) => {
                        if (!canEdit) return
                        const val = Number.parseInt(e.target.value, 10)
                        setSettings((prev) => ({
                          ...prev,
                          overtimeMinimumMinutes: isNaN(val) ? 0 : Math.max(0, val),
                        }))
                      }}
                      className={`w-14 text-center text-xs font-bold text-gray-900 dark:text-white bg-transparent focus:outline-none ${!canEdit ? "cursor-not-allowed" : ""}`}
                    />
                    <span className="text-[11px] text-gray-400 pr-2">min</span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return
                        setSettings((prev) => ({
                          ...prev,
                          overtimeMinimumMinutes: prev.overtimeMinimumMinutes + 5,
                        }))
                      }}
                      className={`px-2.5 py-1 font-bold text-sm ${canEdit
                          ? "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                          : "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>

              {/* Column Row 6: Daily Salary Auto-Calculation Schedule */}
              <tr className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>Daily Salary Schedule</span>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl border-r border-gray-200 dark:border-slate-800">
                  <div>Time of day (IST) when the background scheduler automatically closes open shifts and calculates yesterday's daily salary for all active employees.</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                    Scheduled daily at: {to12HourFormat(settings.dailySalaryCalculationTime || "06:30")} IST (Recommended: 05:00 AM – 08:00 AM)
                  </div>
                </td>

                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <div className="flex flex-col items-end gap-2">
                    <div className="w-36">
                      <TimePickerCompact
                        value={settings.dailySalaryCalculationTime || "06:30"}
                        onChange={(val) => {
                          if (!canEdit) return
                          setSettings((prev) => ({
                            ...prev,
                            dailySalaryCalculationTime: val,
                          }))
                        }}
                        disabled={!canEdit}
                        align="right"
                      />
                    </div>

                    {/* Quick preset buttons */}
                    <div className="flex items-center gap-1">
                      {["05:30", "06:00", "06:30", "07:00", "07:30", "08:00"].map((preset) => {
                        const isSelected = (settings.dailySalaryCalculationTime || "06:30") === preset
                        return (
                          <button
                            key={preset}
                            type="button"
                            disabled={!canEdit}
                            onClick={() => {
                              if (!canEdit) return
                              setSettings((prev) => ({ ...prev, dailySalaryCalculationTime: preset }))
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${isSelected
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700"
                              } ${!canEdit ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                          >
                            {to12HourFormat(preset)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </td>
              </tr>

              {/* Column Row 7: Theme Mode */}
              <tr className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {settings.themeMode === "dark" ? (
                        <Moon className="w-4 h-4" />
                      ) : (
                        <Sun className="w-4 h-4" />
                      )}
                    </div>
                    <span>Theme Mode</span>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl border-r border-gray-200 dark:border-slate-800">
                  Choose default application visual display theme (Dark Mode / Light Mode).
                </td>

                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <div className={`inline-flex rounded-lg border border-gray-200 dark:border-slate-700 p-0.5 ${!canEdit ? "opacity-60 bg-gray-100/70 dark:bg-slate-800/60 cursor-not-allowed" : "bg-gray-100 dark:bg-slate-800"}`}>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleThemeChange("light")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${!canEdit
                          ? "cursor-not-allowed text-gray-400 dark:text-slate-500"
                          : settings.themeMode === "light"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Light
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleThemeChange("dark")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${!canEdit
                          ? "cursor-not-allowed text-gray-400 dark:text-slate-500"
                          : settings.themeMode === "dark"
                            ? "bg-slate-900 dark:bg-slate-950 text-white shadow-sm ring-1 ring-slate-700"
                            : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      Dark
                    </button>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
