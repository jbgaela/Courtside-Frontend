'use client';

import { useQuery, type QueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  ClubSummary,
  GuestStatus,
  LiveSnapshot,
  MatchHistoryItem,
  MatchView,
  PublicSession,
  QueueSnapshot,
  RegistrationRow,
  RotationView,
  SessionRecord,
  Stats,
  UpcomingSession,
} from './types';

export const queryKeys = {
  me: ['me'] as const,
  upcoming: ['upcoming'] as const,
  stats: ['stats'] as const,
  matchHistory: (cursor?: string) => ['match-history', cursor ?? 'first'] as const,
  notifications: ['notifications'] as const,
  clubs: (q: string) => ['clubs', q] as const,
  club: (identifier: string) => ['club', identifier] as const,
  clubSessions: (clubId: string) => ['club-sessions', clubId] as const,
  session: (id: string) => ['session', id] as const,
  live: (id: string) => ['live', id] as const,
  queue: (id: string) => ['queue', id] as const,
  rotation: (id: string) => ['rotation', id] as const,
  matches: (id: string, results: boolean) => ['matches', id, results ? 'results' : 'all'] as const,
  match: (id: string) => ['match', id] as const,
  registration: (id: string) => ['registrations', id] as const,
  courts: (clubId: string) => ['courts', clubId] as const,
  members: (clubId: string) => ['members', clubId] as const,
  clubRoles: (clubId: string) => ['club-roles', clubId] as const,
  invitations: (clubId: string) => ['invitations', clubId] as const,
  audit: (clubId: string) => ['audit', clubId] as const,
  publicSession: (id: string) => ['public-session', id] as const,
  publicClub: (slug: string) => ['public-club', slug] as const,
};

export function useUpcoming() {
  return useQuery({
    queryKey: queryKeys.upcoming,
    queryFn: () => api.get<UpcomingSession[]>('/api/v1/users/me/upcoming'),
  });
}

export function useGuestStatus(token: string, enabled = true) {
  return useQuery({
    queryKey: ['guest-status', token],
    queryFn: () =>
      api.get<GuestStatus & { created?: boolean }>(
        `/api/v1/public/checkins/${encodeURIComponent(token)}/guest`,
      ),
    enabled,
    retry: false,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.session.status === 'LIVE' ? 5_000 : false,
  });
}

export function useStats() {  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => api.get<Stats>('/api/v1/users/me/stats'),
  });
}

export function useMatchHistory(cursor?: string) {
  return useQuery({
    queryKey: queryKeys.matchHistory(cursor),
    queryFn: () =>
      api.get<{ items: MatchHistoryItem[]; nextCursor: string | null }>(
        `/api/v1/users/me/matches?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      ),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () =>
      api.get<
        Array<{
          id: string;
          type: string;
          title: string;
          body: string;
          read: boolean;
          createdAt: string;
        }>
      >('/api/v1/users/me/notifications'),
  });
}

export function useClubs(q = '') {
  return useQuery({
    queryKey: queryKeys.clubs(q),
    queryFn: () =>
      api.get<ClubSummary[]>(`/api/v1/clubs?limit=30${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  });
}

export function useClub(identifier: string | undefined) {
  return useQuery({
    queryKey: queryKeys.club(identifier ?? ''),
    queryFn: () => api.get<ClubSummary>(`/api/v1/clubs/${encodeURIComponent(identifier ?? '')}`),
    enabled: Boolean(identifier),
  });
}

export function useClubSessions(clubId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clubSessions(clubId ?? ''),
    queryFn: () =>
      api.get<SessionRecord[]>(
        `/api/v1/clubs/${encodeURIComponent(clubId ?? '')}/sessions?limit=50`,
      ),
    enabled: Boolean(clubId),
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.session(sessionId ?? ''),
    queryFn: () =>
      api.get<SessionRecord>(`/api/v1/sessions/${encodeURIComponent(sessionId ?? '')}`),
    enabled: Boolean(sessionId),
  });
}

export function useLive(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.live(sessionId ?? ''),
    queryFn: () =>
      api.get<LiveSnapshot>(`/api/v1/sessions/${encodeURIComponent(sessionId ?? '')}/live`),
    enabled: Boolean(sessionId),
  });
}

export function useQueue(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.queue(sessionId ?? ''),
    queryFn: () =>
      api.get<QueueSnapshot>(`/api/v1/sessions/${encodeURIComponent(sessionId ?? '')}/queue`),
    enabled: Boolean(sessionId),
  });
}

export function useRotation(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rotation(sessionId ?? ''),
    queryFn: () =>
      api.get<RotationView | null>(
        `/api/v1/sessions/${encodeURIComponent(sessionId ?? '')}/rotations/latest`,
      ),
    enabled: Boolean(sessionId),
    retry: false,
  });
}

