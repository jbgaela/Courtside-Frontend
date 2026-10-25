import { PageSkeleton } from '@/components/ui/feedback';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl p-5 sm:p-8">
      <PageSkeleton />
    </div>
  );
}
