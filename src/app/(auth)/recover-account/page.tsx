import { RecoverAccountForm } from '@/components/auth/recover-account-form';

export const metadata = { title: 'Recover account' };

export default async function RecoverAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  return <RecoverAccountForm initialToken={token} />;
}
