'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '@/lib/api';

export type RealtimeStatus = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error';

export interface RealtimeEvent {
  eventId: string;
  type: string;
  version: number;
  occurredAt: string;
  payload?: Record<string, unknown>;
  sessionId?: string;
  publicId?: string;
}

export function useSessionEvents({
  sessionId,
  publicId,
  onEvent,
  onRecover,
  enabled = true,
}: {
  sessionId?: string;
  publicId?: string;
  onEvent?: (event: RealtimeEvent) => void;
  onRecover?: () => void;
  enabled?: boolean;
}): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const socketRef = useRef<Socket | null>(null);
  const onEventRef = useRef(onEvent);
  const onRecoverRef = useRef(onRecover);
  const connectedOnce = useRef(false);
  const lastVersion = useRef(0);

  useEffect(() => {
    onEventRef.current = onEvent;
    onRecoverRef.current = onRecover;
  }, [onEvent, onRecover]);

  useEffect(() => {
    if (!enabled || (!sessionId && !publicId)) {
      // Reflect the disabled subscription in the connection badge.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('offline');
      return;
    }
    const socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    const subscribe = () => {
      socket.emit(
        'subscribe',
        sessionId ? { sessionId } : { publicId },
        (ack: { ok: boolean; error?: string; version?: number }) => {
          if (ack?.ok) {
            setStatus('live');
            if (typeof ack.version === 'number') {
              lastVersion.current = Math.max(lastVersion.current, ack.version);
            }
            // A reconnect always refetches an authoritative snapshot.
            if (connectedOnce.current) onRecoverRef.current?.();
            connectedOnce.current = true;
          } else {
            setStatus('error');
          }
        },
      );
    };

    socket.on('connect', () => {
      setStatus(connectedOnce.current ? 'reconnecting' : 'connecting');
      subscribe();
    });
    socket.on('disconnect', () => setStatus('offline'));
    socket.io.on('reconnect_attempt', () => setStatus('reconnecting'));
    socket.io.on('reconnect_failed', () => setStatus('error'));

    const handler = (event: RealtimeEvent) => {
      if (typeof event.version === 'number') {
        // Ignore delayed events from an older aggregate version. Equal versions
        // are allowed because score events do not change session eligibility.
        if (event.version < lastVersion.current) return;
        const gap = lastVersion.current > 0 && event.version > lastVersion.current + 1;
        lastVersion.current = Math.max(lastVersion.current, event.version);
        if (gap) onRecoverRef.current?.();
      }
      onEventRef.current?.(event);
    };
    socket.on('session:event', handler);
    socket.on('public:event', handler);

    return () => {
      socket.off('session:event', handler);
      socket.off('public:event', handler);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, sessionId, publicId]);

  return status;
}
