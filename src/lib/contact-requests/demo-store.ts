import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { DemoProfessionalContact } from "@/data/demo-professional-contacts";
import type {
  ContactRequestTracking,
  CreateContactRequestInput,
  ContactRequestReceipt,
} from "@/domain/contact-request";
import type { ContactRequestStatus, ReviewStatus } from "@/domain/directory";
import type { CreateReviewInput, ReviewReceipt } from "@/domain/review";

export interface DemoContactRequestHistoryEntry {
  requestId: string;
  professionalId: string;
  professionalSlug: string;
  professionalDisplayName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  commune: string;
  service: string;
  description: string;
  consentAccepted: true;
  status: ContactRequestStatus;
  createdAt: string;
  isDemo: true;
}

interface StoredDemoContactRequest extends DemoContactRequestHistoryEntry {
  trackingTokenHash: string;
  review?: DemoReviewHistoryEntry;
}

export interface DemoReviewHistoryEntry {
  id: string;
  requestId: string;
  professionalId: string;
  professionalSlug: string;
  professionalDisplayName: string;
  customerDisplayName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  status: ReviewStatus;
  submittedAt: string;
  isDemo: true;
}

export type DemoStoreMutationError =
  | "REQUEST_NOT_FOUND"
  | "REQUEST_NOT_ELIGIBLE"
  | "REVIEW_ALREADY_SUBMITTED";

export type DemoStoreMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DemoStoreMutationError };

interface DemoContactRequestState {
  records: StoredDemoContactRequest[];
}

const MAX_DEMO_HISTORY_ENTRIES = 250;

const globalStore = globalThis as typeof globalThis & {
  __climaActivaDemoContactRequests?: DemoContactRequestState;
};

function getState(): DemoContactRequestState {
  globalStore.__climaActivaDemoContactRequests ??= { records: [] };
  return globalStore.__climaActivaDemoContactRequests;
}

function hashTrackingToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function hashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function withoutTokenHash(record: StoredDemoContactRequest): DemoContactRequestHistoryEntry {
  const { review: _review, trackingTokenHash: _trackingTokenHash, ...entry } = record;
  void _review;
  void _trackingTokenHash;
  return entry;
}

function findStoredRequestByTrackingToken(trackingToken: string): StoredDemoContactRequest | undefined {
  const candidateHash = hashTrackingToken(trackingToken);
  return getState().records.find((item) => hashesMatch(item.trackingTokenHash, candidateHash));
}

function toTrackingView(record: StoredDemoContactRequest): ContactRequestTracking {
  return {
    requestId: record.requestId,
    status: record.status,
    createdAt: record.createdAt,
    service: record.service,
    commune: record.commune,
    description: record.description,
    customerName: record.customerName,
    professional: {
      slug: record.professionalSlug,
      displayName: record.professionalDisplayName,
    },
    review: record.review
      ? {
          id: record.review.id,
          status: record.review.status,
          rating: record.review.rating,
          comment: record.review.comment,
          wouldRecommend: record.review.wouldRecommend,
          submittedAt: record.review.submittedAt,
        }
      : null,
  };
}

export function createDemoContactRequest(
  input: CreateContactRequestInput,
  professional: DemoProfessionalContact,
): ContactRequestReceipt {
  const trackingToken = randomBytes(32).toString("base64url");
  const createdAt = new Date().toISOString();
  const status: ContactRequestStatus = "new";
  const requestId = `SOL-${randomBytes(6).toString("hex").toUpperCase()}`;

  const records = getState().records;
  records.push({
    requestId,
    professionalId: input.professionalId,
    professionalSlug: input.professionalSlug,
    professionalDisplayName: professional.displayName,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    ...(input.customerPhone ? { customerPhone: input.customerPhone } : {}),
    commune: input.commune,
    service: input.service,
    description: input.description,
    consentAccepted: true,
    status,
    createdAt,
    isDemo: true,
    trackingTokenHash: hashTrackingToken(trackingToken),
  });
  if (records.length > MAX_DEMO_HISTORY_ENTRIES) {
    records.splice(0, records.length - MAX_DEMO_HISTORY_ENTRIES);
  }

  return {
    requestId,
    trackingToken,
    status,
    createdAt,
    professional: {
      slug: professional.slug,
      displayName: professional.displayName,
      email: professional.email,
      phone: professional.phone,
    },
  };
}

/** Returns newest first and never exposes the tracking-token hash. */
export function listDemoContactRequests(): DemoContactRequestHistoryEntry[] {
  return getState().records.toReversed().map(withoutTokenHash);
}

export function getDemoContactRequestByTrackingToken(
  trackingToken: string,
): DemoContactRequestHistoryEntry | undefined {
  const record = findStoredRequestByTrackingToken(trackingToken);
  return record ? withoutTokenHash(record) : undefined;
}

export function getDemoContactRequestTracking(
  trackingToken: string,
): ContactRequestTracking | undefined {
  const record = findStoredRequestByTrackingToken(trackingToken);
  return record ? toTrackingView(record) : undefined;
}

export function completeDemoContactRequest(
  trackingToken: string,
): DemoStoreMutationResult<ContactRequestTracking> {
  const record = findStoredRequestByTrackingToken(trackingToken);
  if (!record) return { ok: false, error: "REQUEST_NOT_FOUND" };

  if (["rejected", "cancelled", "expired"].includes(record.status)) {
    return { ok: false, error: "REQUEST_NOT_ELIGIBLE" };
  }

  record.status = "completed";
  return { ok: true, data: toTrackingView(record) };
}

export function createDemoReview(
  input: CreateReviewInput,
): DemoStoreMutationResult<ReviewReceipt> {
  const record = findStoredRequestByTrackingToken(input.trackingToken);
  if (!record) return { ok: false, error: "REQUEST_NOT_FOUND" };
  if (record.status !== "completed") return { ok: false, error: "REQUEST_NOT_ELIGIBLE" };
  if (record.review) return { ok: false, error: "REVIEW_ALREADY_SUBMITTED" };

  const submittedAt = new Date().toISOString();
  const review: DemoReviewHistoryEntry = {
    id: `EVA-${randomBytes(6).toString("hex").toUpperCase()}`,
    requestId: record.requestId,
    professionalId: record.professionalId,
    professionalSlug: record.professionalSlug,
    professionalDisplayName: record.professionalDisplayName,
    customerDisplayName: record.customerName,
    customerEmail: record.customerEmail,
    rating: input.rating,
    comment: input.comment,
    wouldRecommend: input.wouldRecommend,
    status: "pending",
    submittedAt,
    isDemo: true,
  };
  record.review = review;

  return {
    ok: true,
    data: {
      id: review.id,
      requestId: review.requestId,
      status: review.status,
      rating: review.rating,
      comment: review.comment,
      wouldRecommend: review.wouldRecommend,
      submittedAt: review.submittedAt,
      professional: {
        slug: review.professionalSlug,
        displayName: review.professionalDisplayName,
      },
    },
  };
}

/** Returns newest first. Intended only for authenticated fixture-mode administration. */
export function listDemoReviews(): DemoReviewHistoryEntry[] {
  return getState().records
    .flatMap((record) => (record.review ? [{ ...record.review }] : []))
    .toSorted((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

export function resetDemoContactRequestStoreForTests(): void {
  getState().records.length = 0;
}
