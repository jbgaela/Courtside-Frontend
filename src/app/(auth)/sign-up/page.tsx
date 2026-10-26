import { SignUpForm } from '@/components/auth/sign-up-form';

export const metadata = { title: 'Create account' };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : undefined;
  return <SignUpForm next={next} />;
}
