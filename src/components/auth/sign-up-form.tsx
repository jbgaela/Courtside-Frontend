'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { setRegistrationEmail, setReturnTo } from '@/lib/registration-session';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [skillRating, setSkillRating] = useState('3');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      setError('Accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/v1/auth/register', {
        name,
        email,
        password,
        skillRating: Number(skillRating),
        acceptTerms: true,
      });
      setRegistrationEmail(email);
      setReturnTo(next ?? null);
      toast.success('Registration submitted for approval');
      router.replace('/registration-submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
          Join the club
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One account for every club, session and match.
        </p>
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#d9edb2] bg-lime-soft/60 p-3.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#486b1c]" />
          <p className="text-xs leading-relaxed text-[#3f5c16]">
            <span className="font-bold">Approval required.</span> New accounts are reviewed by an
            administrator before they can be used. You can return to sign in and check your status.
          </p>
        </div>
        {next ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            After approval and activation, we&apos;ll take you back to the session you scanned.
          </p>
        ) : null}
      </div>

      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            autoComplete="name"
            placeholder="Alex Rivera"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters with a letter and a number."
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Choose a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" htmlFor="confirm">
          <Input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Field label="Skill level (optional)" htmlFor="skill" hint="Used to balance rotations.">
          <Select
            id="skill"
            value={skillRating}
            onChange={(event) => setSkillRating(event.target.value)}
          >
            <option value="1.5">Beginner</option>
            <option value="2.5">Lower intermediate</option>
            <option value="3">Intermediate</option>
            <option value="3.75">Upper intermediate</option>
            <option value="4.5">Advanced</option>
            <option value="5.5">Competitive</option>
          </Select>
        </Field>

        <label className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            className="mt-0.5 size-4 rounded border-input accent-primary"
            required
          />
          <span>
            I agree to the{' '}
            <Link href="/terms" className="font-semibold text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error ? (
          <div
            className="rounded-xl border border-[#f0d8d4] bg-[#fdf6f5] px-3.5 py-2.5 text-xs font-medium text-[#8f3a33]"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Create account
        </Button>
        <p className="text-center text-[0.65rem] leading-relaxed text-muted-foreground">
          We do not send an approval email yet. Check your status by signing in.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
