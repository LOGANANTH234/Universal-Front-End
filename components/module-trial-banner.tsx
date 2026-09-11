"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, ShieldAlert, X, ArrowLeft } from "lucide-react"
import { fetchModuleTrial, ModuleTrialInfo } from "@/lib/api/module-trials"

interface ModuleTrialBannerProps {
  moduleCode?: string
  fallbackModuleCode?: string
  inlineLockout?: boolean
  children?: React.ReactNode
}

function formatModuleName(code: string): string {
  if (!code) return "Module"
  return code
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function formatValidTill(validTill: string | null): string | null {
  if (!validTill) return null
  try {
    const clean = validTill.trim().replace(" ", "T")
    const d = new Date(clean)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
  } catch {}
  return validTill
}

export function ModuleTrialBanner({ moduleCode, fallbackModuleCode, inlineLockout, children }: ModuleTrialBannerProps) {
  const [trial, setTrial] = useState<ModuleTrialInfo | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!moduleCode && !fallbackModuleCode) return

    let isMounted = true

    const loadTrial = async () => {
      try {
        let data: ModuleTrialInfo | null = null
        if (moduleCode) {
          data = await fetchModuleTrial(moduleCode)
        }
        if (!data && fallbackModuleCode) {
          data = await fetchModuleTrial(fallbackModuleCode)
        }
        if (isMounted) {
          setTrial(data)
        }
      } catch (err) {
        if (isMounted) setTrial(null)
      }
    }

    loadTrial()

    return () => {
      isMounted = false
    }
  }, [moduleCode, fallbackModuleCode])

  if (!trial || !trial.isTrialActive) {
    return <>{children}</>
  }

  const moduleDisplayName = formatModuleName(trial.moduleCode)
  const formattedExpiryDate = formatValidTill(trial.validTill)

  const handleCopyContact = () => {
    if (trial.contactOwner) {
      navigator.clipboard.writeText(trial.contactOwner)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // -------------------------------------------------------------
  // If expired, render the Lockout / Contact Screen
  // -------------------------------------------------------------
  if (trial.isExpired) {
    if (inlineLockout) {
      return (
        <div className="py-16 px-4 flex items-center justify-center animate-in fade-in duration-300 w-full">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-red-100 dark:border-red-950/60 max-w-lg w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                Trial Expired
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {moduleDisplayName} Access Expired
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                The free trial period for this feature ended on{" "}
                <span className="font-semibold text-gray-900 dark:text-slate-200">
                  {formattedExpiryDate || "the expiration date"}
                </span>.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
              {trial.contactOwner || "Contact owner to renew access."}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-100 dark:border-red-950/60 max-w-lg w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-full uppercase tracking-wider">
              Trial Expired
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {moduleDisplayName} Access Expired
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              The free trial period for the{" "}
              <span className="font-semibold text-gray-800 dark:text-slate-200">
                {moduleDisplayName}
              </span>{" "}
              module ended on{" "}
              <span className="font-semibold text-gray-900 dark:text-slate-200">
                {formattedExpiryDate || "the scheduled date"}
              </span>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {trial.contactOwner || "Contact owner to renew access."}
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow transition duration-150"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // If in active trial, render the top warning / notice banner + children
  // -------------------------------------------------------------
  const daysLeft = trial.daysRemaining
  const isUrgent = daysLeft <= 3

  return (
    <>
      {!isDismissed && (
        <div
          className={`w-full border-b transition-all duration-300 ${
            isUrgent
              ? "bg-gradient-to-r from-slate-950 via-rose-950 to-slate-950 text-slate-100 border-rose-900/50 shadow-md"
              : "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-slate-100 border-indigo-900/60 shadow-sm"
          }`}
        >
          <div className="w-full px-6 py-2 flex items-center justify-center flex-wrap gap-2.5 text-sm text-center">
            <span className={`p-1 rounded-md flex items-center justify-center shrink-0 ${
              isUrgent ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
            }`}>
              <Clock className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
              {moduleDisplayName} Trial
            </span>
            <span className="text-slate-300 text-xs sm:text-sm">
              This feature is on a free trial and expires in{" "}
              <strong className={`px-2 py-0.5 rounded-md font-bold text-xs sm:text-sm inline-block tracking-wide ${
                isUrgent
                  ? "text-rose-300 bg-rose-500/20 border border-rose-400/40 animate-pulse"
                  : "text-amber-300 bg-amber-400/15 border border-amber-400/30 shadow-inner"
              }`}>
                {daysLeft === 0 ? "less than 1 day" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
              </strong>
              {formattedExpiryDate && (
                <span className="ml-1 text-slate-300 font-medium">({formattedExpiryDate})</span>
              )}
              . Contact owner to renew access.
            </span>
            <button
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss banner"
              title="Dismiss notification"
              className="ml-1.5 p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition inline-flex items-center shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
