import type { Payslip } from '@/lib/payslip-types'

interface PayslipStatusBadgeProps {
  status: Payslip['status']
}

export function PayslipStatusBadge({ status }: PayslipStatusBadgeProps) {
  const styles = {
    generated: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  }

  const labels = {
    generated: 'Generated',
    pending: 'Pending'
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