export function useSessionMatches(sessionId: string | undefined, resultsOnly = false) {
  return useQuery({
    queryKey: queryKeys.matches(sessionId ?? '', resultsOnly),
    queryFn: () =>
      api.get<MatchView[]>(
        `/api/v1/sessions/${encodeURIComponent(sessionId ?? '')}/${resultsOnly ? 'results' : 'matches'}?limit=50`,
      ),
    enabled: Boolean(sessionId),
  });
}

export function useMatch(matchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.match(matchId ?? ''),
    queryFn: () => api.get<MatchView>(`/api/v1/matches/${encodeURIComponent(matchId ?? '')}`),
    enabled: Boolean(matchId),
  });
}

export function useRegistrations(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.registration(sessionId ?? ''),
    queryFn: () =>
      api.get<{
        sessionId: string;
        registrations: RegistrationRow[];
        guests: RegistrationRow[];
        participants: RegistrationRow[];
        counts: Record<string, number>;
        capacity: number;
      }>(`/api/v1/sessions/${encodeURIComponent(sessionId ?? '')}/registrations`),
    enabled: Boolean(sessionId),
  });
}

export function useClubCourts(clubId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.courts(clubId ?? ''),
    queryFn: () =>
      api.get<Array<{ id: string; name: string; status: string; sortOrder: number }>>(
        `/api/v1/clubs/${encodeURIComponent(clubId ?? '')}/courts`,
      ),
    enabled: Boolean(clubId),
  });
}

export function useMembers(clubId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members(clubId ?? ''),
    queryFn: () =>
      api.get<
        Array<{
          id: string;
          userId: string;
          name: string;
          email?: string;
          displayName: string;
          skillRating: number;
          role: string;
          roleName?: string;
          status: string;
          joinedAt: string | null;
          createdAt: string;
        }>
      >(`/api/v1/clubs/${encodeURIComponent(clubId ?? '')}/members`),
    enabled: Boolean(clubId),
  });
}

export interface ClubRoleOption {
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
  isProtected: boolean;
}

export function useClubRoles(clubId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clubRoles(clubId ?? ''),
    queryFn: () =>
      api.get<ClubRoleOption[]>(`/api/v1/clubs/${encodeURIComponent(clubId ?? '')}/roles`),
    enabled: Boolean(clubId),
  });
}

export function useInvitations(clubId: string | undefined) {  return useQuery({
    queryKey: queryKeys.invitations(clubId ?? ''),
    queryFn: () =>
      api.get<
        Array<{
          id: string;
          email: string;
          role: string;
          status: string;
          expiresAt: string;
          createdAt: string;
        }>
      >(`/api/v1/clubs/${encodeURIComponent(clubId ?? '')}/invitations`),
    enabled: Boolean(clubId),
  });
}

export function useAudit(clubId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.audit(clubId ?? ''),
    queryFn: () =>
      api.get<
        Array<{
          id: string;
          action: string;
          summary: string;
          actorId: string | null;
          createdAt: string;
        }>
      >(`/api/v1/clubs/${encodeURIComponent(clubId ?? '')}/audit`),
    enabled: Boolean(clubId),
  });
}

export function usePublicSession(publicId: string | undefined, initialData?: PublicSession) {
  return useQuery({
    queryKey: queryKeys.publicSession(publicId ?? ''),
    queryFn: () =>
      api.get<PublicSession>(`/api/v1/public/sessions/${encodeURIComponent(publicId ?? '')}`),
    enabled: Boolean(publicId),
    initialData,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });
}

export function usePublicClub(
  slug: string | undefined,
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    sessions: Array<{
      publicId: string;
      name: string;
      startsAt: string;
      endsAt: string;
      status: string;
      format: string;
    }>;
  },
) {
  return useQuery({
    queryKey: queryKeys.publicClub(slug ?? ''),
    queryFn: () =>
      api.get<typeof initialData>(`/api/v1/public/clubs/${encodeURIComponent(slug ?? '')}`),
    enabled: Boolean(slug),
    initialData,
    staleTime: 30_000,
  });
}

export function invalidateSessionQueries(client: QueryClient, sessionId: string): void {
  void client.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
  void client.invalidateQueries({ queryKey: queryKeys.live(sessionId) });
  void client.invalidateQueries({ queryKey: queryKeys.queue(sessionId) });
  void client.invalidateQueries({ queryKey: queryKeys.rotation(sessionId) });
  void client.invalidateQueries({ queryKey: ['matches', sessionId] });
  void client.invalidateQueries({ queryKey: queryKeys.registration(sessionId) });
  void client.invalidateQueries({ queryKey: queryKeys.upcoming });
}
