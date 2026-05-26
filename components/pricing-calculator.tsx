'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Users, Clock, Shield, FileText, BarChart3,
  AlertTriangle, PenLine, Lock,
  ArrowRight, CheckCircle2, Zap, Cpu, X, Phone, Mail,
  Building2, Send, Info, Star, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
//  Types & Data
// ─────────────────────────────────────────────────────────────

interface Module {
  id: string
  name: string
  description: string
  pricePerEmp: number      // per-employee monthly rate (0 if flatPrice is set)
  flatPrice?: number       // flat monthly fee regardless of employee count
  icon: React.ReactNode
  color: {
    bg: string; iconBg: string; iconText: string
    badge: string; badgeText: string; border: string; ring: string
  }
  mandatory: boolean
  dependsOn?: string[]
  popular?: boolean
}

const MODULES: Module[] = [
  // ── MANDATORY ──────────────────────────────────────────────
  {
    id: 'shift-mgmt', name: 'Shift Management',
    description: 'Create, edit & assign shifts with breaks, lunch windows and workday policies.',
    pricePerEmp: 25, icon: <Clock className="w-4 h-4" />, mandatory: true,
    color: { bg: 'bg-violet-50 dark:bg-violet-950/30', iconBg: 'bg-violet-100 dark:bg-violet-900/50', iconText: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 dark:bg-violet-900/60', badgeText: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', ring: 'ring-violet-400' },
  },
  {
    id: 'emp-mgmt', name: 'Employee Management',
    description: 'Add, edit, activate/deactivate employees and sync biometric photos.',
    pricePerEmp: 25, icon: <Users className="w-4 h-4" />, mandatory: true,
    color: { bg: 'bg-blue-50 dark:bg-blue-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconText: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/60', badgeText: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', ring: 'ring-blue-400' },
  },
  {
    id: 'salary', name: 'Salary',
    description: 'Daily, weekly & monthly payroll with overtime, late-penalty engine and payslip PDF.',
    pricePerEmp: 25, icon: <FileText className="w-4 h-4" />, mandatory: true,
    color: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconText: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/60', badgeText: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-400' },
  },
  {
    id: 'view-edit-punches', name: 'View & Edit Punches',
    description: 'Review, add, edit and delete attendance punch records with a full audit trail.',
    pricePerEmp: 25, icon: <PenLine className="w-4 h-4" />, mandatory: true,
    color: { bg: 'bg-orange-50 dark:bg-orange-950/30', iconBg: 'bg-orange-100 dark:bg-orange-900/50', iconText: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/60', badgeText: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', ring: 'ring-orange-400' },
  },
  // ── OPTIONAL ───────────────────────────────────────────────
  {
    id: 'live-attendance', name: 'Live Attendance',
    description: 'Real-time dashboard with live punch status and Hikvision biometric sync.',
    pricePerEmp: 30, icon: <Zap className="w-4 h-4" />, mandatory: false, popular: true,
    color: { bg: 'bg-sky-50 dark:bg-sky-950/30', iconBg: 'bg-sky-100 dark:bg-sky-900/50', iconText: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-100 dark:bg-sky-900/60', badgeText: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800', ring: 'ring-sky-400' },
    dependsOn: ['view-edit-punches'],
  },
  {
    id: 'emp-360', name: 'Employee 360°',
    description: 'Full profile — personal info, shift history, punch records and salary in one view.',
    pricePerEmp: 40, icon: <Users className="w-4 h-4" />, mandatory: false,
    color: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconBg: 'bg-indigo-100 dark:bg-indigo-900/50', iconText: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-900/60', badgeText: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', ring: 'ring-indigo-400' },
    dependsOn: ['emp-mgmt', 'salary'],
  },
  {
    id: 'payslip', name: 'Payslip',
    description: 'Employee-facing payslip viewer and downloader with PDF export.',
    pricePerEmp: 25, icon: <FileText className="w-4 h-4" />, mandatory: false,
    color: { bg: 'bg-teal-50 dark:bg-teal-950/30', iconBg: 'bg-teal-100 dark:bg-teal-900/50', iconText: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-100 dark:bg-teal-900/60', badgeText: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', ring: 'ring-teal-400' },
    dependsOn: ['salary'],
  },
  {
    id: 'role-mgmt', name: 'Role Management',
    description: 'Define roles with granular module and action permissions. Full RBAC control.',
    pricePerEmp: 0, flatPrice: 200, icon: <Shield className="w-4 h-4" />, mandatory: false,
    color: { bg: 'bg-rose-50 dark:bg-rose-950/30', iconBg: 'bg-rose-100 dark:bg-rose-900/50', iconText: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-100 dark:bg-rose-900/60', badgeText: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', ring: 'ring-rose-400' },
  },
  {
    id: 'warning', name: 'Attendance Warnings',
    description: 'Auto-generate and review warnings based on configurable late arrival policies.',
    pricePerEmp: 5, icon: <AlertTriangle className="w-4 h-4" />, mandatory: false,
    color: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', iconBg: 'bg-yellow-100 dark:bg-yellow-900/50', iconText: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-100 dark:bg-yellow-900/60', badgeText: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800', ring: 'ring-yellow-400' },
    dependsOn: ['live-attendance'],
  },
]

