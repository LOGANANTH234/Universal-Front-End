"use client"

import { useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"
import { to12HourFormat } from "@/lib/shift-utils"

interface TimePickerCompactProps {
  value: string
  onChange: (time: string) => void
  disabled?: boolean
}

export function TimePickerCompact({ value, onChange, disabled = false }: TimePickerCompactProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hours, setHours] = useState<number>(9)
  const [minutes, setMinutes] = useState<number>(0)
  const [period, setPeriod] = useState<"AM" | "PM">("AM")
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number)
      if (!isNaN(h) && !isNaN(m)) {
        const period = h >= 12 ? "PM" : "AM"
        const displayHours = h % 12 || 12
        setHours(displayHours)
        setMinutes(m)
        setPeriod(period)
      }
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleOk = () => {
    let h = hours
    if (period === "PM" && h !== 12) h += 12
    if (period === "AM" && h === 12) h = 0

    const time24 = `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    onChange(time24)
    setIsOpen(false)
  }

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i)
  const currentDisplay = to12HourFormat(value)

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background"
      >
        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 text-left font-medium text-sm">{currentDisplay}</span>
      </button>

      {isOpen && !disabled && (
        <div
          ref={popoverRef}
          className="absolute top-full mt-1 left-0 bg-background border border-border rounded-lg shadow-lg z-50 min-w-max"
        >
          {/* Time display */}
          <div className="p-2 border-b border-border">
            <div className="text-xs font-medium text-foreground">
              {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")} {period}
            </div>
          </div>

          {/* Compact grid */}
          <div className="flex gap-1 p-2">
            {/* Hours */}
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
              {hourOptions.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(h)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    hours === h ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>

            {/* Separator */}
            <div className="text-muted-foreground text-xs font-semibold px-1">:</div>

            {/* Minutes */}
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    minutes === m ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>

            {/* Period */}
            <div className="flex flex-col gap-1">
              {["AM", "PM"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p as "AM" | "PM")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    period === p ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 p-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-2 py-1 text-xs font-medium bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOk}
              className="flex-1 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
