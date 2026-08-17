import { z } from "zod";
import { isCommuneInRegion } from "@/data/chile-communes";
import {
  chileRegionOptions,
  professionalModalities,
} from "@/domain/professional-registration";

const regionCodes = chileRegionOptions.map((region) => region.code) as [string, ...string[]];

export const professionalCoverageSchema = z
  .object({
    regionCode: z.enum(regionCodes, { error: "Selecciona una región." }),
    primaryCommune: z.string().trim().min(2, "Selecciona una comuna principal.").max(100),
    communeNames: z.array(z.string().trim().min(2).max(100)).min(1, "Selecciona al menos una comuna.").max(60),
    modalities: z.array(z.enum(professionalModalities)).min(1, "Selecciona al menos una modalidad."),
    hasVehicle: z.boolean(),
  })
  .superRefine((data, context) => {
    if (!isCommuneInRegion(data.regionCode, data.primaryCommune)) {
      context.addIssue({
        code: "custom",
        path: ["primaryCommune"],
        message: "La comuna principal no pertenece a la región seleccionada.",
      });
    }

    for (const communeName of data.communeNames) {
      if (!isCommuneInRegion(data.regionCode, communeName)) {
        context.addIssue({
          code: "custom",
          path: ["communeNames"],
          message: `${communeName} no pertenece a la región seleccionada.`,
        });
      }
    }
  });

export type ProfessionalCoverageInput = z.infer<typeof professionalCoverageSchema>;

export interface CoverageActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialCoverageActionState: CoverageActionState = { status: "idle" };

export function orderedCoverageCommunes(
  primaryCommune: string,
  communeNames: readonly string[],
): string[] {
  return [...new Set([primaryCommune, ...communeNames].map((name) => name.trim()).filter(Boolean))];
}
