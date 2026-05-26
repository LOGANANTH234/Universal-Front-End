"use client"

import Link from "next/link"
import { ArrowRight, Clock, Users, ShieldCheck, FileText, Calendar, ClipboardEdit, DollarSign, Gift, Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

const modules = [
  { icon: Users,         label: "Employee Management",  desc: "Add, edit, deactivate and sync employee biometrics to Hikvision devices." },
  { icon: Calendar,      label: "Shift Management",     desc: "Configure regular and overtime shifts with break and lunch windows." },
  { icon: Clock,         label: "Live Attendance",      desc: "Real-time present / absent / late feed pulled from biometric devices." },
  { icon: ShieldCheck,   label: "Role-Based Access",    desc: "Granular module and action-level permissions for every role." },
  { icon: FileText,      label: "Payslip & Salary",     desc: "Generate and download payslips. Payroll-ready salary breakdown." },
  { icon: Gift,          label: "Holiday Management",   desc: "Define holidays that auto-factor into attendance calculations." },
  { icon: ClipboardEdit, label: "View & Edit Punches",  desc: "Review and correct punch records across any date range." },
  { icon: DollarSign,    label: "Salary Reports",       desc: "Consolidated salary view and daily breakdowns for payroll." },
  { icon:DollarSign,    label: "Advance Management",   desc: "Track salary advances, manage deductions, and monitor employee balances." },
]

export default function HomePage() {
  const { dark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">

      {/* ── NAV ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md flex items-center px-6 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">AttendIQ</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {[["Modules", "#modules"], ["Features", "#features"], ["Access", "#access"]].map(([label, href]) => (
            <a key={label} href={href}
              className="px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link href="/login"
            className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors">
            Login <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Hikvision Biometric Integration · v AM04
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
          Workforce attendance,<br />
          <span className="text-blue-600">managed precisely.</span>
        </h1>
        <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto mb-10">
          AttendIQ connects to your Hikvision biometric devices and gives HR teams a complete view —
          live attendance, shift scheduling, payslips, and role-based access — all in one platform.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login"
            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm">
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#modules"
            className="h-10 px-6 border border-neutral-200 dark:border-neutral-700 text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
            Explore modules
          </a>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────── */}
      <section className="border-y border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-neutral-200 dark:divide-neutral-800">
          {[
            { val: "10+",  label: "Modules" },
            { val: "Live", label: "Real-time Feed" },
            { val: "JWT",  label: "Secure Auth" },
            { val: "360°", label: "Employee View" },
          ].map(s => (
            <div key={s.label} className="py-6 text-center">
              <div className="text-2xl font-bold tracking-tight">{s.val}</div>
              <div className="text-xs text-neutral-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULES ───────────────────────────────────── */}
      <section id="modules" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-blue-600 mb-3">Platform</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Everything in one place</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 max-w-md mx-auto leading-relaxed">
            Every module your HR team needs — from device sync to payroll-ready reports.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {modules.map(({ icon: Icon, label, desc }) => (
            <div key={label}
              className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-4">
                <Icon className="w-[18px] h-[18px] text-blue-600" />
              </div>
              <div className="text-sm font-semibold mb-1.5">{label}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE ATTENDANCE FEATURE ───────────────────── */}
      <section id="features" className="py-16 px-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-blue-600 mb-3">Live Attendance</p>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Real-time presence.<br />Zero guesswork.</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
              Punch data flows directly from Hikvision biometric devices. Supervisors see
              present, absent, and late employees in real time and can correct records on the spot.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Hikvision API", "Auto token refresh", "Punch editing", "Shift overlap detection"].map(t => (
                <span key={t} className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-md px-2.5 py-1 text-neutral-500 dark:text-neutral-400 font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-neutral-400 font-mono">live · today</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { name: "Present", pct: 72, color: "bg-blue-500" },
                { name: "Late",    pct: 18, color: "bg-amber-400" },
                { name: "Absent",  pct: 10, color: "bg-red-400"   },
              ].map(r => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 w-14">{r.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="text-xs text-neutral-400 font-mono w-8 text-right">{r.pct}%</span>
                </div>
              ))}
              <div className="pt-1 space-y-1">
                {[
                  { id: "EMP001", status: "Present", color: "text-blue-500"  },
                  { id: "EMP002", status: "Late",    color: "text-amber-500" },
                  { id: "EMP003", status: "Absent",  color: "text-red-500"   },
                ].map(r => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                    <span className="text-xs font-mono text-neutral-600 dark:text-neutral-300">{r.id}</span>
                    <span className={`text-[11px] font-medium ${r.color}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACCESS CONTROL ────────────────────────────── */}
      <section id="access" className="py-16 px-6 max-w-4xl mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase text-blue-600 mb-3">Access Control</p>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Granular permissions, every role covered</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-lg leading-relaxed">
          Every action in AttendIQ is gated by a permission. Assign roles with precise capabilities — nothing more, nothing less.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            "Shift Create / Edit / Delete", "Employee Add / Deactivate",
            "Live Attendance View & Edit",  "Role Manage & Assign",
            "Payslip View & Download",      "Salary View",
            "Holiday Edit & View",          "Punch Record View & Edit",
            "Employee 360° View",           "User Password Update",
            "Biometric Photo Sync",         "Employee Group Scoping",
          ].map(p => (
            <div key={p}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-400 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">Ready to get started?</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
            Sign in to your AttendIQ dashboard — secure, fast, and always in sync with your biometric devices.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            Sign in to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 px-6 py-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
            <Clock className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold">AttendIQ</span>
        </div>
        <span className="text-xs text-neutral-400">© 2026 Attendance Management System</span>
        <span className="text-xs text-neutral-400 font-mono">v AM04</span>
      </footer>
    </div>
  )
}
