import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import type { CreateContactRequestInput, ContactRequestReceipt, ContactRequestTracking } from "@/domain/contact-request";
import type { CreateReviewInput, ReviewReceipt } from "@/domain/review";
import { createClient } from "@/lib/supabase/server";

interface ContactRpcRow {
  request_id: string;
  request_status: ContactRequestReceipt["status"];
  request_created_at: string;
  professional_slug: string;
  professional_display_name: string;
  professional_email: string;
  professional_phone: string;
  professional_whatsapp: string;
}

interface TrackingRpcRow {
  request_id: string;
  request_status: ContactRequestTracking["status"];
  request_created_at: string;
  requested_service: string;
  requester_commune: string;
  request_description: string;
  requester_name: string;
  requester_email_verified_at: string | null;
  professional_slug: string;
  professional_display_name: string;
  review_data: ContactRequestTracking["review"];
}

interface ReviewRpcRow {
  review_id: string;
  request_id: string;
  review_status: ReviewReceipt["status"];
  review_rating: number;
  review_comment: string;
  review_would_recommend: boolean;
  review_created_at: string;
  professional_slug: string;
  professional_display_name: string;
}

export interface ContactEmailContext {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  commune: string;
  service: string;
  description: string;
  professionalName: string;
  professionalEmail: string;
  professionalPhone: string;
  trackingToken: string;
  verificationToken: string;
}

export interface CreatedLiveContactRequest {
  receipt: ContactRequestReceipt;
  email: ContactEmailContext;
}

function rawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function requestNetworkIdentity(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "network-unavailable";
}

function requestRateKey(request: Request): string {
  const secret = process.env.RATE_LIMIT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("RATE_LIMIT_NOT_CONFIGURED");
  }
  const rotation = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret)
    .update(`${rotation}:${requestNetworkIdentity(request)}`, "utf8")
    .digest("hex");
}

function firstRow<T>(data: unknown): T | undefined {
  return Array.isArray(data) ? data[0] as T | undefined : undefined;
}

export async function createLiveContactRequest(
  input: CreateContactRequestInput,
  request: Request,
): Promise<CreatedLiveContactRequest> {
  const trackingToken = rawToken();
  const verificationToken = rawToken();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_public_contact_request", {
    p_professional_profile_id: input.professionalId,
    p_professional_slug: input.professionalSlug,
    p_requester_name: input.customerName,
    p_requester_email: input.customerEmail,
    p_requester_phone: input.customerPhone ?? "",
    p_requester_commune: input.commune,
    p_requested_service: input.service,
    p_description: input.description,
    p_tracking_token_hash: hashOpaqueToken(trackingToken),
    p_email_verification_token_hash: hashOpaqueToken(verificationToken),
    p_request_key_hash: requestRateKey(request),
    p_consent_version: process.env.CONTACT_CONSENT_VERSION?.trim() || "privacy-v1",
  });

  if (error) throw new Error(error.message);
  const row = firstRow<ContactRpcRow>(data);
  if (!row) throw new Error("CONTACT_REQUEST_NOT_CREATED");

  return {
    receipt: {
      requestId: row.request_id,
      trackingToken,
      status: row.request_status,
      createdAt: row.request_created_at,
      professional: {
        slug: row.professional_slug,
        displayName: row.professional_display_name,
        email: row.professional_email,
        phone: row.professional_phone,
        whatsapp: row.professional_whatsapp,
      },
    },
    email: {
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      commune: input.commune,
      service: input.service,
      description: input.description,
      professionalName: row.professional_display_name,
      professionalEmail: row.professional_email,
      professionalPhone: row.professional_phone,
      trackingToken,
      verificationToken,
    },
  };
}

export async function getLiveContactRequestTracking(trackingToken: string): Promise<ContactRequestTracking | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_contact_request_by_token", {
    p_tracking_token_hash: hashOpaqueToken(trackingToken),
  });
  if (error) throw new Error(error.message);
  const row = firstRow<TrackingRpcRow>(data);
  if (!row) return undefined;

  return {
    requestId: row.request_id,
    status: row.request_status,
    createdAt: row.request_created_at,
    service: row.requested_service,
    commune: row.requester_commune,
    description: row.request_description,
    customerName: row.requester_name,
    professional: {
      slug: row.professional_slug,
      displayName: row.professional_display_name,
    },
    review: row.review_data,
  };
}

export async function verifyLiveContactRequestEmail(verificationToken: string, trackingToken: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("verify_contact_request_email", {
    p_verification_token_hash: hashOpaqueToken(verificationToken),
    p_tracking_token_hash: hashOpaqueToken(trackingToken),
  });
  if (error) throw new Error(error.message);
}

export async function completeLiveContactRequest(trackingToken: string): Promise<ContactRequestTracking | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_public_contact_request", {
    p_tracking_token_hash: hashOpaqueToken(trackingToken),
  });
  if (error) throw new Error(error.message);
  return getLiveContactRequestTracking(trackingToken);
}

export async function createLiveReview(input: CreateReviewInput): Promise<ReviewReceipt> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_public_review", {
    p_tracking_token_hash: hashOpaqueToken(input.trackingToken),
    p_rating: input.rating,
    p_comment: input.comment,
    p_would_recommend: input.wouldRecommend,
  });
  if (error) throw new Error(error.message);
  const row = firstRow<ReviewRpcRow>(data);
  if (!row) throw new Error("REVIEW_NOT_CREATED");
  return {
    id: row.review_id,
    requestId: row.request_id,
    status: row.review_status,
    rating: row.review_rating,
    comment: row.review_comment,
    wouldRecommend: row.review_would_recommend,
    submittedAt: row.review_created_at,
    professional: {
      slug: row.professional_slug,
      displayName: row.professional_display_name,
    },
  };
}
