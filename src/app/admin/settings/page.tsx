'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminSettingsPage() {
  const { me } = useAuth();
  const mfa = useQuery({
    queryKey: ['admin', 'mfa-status'],
    queryFn: () =>
      api.get<{ enabled: boolean; enrolledAt: string | null; requiredInProduction: boolean }>(
        '/api/v1/auth/mfa/status',
      ),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Platform security"
        title="Settings"
        description="Administrative identity, security expectations and platform policy references."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Administrator identity</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Name" value={me?.name ?? '—'} />
              <Row label="Email" value={me?.email ?? '—'} />
              <Row label="Platform role" value={me?.platformRole ?? '—'} />
              <Row label="Account status" value={me?.accountStatus ?? '—'} />
            </div>
            <Button asChild variant="outline" size="sm" className="mt-5">
              <Link href="/app/profile">
                <UserRound className="size-3.5" /> Open player profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">MFA and recent reauthentication</h2>
              <Badge tone={mfa.data?.enabled ? 'success' : 'warning'} dot>
                {mfa.data?.enabled ? 'Enabled' : 'Not enabled'}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Sensitive account actions require a recent password confirmation. Production Super
              Admin access must be protected with strong TOTP MFA before launch.
            </p>
            {mfa.data?.enrolledAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Enrolled {new Date(mfa.data.enrolledAt).toLocaleString()}
              </p>
            ) : null}
            {mfa.data && !mfa.data.enabled ? (
              <Button asChild className="mt-4" size="sm">
                <Link href="/mfa-setup">
                  <KeyRound className="size-3.5" /> Set up authenticator MFA
                </Link>
              </Button>
            ) : null}
            <div className="mt-4 rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3 text-xs leading-relaxed text-[#8a5a0b]">
              <LockKeyhole className="mr-1 inline size-3.5" /> Do not expose this admin interface to
              the public internet without MFA, TLS and edge access controls.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Account lifecycle policy</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>New public registrations remain pending until an authorized decision.</li>
              <li>Rejected applicants cannot activate; reconsideration is an audited reopen.</li>
              <li>Suspension blocks authentication and private real-time access.</li>
              <li>Deletion is a tombstone; match history and audit records are preserved.</li>
              <li>Claim and recovery credentials are hashed, expiring and single-use.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Operational references</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep recovery identity checks, incident handling and platform-role provisioning
              documented outside the application.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/audit-logs">
                  <ShieldCheck className="size-3.5" /> Audit logs
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/users">
                  <KeyRound className="size-3.5" /> User directory
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-semibold">{value}</span>
    </div>
  );
}
