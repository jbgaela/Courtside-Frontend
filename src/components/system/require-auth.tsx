'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth, useIsAdmin } from '@/lib/auth';
import { PageSkeleton } from '@/components/ui/feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export function RequireAuth({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { me, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  React.useEffect(() => {
    if (!loading && !me) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, me, pathname, router]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl p-5 sm:p-8">
        <PageSkeleton />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="grid min-h-[60dvh] place-items-center p-6 text-center">
        <div>
          <p className="font-display text-xl font-bold">Signing you in…</p>
          <p className="mt-1 text-sm text-muted-foreground">Redirecting to the sign-in page.</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center pt-8 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-[#fbe9e7] text-destructive">
              <ShieldAlert className="size-6" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">Queue Master access required</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This area is limited to club owners and Queue Masters. Ask a club owner to give you
              the Queue Master role, or return to your player dashboard.
            </p>
            <Button asChild className="mt-5">
              <Link href="/app">Back to my dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
