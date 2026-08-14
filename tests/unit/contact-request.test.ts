import { beforeEach, describe, expect, it } from "vitest";
import { demoProfessionalContacts, getDemoProfessionalContact } from "@/data/demo-professional-contacts";
import { demoProfessionals } from "@/data/demo-professionals";
import { createContactRequestSchema } from "@/domain/contact-request";
import { createReviewSchema } from "@/domain/review";
import {
  completeDemoContactRequest,
  createDemoContactRequest,
  createDemoReview,
  getDemoContactRequestByTrackingToken,
  getDemoContactRequestTracking,
  listDemoContactRequests,
  listDemoReviews,
  resetDemoContactRequestStoreForTests,
} from "@/lib/contact-requests/demo-store";

const validInput = {
  professionalId: "demo-001",
  professionalSlug: "climasur-demo-spa",
  customerName: "Cliente Demo",
  customerEmail: "CLIENTE@EXAMPLE.INVALID",
  customerPhone: "",
  commune: "Puerto Montt",
  service: "Mantención de aire acondicionado",
  description: "Necesito una visita técnica de demostración.",
  consentAccepted: true,
} as const;

describe("contact request schema", () => {
  it("normalizes safe customer input", () => {
    const result = createContactRequestSchema.parse(validInput);

    expect(result.customerEmail).toBe("cliente@example.invalid");
    expect(result.customerPhone).toBeUndefined();
    expect(result.consentAccepted).toBe(true);
  });

  it("requires consent and a valid email", () => {
    const result = createContactRequestSchema.safeParse({
      ...validInput,
      customerEmail: "correo-invalido",
      consentAccepted: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.customerEmail).toBeDefined();
      expect(fields.consentAccepted).toBeDefined();
    }
  });

  it("rejects undeclared fields", () => {
    expect(createContactRequestSchema.safeParse({ ...validInput, administrativeRole: "admin" }).success).toBe(false);
  });
});

describe("fixture contact-request store", () => {
  beforeEach(() => resetDemoContactRequestStoreForTests());

  it("has one isolated demo contact for every public fixture", () => {
    expect(demoProfessionalContacts).toHaveLength(demoProfessionals.length);
    for (const profile of demoProfessionals) {
      expect(getDemoProfessionalContact(profile.id, profile.slug)?.displayName).toBe(profile.displayName);
    }
  });

  it("stores history while returning the professional contact immediately", () => {
    const input = createContactRequestSchema.parse(validInput);
    const professional = getDemoProfessionalContact(input.professionalId, input.professionalSlug);
    expect(professional).toBeDefined();

    const receipt = createDemoContactRequest(input, professional!);
    const history = listDemoContactRequests();

    expect(receipt.professional).toEqual({
      slug: "climasur-demo-spa",
      displayName: "ClimaSur Demo SpA",
      email: "climasur@demo.redtecnicos.invalid",
      phone: "+56 9 0000 0001",
    });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      requestId: receipt.requestId,
      customerEmail: "cliente@example.invalid",
      status: "new",
      isDemo: true,
    });
    expect(JSON.stringify(history)).not.toContain(receipt.trackingToken);
    expect(JSON.stringify(history)).not.toContain("trackingTokenHash");
    expect(getDemoContactRequestByTrackingToken(receipt.trackingToken)?.requestId).toBe(receipt.requestId);
    expect(getDemoContactRequestByTrackingToken("token-inexistente")).toBeUndefined();
  });

  it("creates independent opaque tracking tokens", () => {
    const input = createContactRequestSchema.parse(validInput);
    const professional = getDemoProfessionalContact(input.professionalId, input.professionalSlug)!;
    const first = createDemoContactRequest(input, professional);
    const second = createDemoContactRequest(input, professional);

    expect(first.trackingToken).not.toBe(second.trackingToken);
    expect(first.trackingToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(listDemoContactRequests()).toHaveLength(2);
  });

  it("allows one moderated review only after the work is completed", () => {
    const input = createContactRequestSchema.parse(validInput);
    const professional = getDemoProfessionalContact(input.professionalId, input.professionalSlug)!;
    const receipt = createDemoContactRequest(input, professional);
    const reviewInput = createReviewSchema.parse({
      trackingToken: receipt.trackingToken,
      rating: 5,
      comment: "Trabajo ficticio terminado con buena comunicación y orden.",
      wouldRecommend: true,
      customerDeclaration: true,
    });

    expect(createDemoReview(reviewInput)).toEqual({ ok: false, error: "REQUEST_NOT_ELIGIBLE" });

    const completion = completeDemoContactRequest(receipt.trackingToken);
    expect(completion.ok).toBe(true);
    if (completion.ok) expect(completion.data.status).toBe("completed");

    const firstReview = createDemoReview(reviewInput);
    expect(firstReview.ok).toBe(true);
    if (firstReview.ok) {
      expect(firstReview.data).toMatchObject({
        requestId: receipt.requestId,
        status: "pending",
        rating: 5,
        wouldRecommend: true,
      });
    }
    expect(createDemoReview(reviewInput)).toEqual({ ok: false, error: "REVIEW_ALREADY_SUBMITTED" });
    expect(listDemoReviews()).toHaveLength(1);
    expect(getDemoContactRequestTracking(receipt.trackingToken)?.review).toMatchObject({
      status: "pending",
      rating: 5,
    });
    expect(JSON.stringify(listDemoReviews())).not.toContain(receipt.trackingToken);
  });

  it("validates rating, declaration and useful comment length", () => {
    const result = createReviewSchema.safeParse({
      trackingToken: "a".repeat(43),
      rating: 6,
      comment: "Muy bien",
      wouldRecommend: true,
      customerDeclaration: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.rating).toBeDefined();
      expect(fields.comment).toBeDefined();
      expect(fields.customerDeclaration).toBeDefined();
    }
  });
});
