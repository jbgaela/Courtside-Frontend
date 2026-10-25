import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : undefined;
  return <SignInForm next={next} />;
}
