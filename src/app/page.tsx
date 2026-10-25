import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import { Badge, LiveBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Zap,
    title: 'Skill-based matchmaking',
    body: 'Fair, balanced courts built from games played, wait time, skill and recent partners.',
  },
  {
    icon: Timer,
    title: 'Automatic rotation',
    body: 'No clipboards, no politics. Every player sees why they are next and when they play.',
  },
  {
    icon: Trophy,
    title: 'Live scoring',
    body: 'Rally-by-rally scorekeeping built for a phone in one hand and a paddle in the other.',
  },
  {
    icon: Users,
    title: 'Club management',
    body: 'Sessions, courts, check-in and Queue Master roles in one calm operations board.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable by design',
    body: 'Atomic court assignments, idempotent scoring and snapshot recovery on every device.',
  },
  {
    icon: CircleDot,
    title: 'Public links',
    body: 'Share live courts and results with spectators. No account required to watch.',
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-dvh overflow-hidden">
      <header className="relative z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <Link
              href="/public/sessions/s_riverside_saturday"
              className="transition-colors hover:text-foreground"
            >
              Live demo
            </Link>
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="absolute -right-32 top-10 size-[28rem] rounded-full bg-lime/25 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-24 lg:pt-14">
          <div className="max-w-2xl">
            <Badge tone="lime" className="mb-5 gap-2 py-1.5" dot>
              Built for open play
            </Badge>
            <h1 className="text-balance font-display text-[2.7rem] font-extrabold leading-[0.98] tracking-[-0.055em] text-forest sm:text-6xl lg:text-[4.3rem]">
              Smart queuing.
              <br />
              <span className="relative inline-block">
                Fair play.
                <svg
                  viewBox="0 0 240 14"
                  className="absolute -bottom-1 left-0 h-3 w-full text-lime"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 10C52 2 160 2 238 8"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              PickleQueue takes the clipboard out of open play. Players check in, the engine builds
              balanced courts, and everyone sees the next fair rotation. You just play.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="group">
                <Link href="/sign-up">
                  Create your club
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/public/sessions/s_riverside_saturday">
                  <LiveBadge />
                  Watch live play
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-success" /> No spreadsheets
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-success" /> Mobile + tablet
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-success" /> Installable PWA
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0">
            <div className="absolute -left-5 top-12 z-10 hidden rotate-[-5deg] rounded-2xl border border-border bg-card p-3 shadow-lift sm:block">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-lime-soft">
                  <Sparkles className="size-4 text-[#47671b]" />
                </span>
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
                    Fairness engine
                  </p>
                  <p className="text-xs font-bold">Next up: Alex Â· 3.5</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-forest/20 bg-forest p-2 shadow-[0_40px_90px_-40px_rgba(15,53,36,0.7)]">
              <div className="pickle-pattern rounded-[1.6rem] border border-white/10 bg-forest-soft/40 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-lime">
                      Saturday Open Play
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-white">
                      Riverside Pickleball
                    </p>
                  </div>
                  <LiveBadge />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { court: 'Court 1', a: 9, b: 7, names: 'Sam + Priya vs Diego + Maria' },
                    { court: 'Court 2', a: 4, b: 3, names: 'Sofia + Ken vs Liam + Ava' },
                  ].map((match) => (
                    <div
                      key={match.court}
                      className="rounded-2xl bg-white p-3.5 text-forest shadow-lg"
                    >
                      <div className="flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>{match.court}</span>
                        <span className="inline-flex items-center gap-1 text-[#47671b]">
                          <span className="live-dot size-1.5 rounded-full bg-[#71b51b]" /> Live
                        </span>
                      </div>
                      <div className="mt-2 flex items-end justify-center gap-2 tabular">
                        <span className="font-display text-4xl font-extrabold leading-none">
                          {match.a}
                        </span>
                        <span className="pb-1 text-lg font-semibold text-muted-foreground">
                          â€“
                        </span>
                        <span className="font-display text-4xl font-extrabold leading-none">
                          {match.b}
                        </span>
                      </div>
                      <p className="mt-2 text-center text-[0.62rem] leading-snug text-muted-foreground">
                        {match.names}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl bg-white/95 p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-full bg-[#eaf3df] font-display text-lg font-extrabold text-primary">
                        #3
                      </span>
                      <div>
                        <p className="text-xs font-bold">Alex Reyes</p>
                        <p className="text-[0.62rem] text-muted-foreground">
                          3.5 skill Â· 2 games played
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground">
                        Estimated wait
                      </p>
                      <p className="text-xs font-extrabold text-primary">10â€“15 min</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                    <div className="flex -space-x-2">
                      {['Ava Brooks', 'Noah Williams', 'Zoe Chen', 'Ethan Park'].map((name) => (
                        <Avatar key={name} name={name} size="xs" />
                      ))}
                    </div>
                    <span className="text-[0.62rem] font-semibold text-muted-foreground">
                      Next match auto-assigned
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between px-1 text-white/60">
                  <span className="inline-flex items-center gap-1.5 text-[0.62rem]">
                    <Clock3 className="size-3" /> 12 checked in
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.62rem]">
                    <CalendarCheck className="size-3" /> 3 courts
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.62rem]">
                    <Users className="size-3" /> 2 live matches
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-3 z-10 hidden rotate-[4deg] rounded-2xl border border-border bg-card px-4 py-3 shadow-lift sm:block">
              <p className="text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground">
                Balance
              </p>
              <p className="font-display text-lg font-extrabold text-primary">7.00 â€“ 7.00</p>
              <p className="text-[0.6rem] text-muted-foreground">
                All three team splits considered
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-border/70 bg-card/70">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
              The rotation, reimagined
            </p>
            <h2 className="mt-2 text-balance font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              Four steps from check-in to next game.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              No more guessing who is next. The engine considers the whole session, then a Queue
              Master commits the rotation atomically.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['01', 'Players check in', 'Registration, approval and attendance stay separate.'],
              [
                '02',
                'Matchmaking decides',
                'Games played, wait, skill, rest and partner diversity.',
              ],
              [
                '03',
                'Courts are reserved',
                'One transaction. No duplicate players or double-booked courts.',
              ],
              ['04', 'Score and rotate', 'A completed match returns players to a fair queue.'],
            ].map(([step, title, body]) => (
              <div key={step} className="rounded-2xl border border-border bg-card p-4">
                <span className="font-display text-xs font-extrabold text-[#4f6f1e]">{step}</span>
                <h3 className="mt-1.5 font-display text-base font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
            Everything in one place
          </p>
          <h2 className="mt-2 text-balance font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
            Built for the people running the courts.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Queue Masters get a calm operations board. Players get a clear next game. Spectators get
            a live scoreboard that actually updates.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-[1.35rem] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-lime-soft text-[#486b1c]">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 overflow-hidden rounded-[2rem] bg-forest px-6 py-8 text-white sm:px-10 sm:py-10 lg:flex-row lg:items-center">
          <div className="pickle-pattern pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-lime">
              Ready when you are
            </p>
            <h2 className="mt-2 max-w-2xl text-balance font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              More games. More people. More pickleball.
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Create an account free, set up your club, and run your next open play session.
            </p>
          </div>
          <div className="relative flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link href="/sign-up">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <Logo compact />
          <p>Built for the community. Designed for the game.</p>
          <div className="flex items-center gap-4">
            <Link href="/public/sessions/s_riverside_saturday" className="hover:text-foreground">
              Live demo
            </Link>
            <Link href="/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
