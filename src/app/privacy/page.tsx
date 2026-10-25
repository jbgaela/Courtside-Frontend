import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <Link href="/" aria-label="PickleQueue home">
        <Logo />
      </Link>
      <h1 className="mt-10 font-display text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        PickleQueue stores the account, profile, club, session, queue, match and audit information
        needed to operate the service. Club members may see the player names and skill levels needed
        for open play. Public pages show limited display-name information and only published session
        data.
      </p>
      <h2 className="mt-8 font-display text-xl font-bold">Account data</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Passwords are stored as hashes. Session tokens are stored as hashes in the database and in
        an HttpOnly cookie in your browser. One-time claim and recovery credentials are stored only
        as hashes and expire after use or time.
      </p>
      <h2 className="mt-8 font-display text-xl font-bold">Your choices</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        You can sign out at any time. Account suspension, deletion, recovery and data questions are
        handled through PickleQueue support or your club administrator under the platform&apos;s
        audited account-management process.
      </p>
      <p className="mt-8 text-xs text-muted-foreground">
        This demo policy is a product placeholder and must be reviewed before a public launch.
      </p>
    </main>
  );
}
