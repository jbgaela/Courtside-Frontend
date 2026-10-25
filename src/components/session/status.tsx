import { Badge, LiveBadge, type BadgeTone } from '@/components/ui/badge';
import {
  sessionLabel,
  sessionTone,
  matchLabel,
  matchTone,
  queueLabel,
  queueTone,
} from '@/lib/format';

export function SessionStatusBadge({ status }: { status: string }) {
  if (status === 'LIVE') return <LiveBadge />;
  return (
    <Badge tone={sessionTone(status) as BadgeTone} dot>
      {sessionLabel(status)}
    </Badge>
  );
}

export function MatchStatusBadge({ status }: { status: string }) {
  if (status === 'IN_PROGRESS') return <LiveBadge />;
  return (
    <Badge tone={matchTone(status) as BadgeTone} dot>
      {matchLabel(status)}
    </Badge>
  );
}

export function QueueStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={queueTone(status) as BadgeTone} dot>
      {queueLabel(status)}
    </Badge>
  );
}
