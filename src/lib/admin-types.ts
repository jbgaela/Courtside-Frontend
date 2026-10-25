import type { AccountStatus, PlatformRole, RegistrationStatus } from './types';

export interface AdminPageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminRegistrationSummary {
  id: string;
  userId: string;
  name: string;
  email: string;
  displayName: string;
  skillRating: number;
  status: RegistrationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string } | null;
  publicReason: string | null;
  version: number;
}

export interface AdminRegistrationDetail extends AdminRegistrationSummary {
  internalReason: string | null;
  accountStatus: AccountStatus;
  platformRole: PlatformRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface AdminRegistrationList {
  items: AdminRegistrationSummary[];
  meta: AdminPageMeta & {
    counts: { pending: number; approved: number; rejected: number };
  };
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  displayName: string;
  skillRating: number;
  platformRole: PlatformRole;
  accountStatus: AccountStatus;
  registrationStatus: RegistrationStatus | null;
  emailVerified: boolean;
  activatedAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface AdminUserDetail extends AdminUserSummary {
  termsAcceptedAt: string | null;
  profile: {
    displayName: string;
    skillRating: number;
    bio: string | null;
    avatarColor: string | null;
  } | null;
  registration: {
    id: string;
    status: RegistrationStatus;
    submittedAt: string;
    reviewedAt: string | null;
    publicReason: string | null;
    internalReason: string | null;
    version: number;
  } | null;
  memberships: Array<{
    id: string;
    clubId: string;
    clubName: string;
    clubSlug: string;
    role: string;
    status: string;
  }>;
  ownedClubs: Array<{ id: string; name: string; slug: string; archived: boolean }>;
  claimPending: boolean;
  recoveryPending: boolean;
  recentAudit: AdminAuditEvent[];
}

export interface AdminUserList {
  items: AdminUserSummary[];
  meta: AdminPageMeta;
}

export interface AdminAuditEvent {
  id: string;
  action: string;
  outcome: string;
  summary: string;
  entityType: string | null;
  entityId: string | null;
  actor: { id: string; name: string } | null;
  target: { id: string; name: string } | null;
  metadata?: unknown;
  requestId: string | null;
  createdAt: string;
}

export interface AdminAuditList {
  items: AdminAuditEvent[];
  meta: AdminPageMeta;
}

export interface AdminOverview {
  counts: {
    pendingRegistrations: number;
    activeUsers: number;
    suspendedUsers: number;
    newThisWeek: number;
  };
  recentPending: AdminRegistrationSummary[];
  recentAudit: Array<{
    id: string;
    action: string;
    outcome: string;
    summary: string;
    actor: { id: string; name: string } | null;
    target: { id: string; name: string } | null;
    createdAt: string;
  }>;
}

export interface AdminClaimResult {
  user: AdminUserDetail;
  claimToken: string;
  claimExpiresAt: string;
  claimPath: string;
}

export interface AdminRecoveryResult {
  token: string;
  expiresAt: string;
  path: string;
}
