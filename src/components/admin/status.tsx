import { Badge, type BadgeTone } from '@/components/ui/badge';
import type { AccountStatus, RegistrationStatus } from '@/lib/types';

const registrationTone: Record<RegistrationStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const accountTone: Record<AccountStatus, BadgeTone> = {
  PENDING_APPROVAL: 'warning',
  APPROVED_PENDING_ACTIVATION: 'info',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  DEACTIVATED: 'neutral',
  DELETED: 'danger',
};

const registrationLabel: Record<RegistrationStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const accountLabel: Record<AccountStatus, string> = {
  PENDING_APPROVAL: 'Pending approval',
  APPROVED_PENDING_ACTIVATION: 'Awaiting activation',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DEACTIVATED: 'Deactivated',
  DELETED: 'Deleted',
};

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  return (
    <Badge tone={registrationTone[status]} dot>
      {registrationLabel[status]}
    </Badge>
  );
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge tone={accountTone[status]} dot>
      {accountLabel[status]}
    </Badge>
  );
}

export function PlatformRoleBadge({ role }: { role: string }) {
  return (
    <Badge tone={role === 'SUPER_ADMIN' ? 'forest' : 'neutral'}>
      {role === 'SUPER_ADMIN' ? 'Super Admin' : 'User'}
    </Badge>
  );
}
