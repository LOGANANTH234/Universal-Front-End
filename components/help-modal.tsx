"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronDown, AlertCircle, CheckCircle, Clock, Coffee } from "lucide-react"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  color: string
  borderColor: string
  bgColor: string
  textColor: string
  details?: string[]
  tableData?: Array<{
    field: string
    description: string
    validation: string
  }>
  moreInfo?: string
  examples?: Array<{
    type: "valid" | "invalid"
    content: string
  }>
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "overview",
    "create",
    "breaks",
    "grace",
    "validation",
    "calculation",
  ])

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const sections: Section[] = [
    {
      id: "overview",
      title: "Module Overview",
      icon: <Clock className="w-5 h-5" />,
      description: "Main interface for managing all shift schedules",
      color: "from-blue-600 to-blue-700",
      borderColor: "border-blue-200 dark:border-blue-800",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-900 dark:text-blue-100",
      details: [
        "View all shifts in a responsive card layout",
        "Search and filter shifts by name using the search bar",
        "Quick access buttons: Help (?) and Create New Shift (+) in top-right corner",
        "Each shift card displays: Name, Start Time, End Time, Total Hours, and Action buttons (Edit/Delete)",
      ],
      moreInfo:
        "The main screen provides a comprehensive dashboard to manage your entire shift schedule. You can create new shifts, edit existing ones, or delete shifts that are no longer needed.",
    },
    {
      id: "create",
      title: "Create / Edit Shift",
      icon: <Clock className="w-5 h-5" />,
      description: "Form for defining shift parameters and schedule",
      color: "from-emerald-600 to-emerald-700",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      textColor: "text-emerald-900 dark:text-emerald-100",
      tableData: [
        {
          field: "Shift Name",
          description: "Unique identifier for the shift (e.g., 'Morning Shift', 'Evening Shift')",
          validation: "Cannot be empty or duplicate; must be unique across all shifts",
        },
        {
          field: "Start Time",
          description: "Time when shift begins using 12-hour format time picker (e.g., 09:00 AM)",
          validation: "Must be a valid time; should be before End Time",
        },
        {
          field: "Shift Duration",
          description: "Hours (0-23) and Minutes (0, 15, 30, 45) in separate dropdowns to define shift length",
          validation: "Duration must result in a valid End Time; hours 0-23, minutes in 15-min increments",
        },
        {
          field: "End Time",
          description:
            "Auto-calculated read-only field based on (Start Time + Shift Duration); displayed in 12-hour format",
          validation: "Auto-generated; cannot be manually edited. Must not duplicate existing shift times",
        },
        {
          field: "Break Times",
          description:
            "Multiple break periods can be added. Each break has Start and End time. Click 'Add Break' to create new breaks",
          validation: "Each break must fall within shift hours; breaks cannot overlap with each other or with lunch",
        },
        {
          field: "Lunch Times",
          description:
            "Meal period(s) within the shift. Each lunch has Start and End time. Click 'Add Lunch' to add new lunch periods",
          validation:
            "Each lunch must fall within shift hours; lunch periods cannot overlap with each other or with breaks",
        },
        {
          field: "Total Hours",
          description:
            "Read-only field showing net working hours: (End Time - Start Time) - all breaks - all lunch durations",
          validation: "Auto-calculated; updated in real-time as Start Time, Duration, Breaks, or Lunch change",
        },
        {
          field: "Grace time for late",
          description:
            "Allowed minutes an employee can arrive late without penalty. Dropdown with options: 0, 5, 10, 15, 20, 25, 30, 35, 40 minutes",
          validation: "Typically 5-15 minutes based on organizational policy",
        },
      ],
      details: [
        "Form validates in real-time to prevent overlapping times and duplicate names",
        "When creating a new shift, End Time is automatically calculated from Start Time and Duration",
        "This ensures accuracy and prevents manual calculation errors",
        "All break and lunch durations are deducted from Total Hours automatically",
      ],
      moreInfo:
        "Use the form to define clear shift boundaries. The system automatically calculates End Time and Total Hours, reducing errors and ensuring consistency across all shifts.",
      examples: [
        {
          type: "valid",
          content:
            "Start: 09:00 AM + Duration: 9 hrs + Break: 30 min + Lunch: 1 hr = End: 06:00 PM, Total: 7 hrs 30 min ✓",
        },
        { type: "invalid", content: "Duplicate shift name → Error: 'This shift name already exists'" },
        {
          type: "invalid",
          content:
            "Break outside shift hours (06:00 PM - 06:30 PM for a 9 AM - 6 PM shift) → Error: 'Break time should be within shift'",
        },
      ],
    },
    {
      id: "breaks",
      title: "Breaks & Lunch",
      icon: <Coffee className="w-5 h-5" />,
      description: "Manage work breaks and meal times within shift",
      color: "from-orange-600 to-orange-700",
      borderColor: "border-orange-200 dark:border-orange-800",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      textColor: "text-orange-900 dark:text-orange-100",
      details: [
        "Add multiple breaks: Click 'Add Break' button to create new break periods within the shift",
        "Set break start and end times using time picker (must fall within shift hours: Start Time to End Time)",
        "Add lunch: Separate section for lunch breaks, click 'Add Lunch' to add meal periods",
        "Each break/lunch displays Start and End time pickers with a remove button (trash icon)",
        "System validates: No overlaps between breaks, between lunch periods, or between breaks and lunch",
        "Deduction: All break and lunch durations are automatically subtracted from Total Hours calculation",
      ],
      moreInfo:
        "Breaks and lunch are crucial for accurate shift duration calculation. The system ensures they fit within shift boundaries and don't overlap with each other.",
      examples: [
        {
          type: "valid",
          content: "Shift: 09:00 AM - 06:00 PM | Break: 10:00 AM - 10:30 AM | Lunch: 12:00 PM - 01:00 PM ✓",
        },
        {
          type: "invalid",
          content: "Break: 06:00 PM - 06:30 PM (Outside shift hours) → Error: 'Break time should be within shift'",
        },
      ],
    },
    {
      id: "grace",
      title: "Grace Period",
      icon: <Clock className="w-5 h-5" />,
      description: "Configure late arrival tolerance in minutes",
      color: "from-rose-600 to-rose-700",
      borderColor: "border-rose-200 dark:border-rose-800",
      bgColor: "bg-rose-50 dark:bg-rose-950",
      textColor: "text-rose-900 dark:text-rose-100",
      details: [
        "Grace time for late: Dropdown selector with predefined options (0, 5, 10, 15, 20, 25, 30, 35, 40 minutes)",
        "Represents allowed minutes an employee can arrive late without being marked late",
        "Set based on organizational policy (5-10 minutes is typical for most businesses)",
        "Value stored in gracePeriod.lateIn as numeric value in minutes",
        "Example: 10-minute grace period means employee can arrive up to 10:10 AM for a 10:00 AM shift",
      ],
      moreInfo:
        "Grace period is the buffer time allowed for employees to arrive after the shift start time. This helps accommodate minor delays while maintaining scheduling discipline.",
      examples: [
        { type: "valid", content: "Shift starts 09:00 AM + Grace: 10 min = Employee must arrive by 09:10 AM ✓" },
        { type: "valid", content: "Shift starts 10:00 AM + Grace: 5 min = Employee must arrive by 10:05 AM ✓" },
      ],
    },
    {
      id: "validation",
      title: "Validation Examples",
      icon: <AlertCircle className="w-5 h-5" />,
      description: "Common validation errors and how to fix them",
      color: "from-red-600 to-red-700",
      borderColor: "border-red-200 dark:border-red-800",
      bgColor: "bg-red-50 dark:bg-red-950",
      textColor: "text-red-900 dark:text-red-100",
      details: [
        "❌ Empty shift name: Error message 'Shift name is required' appears below field. Fix: Enter a unique shift name.",
        "❌ Duplicate name: Shows 'This shift name already exists'. Fix: Use a different, unique shift name.",
        "❌ Duplicate time combination: Shows error if Start & End times match an existing shift. Fix: Adjust timing.",
        "❌ Break outside hours: Shows 'Break time should be within shift's Start and End Time'. Fix: Adjust break times.",
        "❌ Overlapping breaks: Shows 'Breaks cannot overlap'. Fix: Schedule breaks at different times.",
        "❌ Break-Lunch conflict: Shows 'Break and Lunch cannot overlap'. Fix: Schedule break and lunch at separate times.",
        "✓ Valid entry: All fields appear normal (no red borders), Submit button is enabled.",
      ],
      moreInfo:
        "The system validates all inputs in real-time. Invalid entries are highlighted in red with clear error messages to guide you toward corrections.",
    },
    {
      id: "calculation",
      title: "Shift Calculation Example",
      icon: <Clock className="w-5 h-5" />,
      description: "How total hours are computed with breaks and lunch",
      color: "from-indigo-600 to-indigo-700",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      textColor: "text-indigo-900 dark:text-indigo-100",
      details: [
        "Step 1: Start Time to End Time: 09:00 AM to 06:00 PM = 9 hours gross duration",
        "Step 2: Subtract break duration: 9 hours - 30 minutes = 8.5 hours",
        "Step 3: Subtract lunch duration: 8.5 hours - 1 hour = 7.5 hours",
        "Final Result: 7 hrs 30 min is displayed as the Total Hours",
        "Formula: Total Hours = (End Time - Start Time) - Break Duration - Lunch Duration",
        "Overnight shifts (e.g., 10:00 PM to 06:00 AM) are automatically handled correctly",
      ],
      moreInfo:
        "The calculation is dynamic—any changes to breaks or lunch instantly update the Total Hours field. This helps you plan shifts accurately.",
      examples: [
        {
          type: "valid",
          content: "Shift: 09:00 AM - 06:00 PM (9 hrs) - Break: 30 min - Lunch: 1 hr = Total: 7 hrs 30 min ✓",
        },
        {
          type: "valid",
          content: "Overnight Shift: 10:00 PM - 06:00 AM (8 hrs) - Break: 15 min = Total: 7 hrs 45 min ✓",
        },
      ],
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-lg shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh] border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 shadow-xl rounded-lg">
          <div>
            <h2 className="text-2xl font-bold text-white">Shift Management Guide</h2>
            <p className="text-sm text-blue-100 mt-1">Complete documentation with examples and best practices</p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
          >
            <X className="w-6 h-6 rounded-full bg-chart-2" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`border-2 ${section.borderColor} rounded-lg overflow-hidden hover:shadow-lg transition-shadow`}
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${section.color} hover:opacity-95 transition-opacity cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-white">{section.icon}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                      <p className="text-xs text-white/85">{section.description}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-white transition-transform flex-shrink-0 ${
                      expandedSections.includes(section.id) ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Section Content */}
                {expandedSections.includes(section.id) && (
                  <div className={`p-6 border-t-2 ${section.borderColor} ${section.bgColor}`}>
                    {/* Table Data */}
                    {section.tableData && (
                      <div className="mb-6 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`bg-gradient-to-r ${section.color} text-white`}>
                              <th className="px-4 py-3 text-left font-semibold">Field</th>
                              <th className="px-4 py-3 text-left font-semibold">Description</th>
                              <th className="px-4 py-3 text-left font-semibold">Validation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.tableData.map((row, idx) => (
                              <tr
                                key={idx}
                                className={`border-b border-current/10 ${idx % 2 === 0 ? "bg-white/30 dark:bg-black/20" : ""}`}
                              >
                                <td className={`px-4 py-3 font-semibold ${section.textColor}`}>{row.field}</td>
                                <td className={`px-4 py-3 ${section.textColor}/90`}>{row.description}</td>
                                <td className={`px-4 py-3 ${section.textColor}/90`}>{row.validation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Main Details */}
                    {section.details && section.details.length > 0 && (
                      <div className="space-y-3 mb-6">
                        {section.details.map((detail, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${section.color}`} />
                            </div>
                            <p className={`text-sm leading-relaxed ${section.textColor}`}>{detail}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Examples Section */}
                    {section.examples && section.examples.length > 0 && (
                      <div className="mb-6 border-t-2 border-current/10 pt-6">
                        <h4 className={`text-sm font-semibold ${section.textColor} mb-3 uppercase tracking-wide`}>
                          Examples
                        </h4>
                        <div className="space-y-2">
                          {section.examples.map((example, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg text-sm flex gap-3 items-start ${
                                example.type === "valid"
                                  ? "bg-green-100 dark:bg-green-950 border-l-4 border-green-600"
                                  : "bg-red-100 dark:bg-red-950 border-l-4 border-red-600"
                              }`}
                            >
                              <span className="flex-shrink-0 mt-0.5">
                                {example.type === "valid" ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                              </span>
                              <span
                                className={
                                  example.type === "valid"
                                    ? "text-green-900 dark:text-green-100"
                                    : "text-red-900 dark:text-red-100"
                                }
                              >
                                {example.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* More Info Button */}
                    {section.moreInfo && (
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg border border-current/10 p-4">
                        <button
                          onClick={() => {
                            /* This could expand to show more detailed info */
                          }}
                          className="text-xs font-semibold uppercase tracking-wide text-foreground/70 hover:text-foreground transition-colors mb-2 flex items-center gap-2"
                        >
                          <span className="text-lg">💡</span>
                          Pro Tip
                        </button>
                        <p className={`text-sm leading-relaxed ${section.textColor}/90`}>{section.moreInfo}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Closing Statement */}
            <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/30">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-semibold text-primary">✓ Module Purpose:</span>
              </p>
              <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                This module helps ensure consistent, accurate, and efficient scheduling across all employee shifts in
                your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 flex justify-end rounded-lg">
          <Button
            onClick={onClose}
            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            <X className="w-4 h-4" />
            Close Help
          </Button>
        </div>
      </div>
    </div>
  )
}
