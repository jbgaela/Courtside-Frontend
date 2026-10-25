import type {
  MatchFormat,
  MatchmakingConfig,
  ScoringConfig,
  SessionStatus,
} from '@picklequeue/contracts';

export interface MembershipSummary {
  clubId: string;
  clubName: string;
  clubSlug: string;
  role: 'OWNER' | 'QUEUE_MASTER' | 'PLAYER' | string;
  status: string;
  location: string | null;
}

export interface Me {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  profile: {
    displayName: string;
    skillRating: number;
    bio: string | null;
    avatarColor: string | null;
  } | null;
  memberships: MembershipSummary[];
  csrfToken: string;
}

export interface ClubSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  joinPolicy: string;
  memberCount?: number;
  upcomingSessions?: number;
  viewerRole: string | null;
  membershipStatus?: string | null;
  version?: number;
  archived?: boolean;
}

export interface SessionCourt {
  id: string;
  name: string;
  status: string;
  sortOrder: number;
}

export interface SessionRecord {
  id: string;
  clubId: string;
  club?: { id: string; name: string; slug: string };
  publicId: string;
  name: string;
  description: string | null;
  venue: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: SessionStatus;
  capacity: number;
  format: MatchFormat;
  registrationPolicy: string;
  checkInPolicy: string;
  published: boolean;
  allowLateArrivals: boolean;
  matchmaking: MatchmakingConfig;
  scoring: ScoringConfig;
  version: number;
  startedAt: string | null;
  checkInOpensAt: string | null;
  createdAt: string;
  viewerRole: string | null;
  viewerRegistration: {
    id: string;
    status: string;
    registeredAt: string;
    checkedInAt: string | null;
  } | null;
  viewerQueueState: string | null;
  registered?: number;
  checkedIn?: number;
  waiting?: number;
  playing?: number;
  pending?: number;
  courts: SessionCourt[];
  memberCount?: number;
}

export interface UpcomingSession {
  sessionId: string;
  publicId: string;
  name: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: SessionStatus;
  club: { id: string; name: string; slug: string };
  registrationStatus: string;
  queueState: string | null;
  gamesPlayed: number;
  courts: Array<{ id: string; name: string; status: string }>;
}

export interface QueueEntryView {
  id: string;
  userId: string;
  displayName: string;
  skillRating: number;
  state: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  waitingMinutes: number;
  position: number | null;
  estimatedWaitMinutes: number | null;
  currentMatchId: string | null;
  restUntil: string | null;
  joinedAt: string;
}

export interface QueueSnapshot {
  sessionId: string;
  status: SessionStatus;
  version: number;
  format: MatchFormat;
  courts: number;
  counts: {
    checkedIn: number;
    registered: number;
    pending: number;
    waiting: number;
    playing: number;
    paused: number;
  };
  queue: QueueEntryView[];
  self: QueueEntryView | null;
  viewerRole: string;
}

export interface MatchPlayer {
  userId?: string;
  name: string;
  displayName: string;
  skillRating: number;
  position: number;
}

export interface MatchView {
  id: string;
  publicId: string;
  sessionId: string;
  clubId: string;
  court: { id: string; name: string };
  round: number;
  format: MatchFormat;
  status: string;
  scoring: ScoringConfig;
  games: Array<{ a: number; b: number }>;
  currentGame: { a: number; b: number };
  gamesWonA: number;
  gamesWonB: number;
  teamAScore: number;
  teamBScore: number;
  winnerTeam: 'A' | 'B' | null;
  servingTeam: 'A' | 'B' | null;
  awaitingCompletion: boolean;
  version: number;
  startedAt: string | null;
  completedAt: string | null;
  teams: { A: MatchPlayer[]; B: MatchPlayer[] };
  source: {
    winnerTeam: string;
    gamesWonA: number;
    gamesWonB: number;
    correctedAt: string | null;
  } | null;
}

export interface RotationAssignment {
  id: string;
  courtId: string;
  courtName: string;
  status: string;
  teamA: Array<{
    queueEntryId: string;
    userId: string;
    displayName: string;
    skill: number;
    gamesPlayed: number;
    waitMinutes: number;
  }>;
  teamB: Array<{
    queueEntryId: string;
    userId: string;
    displayName: string;
    skill: number;
    gamesPlayed: number;
    waitMinutes: number;
  }>;
  teamRatingA: number;
  teamRatingB: number;
  teamBalance: number;
  skillSpread: number;
  reasons: string[];
  warnings: string[];
  matchId: string | null;
}

export interface RotationView {
  rotationId: string;
  sessionId: string;
  sessionVersion: number;
  rotationSessionVersion: number;
  stale: boolean;
  status: string;
  strategy: string;
  format: MatchFormat;
  config: MatchmakingConfig;
  metrics: {
    eligiblePlayers: number;
    availableCourts: number;
    assignedPlayers: number;
    averageWaitMinutes: number;
    maxWaitMinutes: number;
    averageTeamBalance: number;
    averageSkillSpread: number;
    repeatedPartnerships: number;
  };
  warnings: string[];
  bench: Array<{
    queueEntryId: string;
    userId: string;
    displayName: string;
    gamesPlayed: number;
    waitMinutes: number;
    reason: string;
  }>;
  expiresAt: string;
  createdAt: string;
  assignments: RotationAssignment[];
}

export interface LiveCourt {
  id: string;
  name: string;
  status: string;
  sortOrder: number;
  match: MatchView | null;
}

export interface LiveSnapshot {
  session: SessionRecord;
  queue: QueueSnapshot;
  courts: LiveCourt[];
  matches: MatchView[];
  rotation: RotationView | null;
  viewerRole: string;
  serverTime: string;
}

export interface RegistrationRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  displayName: string;
  skillRating: number;
  status: string;
  registeredAt: string;
  checkedInAt: string | null;
  checkInMethod: string | null;
  queueState: string | null;
}

export interface PublicMatchPlayer {
  name: string;
  skillRating: number;
}

export interface PublicMatch {
  id: string;
  court: { name: string };
  round: number;
  format: MatchFormat;
  status: string;
  scoring: ScoringConfig;
  games: Array<{ a: number; b: number }>;
  currentGame: { a: number; b: number };
  gamesWonA: number;
  gamesWonB: number;
  winnerTeam: 'A' | 'B' | null;
  startedAt: string | null;
  completedAt: string | null;
  teams: { A: PublicMatchPlayer[]; B: PublicMatchPlayer[] };
}

export interface PublicSession {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  timezone: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  format: MatchFormat;
  published: boolean;
  version: number;
  club: { id: string; name: string; location: string | null };
  counts: { checkedIn: number; waiting: number; courts: number };
  courts: Array<{
    id: string;
    name: string;
    status: string;
    match: PublicMatch | null;
  }>;
  matches: PublicMatch[];
  results: PublicMatch[];
}

export interface Stats {
  clubs: number;
  sessionsAttended: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  unreadNotifications: number;
}

export interface MatchHistoryItem {
  matchId: string;
  publicId: string;
  round: number;
  format: string;
  status: string;
  playedAt: string;
  session: { id: string; name: string; publicId: string };
  club: { id: string; name: string; slug: string };
  court: { id: string; name: string };
  team: 'A' | 'B';
  partnerNames: string[];
  opponentNames: string[];
  games: Array<{ a: number; b: number }>;
  winnerTeam: string | null;
  won: boolean;
}