// ── Tiered pricing for mandatory modules ──────────────────
// Each tier defines the per-employee price per mandatory module
// and the employee count range it applies to.
interface PriceTier {
  label: string       // e.g. "1–10 employees"
  min: number
  max: number         // Infinity for the last tier
  pricePerModule: number  // same for all 4 mandatory modules
  coreTotal: number       // pricePerModule × 4
}

const PRICE_TIERS: PriceTier[] = [
  { label: '1–10 employees',  min: 1,  max: 10,       pricePerModule: 40, coreTotal: 160 },
  { label: '11–20 employees', min: 11, max: 20,        pricePerModule: 30, coreTotal: 120 },
  { label: '21–30 employees', min: 21, max: 30,        pricePerModule: 25, coreTotal: 100 },
  { label: '31–50 employees', min: 31, max: 50,        pricePerModule: 20, coreTotal:  80 },
  { label: '51+ employees',   min: 51, max: Infinity,  pricePerModule: 15, coreTotal:  60 },
]

function getTier(empCount: number): PriceTier {
  return PRICE_TIERS.find(t => empCount >= t.min && empCount <= t.max) ?? PRICE_TIERS[PRICE_TIERS.length - 1]
}

const MANDATORY_IDS = new Set(MODULES.filter(m => m.mandatory).map(m => m.id))
const SETUP_FEE = 30_000
const HARDWARE_FEE = 10_000
const ONE_TIME = SETUP_FEE + HARDWARE_FEE
const QUICK_COUNTS = [10, 25, 50, 100, 200, 500]

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

// ─────────────────────────────────────────────────────────────
//  useAnimatedNumber — smoothly counts up/down on value change
// ─────────────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration = 350) {
  const [display, setDisplay] = useState(target)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(target)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = display
    startTimeRef.current = null

    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time
      const elapsed = time - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startRef.current + (target - startRef.current) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return display
}

// ─────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.13em] uppercase text-muted-foreground mb-4">
      {children}
    </p>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(v => !v)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-foreground text-background text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </span>
      )}
    </span>
  )
}

