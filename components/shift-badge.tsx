import type { Shift } from "@/lib/types"

interface ShiftBadgeProps {
  type: Shift["type"]
}

export default function ShiftBadge({ type }: ShiftBadgeProps) {
  const styles = {
    morning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    afternoon: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    night: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  }

  const labels = {
    morning: "Morning",
    afternoon: "Afternoon",
    night: "Night",
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}
