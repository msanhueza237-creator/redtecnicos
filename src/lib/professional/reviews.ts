import "server-only";

import type { ReviewStatus } from "@/domain/directory";
import { createClient } from "@/lib/supabase/server";

export interface OwnedProfessionalReview {
  id: string;
  requestId: string;
  customerName: string;
  service: string;
  commune: string;
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  status: ReviewStatus;
  professionalReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface OwnedReviewRow {
  review_id: string;
  request_id: string;
  customer_name: string;
  requested_service: string;
  requester_commune: string;
  review_rating: number;
  review_comment: string;
  would_recommend: boolean;
  review_status: ReviewStatus;
  professional_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export async function listOwnedProfessionalReviews(): Promise<{ data: OwnedProfessionalReview[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_owned_professional_reviews");
  if (error) return { data: [], error: "No fue posible cargar tus evaluaciones." };

  return {
    data: ((data ?? []) as unknown as OwnedReviewRow[]).map((row) => ({
      id: row.review_id,
      requestId: row.request_id,
      customerName: row.customer_name,
      service: row.requested_service,
      commune: row.requester_commune,
      rating: row.review_rating,
      comment: row.review_comment,
      wouldRecommend: row.would_recommend,
      status: row.review_status,
      professionalReply: row.professional_reply,
      repliedAt: row.replied_at,
      createdAt: row.created_at,
    })),
    error: null,
  };
}
