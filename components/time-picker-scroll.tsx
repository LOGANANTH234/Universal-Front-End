"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { to12HourFormat } from "@/lib/shift-utils"

interface TimePickerScrollProps {
  value: string // Format: "HH:mm"
  onChange: (time: string) => void
  label?: string
}

export function TimePickerScroll({ value, onChange, label }: TimePickerScrollProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hours, setHours] = useState<number>(9)
  const [minutes, setMinutes] = useState<number>(0)
  const [period, setPeriod] = useState<"AM" | "PM">("AM")

  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)

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
  }, [value, isOpen])

  const handleNow = () => {
    const now = new Date()
    const h = now.getHours()
    const m = now.getMinutes()
    const period = h >= 12 ? "PM" : "AM"
    const displayHours = h % 12 || 12
    setHours(displayHours)
    setMinutes(m)
    setPeriod(period)
  }

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
  const periodOptions = ["AM", "PM"]

  const currentDisplay = to12HourFormat(value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm hover:bg-muted transition-colors"
      >
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-left font-medium">{currentDisplay}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-lg shadow-lg max-h-[70vh]">
            {/* Input display */}
            <div className="p-3 border-b border-border flex items-center justify-between">
              <input
                type="text"
                value={`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`}
                readOnly
                className="text-xs font-medium bg-transparent text-foreground placeholder-muted-foreground outline-none"
                placeholder="hh:mm aa"
              />
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Column headers and scrollable content */}
            <div className="flex gap-2 px-3 py-2 bg-muted/30">
              <div className="flex-1 text-center text-xs font-semibold text-foreground">Hours</div>
              <div className="flex-1 text-center text-xs font-semibold text-foreground">Minutes</div>
              <div className="flex-1 text-center text-xs font-semibold text-foreground">AM/PM</div>
            </div>

            <div className="flex gap-2 px-3 py-2 h-40">
              {/* Hours column */}
              <div className="flex-1 flex flex-col">
                <div
                  ref={hoursRef}
                  className="overflow-y-auto flex flex-col items-center gap-1 flex-1 scroll-smooth"
                  style={{ scrollBehavior: "smooth" }}
                >
                  {hourOptions.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHours(h)}
                      className={`w-full py-1 px-2 rounded text-xs font-medium transition-all whitespace-nowrap ${
                        hours === h ? "bg-blue-500 text-white" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes column */}
              <div className="flex-1 flex flex-col">
                <div
                  ref={minutesRef}
                  className="overflow-y-auto flex flex-col items-center gap-1 flex-1 scroll-smooth"
                  style={{ scrollBehavior: "smooth" }}
                >
                  {minuteOptions.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMinutes(m)}
                      className={`w-full py-1 px-2 rounded text-xs font-medium transition-all whitespace-nowrap ${
                        minutes === m ? "bg-blue-500 text-white" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period column */}
              <div className="flex-1 flex flex-col items-center justify-start gap-1 py-1">
                {periodOptions.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p as "AM" | "PM")}
                    className={`w-full py-1 px-2 rounded text-xs font-medium transition-all ${
                      period === p ? "bg-blue-500 text-white" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-2 p-3 border-t border-border bg-muted/50">
              <Button
                type="button"
                variant="ghost"
                onClick={handleNow}
                className="flex-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 text-xs py-1 h-8"
              >
                Now
              </Button>
              <Button
                type="button"
                onClick={handleOk}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 h-8"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
