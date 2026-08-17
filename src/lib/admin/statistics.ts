import "server-only";

import {
  adminStatisticsSchema,
  type AdminStatistics,
  type StatisticsPeriod,
} from "@/domain/admin-statistics";
import { createClient } from "@/lib/supabase/server";

export async function getAdminStatistics(
  periodDays: StatisticsPeriod,
): Promise<{ data: AdminStatistics | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_statistics", {
    p_period_days: periodDays,
  });

  if (error) {
    return { data: null, error: "No fue posible cargar las estadísticas desde Supabase." };
  }

  const parsed = adminStatisticsSchema.safeParse(data);
  if (!parsed.success) {
    return { data: null, error: "Supabase devolvió estadísticas con un formato inesperado." };
  }

  return { data: parsed.data, error: null };
}
