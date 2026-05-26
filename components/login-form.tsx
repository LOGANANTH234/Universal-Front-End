"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { Eye, EyeOff, ArrowRight, Sun, Moon, Clock } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

export function LoginForm() {
  const router      = useRouter()
  const { setAuth } = useAuth()
  const { dark, toggleTheme } = useTheme()

  const [employeeId, setEmployeeId]     = useState("")
  const [password, setPassword]         = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState("")
  const [isLoading, setIsLoading]       = useState(false)
  const [focused, setFocused]           = useState<"id" | "pw" | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!employeeId.trim() || !password.trim()) {
      setError("Please enter your Employee ID and password.")
      return
    }
    setIsLoading(true)
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ employeeId: employeeId.trim(), password }),
      })
      const data = await res.json()

      if (!res.ok || (data.validationMessages?.length ?? 0) > 0) {
        const msgs = Array.isArray(data.validationMessages)
          ? data.validationMessages : [data.validationMessages]
        setError(msgs.filter(Boolean).join(" ") || "Invalid credentials. Please try again.")
        setIsLoading(false)
        return
      }

      const expiresAt = (() => {
        try {
          const raw  = data.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
          const json = decodeURIComponent(
            atob(raw).split("").map((c: string) =>
              "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
            ).join("")
          )
          return JSON.parse(json).exp * 1000
        } catch { return Date.now() + 8 * 60 * 60 * 1000 }
      })()

      setAuth({
        token:        data.token,
        employeeId:   data.employeeId,
        employeeName: data.employeeName,
        roleName:     data.roleName ?? "",
        modules:      data.moduleTreeResponseDtoList ?? [],
        expiresAt,
      })
      router.replace("/live-attendance")
    } catch {
      setError("Unable to reach the server. Please check your connection.")
      setIsLoading(false)
    }
  }

  const inputCls = (field: "id" | "pw") =>
    [
      "w-full h-10 px-3 rounded-lg text-sm outline-none transition-all border",
      "bg-white dark:bg-neutral-900",
      "text-neutral-900 dark:text-neutral-100",
      "placeholder:text-neutral-300 dark:placeholder:text-neutral-600",
      focused === field
        ? "border-blue-500 ring-4 ring-blue-500/10"
        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600",
    ].join(" ")

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-neutral-950 transition-colors duration-200">

      {/* ── LEFT DARK PANEL ──────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-neutral-950 p-10 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-blue-500/8  blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">AttendIQ</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">
              Workforce Management
            </p>
            <h1 className="text-3xl font-bold text-white tracking-tight leading-tight mb-4">
              Attendance that works<br />as hard as you do.
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              From biometric punch-in to payslip generation — AttendIQ manages your entire
              workforce attendance lifecycle in one platform.
            </p>
          </div>
          <div className="border-t border-neutral-800">
            {[
              { n: "01", title: "Live Attendance Tracking",    desc: "Real-time data from Hikvision biometric devices." },
              { n: "02", title: "Shift & Overtime Management", desc: "Shifts with break and lunch windows per employee." },
              { n: "03", title: "Role-Based Access Control",   desc: "Module and action-level permissions per role." },
              { n: "04", title: "Payslip & Salary",            desc: "Generate and download payslips in one click." },
            ].map(f => (
              <div key={f.n} className="flex gap-4 py-4 border-b border-neutral-800">
                <span className="text-xs font-mono text-neutral-600 pt-0.5 w-6 shrink-0">{f.n}</span>
                <div>
                  <p className="text-sm font-medium text-neutral-200 mb-0.5">{f.title}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 relative z-10">
          {["JWT Secured", "Hikvision API", "v AM04"].map(t => (
            <span key={t} className="text-[11px] font-mono text-neutral-600 border border-neutral-800 rounded px-2 py-1">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-neutral-50 dark:bg-neutral-950 relative">

        <div className="absolute top-0 inset-x-0 h-14 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div className="flex items-center gap-2 lg:invisible">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight dark:text-white">AttendIQ</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="ml-auto w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-sm pt-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1.5">
              Welcome back
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Sign in with your Employee ID to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-wide">
                Employee ID
              </label>
              <input
                type="text"
                placeholder="e.g. EMP001"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                onFocus={() => setFocused("id")}
                onBlur={() => setFocused(null)}
                autoComplete="off"
                spellCheck={false}
                className={inputCls("id")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("pw")}
                  onBlur={() => setFocused(null)}
                  autoComplete="new-password"
                  className={`${inputCls("pw")} pr-10`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs text-neutral-300 dark:text-neutral-600">or</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>

          <a href="/" className="block text-center text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
            ← Back to home
          </a>
          <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-600 text-center leading-relaxed">
            No account? Contact your system administrator<br />to get access for your Employee ID.
          </p>
        </div>

        <p className="absolute bottom-4 text-xs text-neutral-300 dark:text-neutral-700">
          © 2026 AttendIQ · All rights reserved
        </p>
      </div>
    </div>
  )
}
