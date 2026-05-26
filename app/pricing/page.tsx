import { PricingCalculator } from '@/components/pricing-calculator'

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for your HR management needs.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <PricingCalculator />
    </div>
  )
}
