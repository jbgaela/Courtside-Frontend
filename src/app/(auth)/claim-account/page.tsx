import { ClaimAccountForm } from '@/components/auth/claim-account-form';

export const metadata = { title: 'Claim account' };

export default async function ClaimAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  return <ClaimAccountForm initialToken={token} />;
}
