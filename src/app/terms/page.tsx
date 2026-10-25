import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <Link href="/" aria-label="PickleQueue home">
        <Logo />
      </Link>
      <h1 className="mt-10 font-display text-4xl font-extrabold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        PickleQueue is a club and open-play queueing service. Use your own account, provide accurate
        information and follow your club&apos;s rules. New accounts require administrator approval
        and remain unavailable until activated.
      </p>
      <h2 className="mt-8 font-display text-xl font-bold">Accounts and access</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Administrators may approve, reject, suspend or close accounts for policy, safety or
        operational reasons. Platform administration is separate from club membership. Club roles do
        not grant access to platform account management.
      </p>
      <h2 className="mt-8 font-display text-xl font-bold">Fair play</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Queue and matchmaking decisions are made by the platform. Do not attempt to manipulate
        rotations, scores, registrations or another participant&apos;s account.
      </p>
      <p className="mt-8 text-xs text-muted-foreground">
        This demo policy is a product placeholder and must be reviewed before a public launch.
      </p>
    </main>
  );
}
