'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys, useNotifications } from '@/lib/queries';
import { relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const markAll = async () => {
    try {
      await api.post('/api/v1/users/me/notifications/read-all', {});
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      await queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update notifications');
    }
  };

  const markOne = async (id: string, read: boolean) => {
    if (read) return;
    try {
      await api.patch(`/api/v1/users/me/notifications/${id}`, {});
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      await queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    } catch {
      // A notification read marker is non-critical.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/app/profile">
            <ArrowLeft className="size-4" /> Profile
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => void markAll()}>
          <CheckCheck className="size-3.5" /> Mark all read
        </Button>
      </div>
      <PageHeader
        eyebrow="Notifications"
        title="What’s happening"
        description="Match results, queue updates and club activity."
      />

      {notifications.isLoading ? (
        <PageSkeleton />
      ) : notifications.isError ? (
        <ErrorState error={notifications.error} onRetry={() => void notifications.refetch()} />
      ) : notifications.data && notifications.data.length > 0 ? (
        <div className="space-y-2">
          {notifications.data.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void markOne(notification.id, notification.read)}
              className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/40"
            >
              <span
                className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${notification.read ? 'bg-secondary text-muted-foreground' : 'bg-lime-soft text-[#486b1c]'}`}
              >
                <Bell className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{notification.title}</p>
                  {!notification.read ? (
                    <span className="size-1.5 rounded-full bg-[#71b51b]" />
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {notification.body}
                </p>
                <p className="mt-1 text-[0.6rem] text-muted-foreground">
                  {relativeTime(notification.createdAt)}
                </p>
              </div>
              <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="All caught up"
          description="Queue updates, score confirmations and club news will land here."
          icon={<Bell className="size-5" />}
        />
      )}
    </div>
  );
}
