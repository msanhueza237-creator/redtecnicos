import { describe, expect, it } from "vitest";
import {
  availableReviewDecisions,
  reviewModerationSchema,
  reviewStatusLabels,
  reviewStatusTone,
} from "@/domain/review-moderation";

describe("moderación de evaluaciones", () => {
  it("exige un identificador, una decisión conocida y un motivo auditable", () => {
    expect(reviewModerationSchema.safeParse({
      reviewId: "9ed95a3c-3a3d-451f-8cb1-cd81b935ff4d",
      decision: "publish",
      reason: "Solicitud completada y comentario revisado.",
    }).success).toBe(true);

    expect(reviewModerationSchema.safeParse({
      reviewId: "no-es-un-uuid",
      decision: "publish",
      reason: "corto",
    }).success).toBe(false);
  });

  it("limita las decisiones disponibles según el estado", () => {
    expect(availableReviewDecisions("pending")).toEqual(["publish", "reject"]);
    expect(availableReviewDecisions("published")).toEqual(["hide"]);
    expect(availableReviewDecisions("hidden")).toEqual(["publish", "reject"]);
    expect(availableReviewDecisions("rejected")).toEqual(["publish"]);
  });

  it("presenta estados administrativos claros", () => {
    expect(reviewStatusLabels.published).toBe("Publicada");
    expect(reviewStatusTone("published")).toBe("success");
    expect(reviewStatusTone("rejected")).toBe("danger");
  });
});
