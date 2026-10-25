import Link from 'next/link';
import { CheckCircle2, Quote, ShieldCheck, Sparkles, Timer } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { PickleballMark } from '@/components/brand/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <div className="relative hidden overflow-hidden bg-forest p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pickle-pattern absolute inset-0 opacity-40" />
        <div className="absolute -bottom-40 -left-24 size-[34rem] rounded-full border border-lime/20" />
        <div className="absolute -bottom-24 -left-10 size-[26rem] rounded-full border border-lime/10" />

        <div className="relative">
          <Link href="/" aria-label="PickleQueue home">
            <Logo tone="light" />
          </Link>
          <div className="mt-20 max-w-lg">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-lime">
              The modern way to play
            </p>
            <h1 className="mt-4 text-balance font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.05em] xl:text-6xl">
              Play more.
              <br />
              Worry less.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
              Fair rotations, live scores and a queue that explains itself. Built for the people who
              make open play happen.
            </p>
          </div>
        </div>

        <div className="relative mt-14 grid max-w-lg gap-3">
          {[
            {
              icon: Timer,
              title: 'Fair by default',
              body: 'Games played and waiting time lead every decision.',
            },
            {
              icon: Sparkles,
              title: 'Balanced courts',
              body: 'Three team splits evaluated for every doubles match.',
            },
            {
              icon: ShieldCheck,
              title: 'No double bookings',
              body: 'Every rotation commits atomically, even with two tablets.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative mt-12 flex items-end justify-between">
          <blockquote className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <Quote className="size-4 text-lime/70" />
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              “We went from three clipboards and an argument to one tablet. Everyone plays the same
              number of games now.”
            </p>
            <footer className="mt-3 flex items-center gap-2 text-[0.65rem] text-white/40">
              <CheckCircle2 className="size-3.5 text-lime" /> Morgan · Riverside Pickleball Club
            </footer>
          </blockquote>
          <PickleballMark className="size-12 opacity-80" />
        </div>
      </div>

      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center px-4 py-4 sm:px-8 lg:hidden">
          <Link href="/" aria-label="PickleQueue home" className="min-w-0">
            <Logo compact />
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>
        <footer className="px-5 py-5 text-center text-[0.65rem] text-muted-foreground sm:px-8">
          Play · Rotate · Connect
        </footer>
      </div>
    </div>
  );
}
