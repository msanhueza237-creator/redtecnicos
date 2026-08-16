"use server";

import { revalidatePath } from "next/cache";
import { contactRequestStatusSchema } from "@/domain/directory";
import { requireAppRole } from "@/lib/auth/session";
import { updateOwnedContactRequestStatus } from "@/lib/contact-requests/private-repository";

export async function updateRequestStatusAction(requestId: string, formData: FormData) {
  await requireAppRole(["technician", "company"], "/panel/solicitudes");
  const status = contactRequestStatusSchema.safeParse(formData.get("status"));
  if (!status.success) return;
  await updateOwnedContactRequestStatus(requestId, status.data);
  revalidatePath("/panel/solicitudes");
  revalidatePath("/panel");
}
