import { VerifyEmailForm } from '@/components/auth/verify-email-form';

export const metadata = { title: 'Verify email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  return <VerifyEmailForm initialToken={token} />;
}