function ModuleCard({
  module, selected, onToggle, allSelected, disabledReason, tierPrice,
}: {
  module: Module; selected: boolean; onToggle: () => void; allSelected: Set<string>; disabledReason?: string; tierPrice?: number
}) {
  const locked = module.mandatory
  const softDisabled = !!disabledReason && !locked
  const active = locked || (selected && !softDisabled)
  const dependencyNames = module.dependsOn
    ?.map(id => MODULES.find(m => m.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="relative">
      <button
        onClick={softDisabled || locked ? undefined : onToggle}
        disabled={locked}
        className={cn(
          'w-full text-left rounded-2xl border p-4 transition-all duration-200 relative group',
          softDisabled
            ? 'border-border bg-muted/40 opacity-50 cursor-not-allowed'
            : active
              ? cn(module.color.bg, module.color.border, 'ring-1', module.color.ring)
              : 'border-border bg-card',
          !locked && !active && !softDisabled && 'hover:border-muted-foreground/40 hover:shadow-sm',
          locked ? 'cursor-default' : softDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        {/* Popular badge */}
        {module.popular && !locked && !softDisabled && (
          <span className="absolute -top-2 left-4 bg-blue-500 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-white" /> Popular
          </span>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
              active && !softDisabled ? cn(module.color.iconBg, module.color.iconText) : 'bg-muted text-muted-foreground'
            )}>
              {module.icon}
            </span>
            <span className="font-semibold text-sm text-foreground leading-tight">{module.name}</span>
          </div>
          <div className="shrink-0 mt-0.5">
            {locked ? (
              <span className={cn('flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full', module.color.badge, module.color.badgeText)}>
                <Lock className="w-2.5 h-2.5" /> Required
              </span>
            ) : softDisabled ? (
              <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                <Lock className="w-2.5 h-2.5" /> N/A
              </span>
            ) : (
              <span className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                selected ? cn(module.color.iconBg, module.color.border) : 'border-muted-foreground/30 bg-background'
              )}>
                {selected && <CheckCircle2 className={cn('w-3.5 h-3.5', module.color.iconText)} />}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed pl-9 mb-3">{module.description}</p>

       
      </button>

      {/* Admin-only banner — shown below card, not overlapping */}
      {softDisabled && disabledReason && (
        <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">{disabledReason}</p>
        </div>
      )}
    </div>
  )
}


// ── Demo Modal ─────────────────────────────────────────────

function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', employees: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!form.name || !form.email) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 1200)
  }

  useEffect(() => {
    if (!open) { setTimeout(() => { setSubmitted(false); setForm({ name: '', company: '', phone: '', email: '', employees: '', message: '' }) }, 300) }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="font-semibold text-foreground">Schedule a demo</p>
            <p className="text-xs text-muted-foreground mt-0.5">We'll reach out within 24 hours</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-foreground text-lg mb-2">Request received!</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Our team will contact you at <strong>{form.email}</strong> within 24 hours to schedule your demo.
            </p>
            <Button className="mt-6" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name', label: 'Full name *', placeholder: 'Arjun Sharma', icon: <Users className="w-4 h-4" /> },
                { key: 'company', label: 'Company', placeholder: 'PixxelPrint Ltd', icon: <Building2 className="w-4 h-4" /> },
              ].map(({ key, label, placeholder, icon }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
                    <input
                      className="w-full bg-muted/50 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'email', label: 'Email address *', placeholder: 'arjun@company.com', icon: <Mail className="w-4 h-4" /> },
                { key: 'phone', label: 'Phone number', placeholder: '+91 98765 43210', icon: <Phone className="w-4 h-4" /> },
              ].map(({ key, label, placeholder, icon }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
                    <input
                      className="w-full bg-muted/50 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Number of employees</label>
              <select
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                value={form.employees}
                onChange={e => setForm(f => ({ ...f, employees: e.target.value }))}
              >
                <option value="">Select range</option>
                {['1–10', '11–25', '26–50', '51–100', '101–200', '200+'].map(r => <option key={r} value={r}>{r} employees</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Message (optional)</label>
              <textarea
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                rows={3}
                placeholder="Tell us about your business or any specific requirements…"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.email}
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> Sending…</span>
              ) : (
                <><Send className="w-4 h-4" /> Send demo request</>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              By submitting you agree to our Privacy Policy. No spam, ever.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export function PricingCalculator() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [empCount, setEmpCount] = useState(50)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [demoOpen, setDemoOpen] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [applicationType, setApplicationType] = useState<'all' | 'admin'>('all')
  const calcRef = useRef<HTMLDivElement>(null)

  // ── Sticky summary bar ───────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (calcRef.current) {
        const rect = calcRef.current.getBoundingClientRect()
        setShowStickyBar(rect.bottom < 0)
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // ── When admin-only selected, deselect role-mgmt ────────
  useEffect(() => {
    if (applicationType === 'admin') {
      setSelected(prev => {
        if (!prev.has('role-mgmt')) return prev
        const next = new Set(prev)
        next.delete('role-mgmt')
        return next
      })
    }
  }, [applicationType])

  // ── Toggle module ────────────────────────────────────────
  const toggleModule = useCallback((id: string) => {
    if (MANDATORY_IDS.has(id)) return
    if (id === 'role-mgmt' && applicationType === 'admin') return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [applicationType])

  // ── Current tier based on employee count ─────────────────
  const currentTier = useMemo(() => getTier(empCount), [empCount])

  const mandatoryModules = MODULES.filter(m => m.mandatory)
  const optionalModules = MODULES.filter(m => !m.mandatory)
  // In admin mode, role-mgmt is not toggleable — exclude from "all selected" check
  const selectableOptionals = optionalModules.filter(m => !(m.id === 'role-mgmt' && applicationType === 'admin'))
  const allOptionalSelected = selectableOptionals.length > 0 && selectableOptionals.every(m => selected.has(m.id))

  // ── Calculations ─────────────────────────────────────────
  const { totalPerEmp, flatMonthly, monthly, annual, firstYear, annualSavings, activeCount } = useMemo(() => {
    const activeIds = new Set([...MANDATORY_IDS, ...selected])
    const activeModules = MODULES.filter(m => activeIds.has(m.id))
    // Mandatory modules use tiered price; optional non-flat modules use their own pricePerEmp
    const mandatoryPerEmp = currentTier.pricePerModule * MANDATORY_IDS.size
    // If ALL add-ons are selected → bundle deal: entire optional set costs ₹50/emp flat
    const optionalPerEmp = allOptionalSelected
      ? 50
      : activeModules.filter(m => !m.mandatory && !m.flatPrice).reduce((s, m) => s + m.pricePerEmp, 0)
    const perEmp = mandatoryPerEmp + optionalPerEmp
    // Role mgmt flat fee still applies (₹200/mo) even in bundle deal
    const flat = allOptionalSelected
      ? (selected.has('role-mgmt') ? 200 : 0)
      : activeModules.filter(m => m.flatPrice).reduce((s, m) => s + (m.flatPrice ?? 0), 0)
    const monthlyFull = perEmp * empCount + flat
    const discount = billing === 'annual' ? 0.9 : 1
    const monthly = Math.round(monthlyFull * discount)
    const annual = monthly * 12
    const annualSavings = billing === 'annual' ? Math.round(monthlyFull * 0.1 * 12) : 0
    return { totalPerEmp: perEmp, flatMonthly: flat, monthly, annual, firstYear: ONE_TIME + annual, annualSavings, activeCount: activeIds.size }
  }, [selected, empCount, billing, currentTier, allOptionalSelected])

  const animatedMonthly = useAnimatedNumber(monthly)
  const animatedAnnual = useAnimatedNumber(annual)
  const animatedFirstYear = useAnimatedNumber(firstYear)

  return (
    <>
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* ── Sticky summary bar ───────────────────────────── */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm transition-all duration-300',
        showStickyBar ? 'translate-y-0 shadow-md' : '-translate-y-full'
      )}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly</p>
              <p className="text-base font-bold tabular-nums">{inr(animatedMonthly)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">First-year total</p>
              <p className="text-base font-bold tabular-nums">{inr(animatedFirstYear)}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Employees</p>
              <p className="text-base font-bold tabular-nums">{empCount}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setDemoOpen(true)}>Contact sales</Button>
            <Button size="sm" className="gap-1" onClick={() => setDemoOpen(true)}>Get quote <ArrowRight className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-background text-foreground">

       

        <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">

          {/* ── One-time costs ────────────────────────── */}
          <section>
            <SectionLabel>One-time costs</SectionLabel>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'Onboarding & setup', value: inr(SETUP_FEE), sub: 'Installation, data migration & staff training' },
                { label: 'Hikvision biometric terminal', value: inr(HARDWARE_FEE), sub: 'Pre-configured hardware unit for your facility' },
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                  <p className="text-base font-bold tabular-nums shrink-0">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Combined one-time cost: <span className="font-semibold text-foreground">{inr(ONE_TIME)}</span>
            </p>
          </section>


          {/* ── Modules ───────────────────────────────── */}
          <section>
            {/* Mandatory */}
            <div className="mb-10">
              

              

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {mandatoryModules.map(m => (
                  <ModuleCard
                    key={m.id}
                    module={m}
                    selected={true}
                    onToggle={() => {}}
                    allSelected={selected}
                    tierPrice={currentTier.pricePerModule}
                  />
                ))}
              </div>
             
            </div>

            {/* Optional */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Optional add-ons — click to toggle</SectionLabel>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{selected.size}</span>/{optionalModules.length} added
                  </span>
                  {allOptionalSelected ? (
                    <button onClick={() => { setSelected(new Set()) }} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                      Clear all
                    </button>
                  ) : (
                    <button onClick={() => { setSelected(new Set(selectableOptionals.map(m => m.id))) }} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                      Select all
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-500"
                  style={{ width: `${(selected.size / optionalModules.length) * 100}%` }}
                />
              </div>

              {/* Bundle deal banner — appears when all add-ons are selected */}
             

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {optionalModules.map(m => (
                  <ModuleCard
                    key={m.id}
                    module={m}
                    selected={selected.has(m.id)}
                    onToggle={() => toggleModule(m.id)}
                    allSelected={selected}
                    disabledReason={m.id === 'role-mgmt' && applicationType === 'admin'
                      ? 'Not required for admin-only setup'
                      : undefined}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ── Quick reference table ─────────────────── */}
         

       


        </div>
      </div>

      {/* ── Mobile sticky CTA ─────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly total</p>
          <p className="text-base font-bold tabular-nums truncate">{inr(animatedMonthly)}</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setDemoOpen(true)}>
          Get quote <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </>
  )
}