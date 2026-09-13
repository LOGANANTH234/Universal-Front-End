import { BonusManagementScreen } from '@/components/bonus-management-screen';
import { RouteGuard } from '@/components/route-guard';
import { MODULES } from '@/lib/permission-utils';

export const metadata = {
  title: 'Bonus Management',
  description: 'Calculate, manage, and print employee bonus vouchers',
};

export default function BonusManagementPage() {
  return (
    <RouteGuard requiredModule={MODULES.BONUS_MANAGEMENT}>
      <BonusManagementScreen />
    </RouteGuard>
  );
}
