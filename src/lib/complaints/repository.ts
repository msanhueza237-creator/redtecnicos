import "server-only";

import { createHmac } from "node:crypto";
import type { ComplaintReceipt, CreateComplaintInput } from "@/domain/complaint";
import { createClient } from "@/lib/supabase/server";

interface ComplaintRpcRow {
  complaint_case_number: string;
  complaint_status: ComplaintReceipt["status"];
  complaint_created_at: string;
}

function requestNetworkIdentity(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "network-unavailable";
}

function complaintRateKey(request: Request): string {
  const secret = process.env.RATE_LIMIT_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("RATE_LIMIT_NOT_CONFIGURED");
  const rotation = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret)
    .update(`${rotation}:complaint:${requestNetworkIdentity(request)}`, "utf8")
    .digest("hex");
}

export async function createLiveComplaint(
  input: CreateComplaintInput,
  request: Request,
): Promise<ComplaintReceipt> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_public_complaint", {
    p_reporter_name: input.reporterName,
    p_reporter_email: input.reporterEmail,
    p_reporter_phone: input.reporterPhone ?? "",
    p_category: input.category,
    p_subject: input.subject,
    p_description: input.description,
    p_related_type: input.relatedType,
    p_related_reference: input.relatedReference ?? "",
    p_report_key_hash: complaintRateKey(request),
    p_consent_version: process.env.COMPLAINT_CONSENT_VERSION?.trim() || "privacy-v1",
  });

  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] as ComplaintRpcRow | undefined : undefined;
  if (!row) throw new Error("COMPLAINT_NOT_CREATED");

  return {
    caseNumber: row.complaint_case_number,
    status: row.complaint_status,
    createdAt: row.complaint_created_at,
  };
}
