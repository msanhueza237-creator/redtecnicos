import { z } from "zod";

export const statisticsPeriods = [7, 30, 90, 365] as const;
export type StatisticsPeriod = (typeof statisticsPeriods)[number];

const statisticsCountSchema = z.object({
  key: z.string().min(1),
  value: z.number().int().nonnegative(),
});

const statisticsTimelinePointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  value: z.number().int().nonnegative(),
});

export const adminStatisticsSchema = z.object({
  periodDays: z.number().int().refine(
    (value): value is StatisticsPeriod => statisticsPeriods.includes(value as StatisticsPeriod),
  ),
  generatedAt: z.string().min(1),
  metrics: z.object({
    requestsCreated: z.number().int().nonnegative(),
    completedRequests: z.number().int().nonnegative(),
    completionRate: z.number().min(0).max(100),
    publishedProfiles: z.number().int().nonnegative(),
    averageRating: z.number().min(0).max(5),
    publishedReviews: z.number().int().nonnegative(),
    pendingReviews: z.number().int().nonnegative(),
    openComplaints: z.number().int().nonnegative(),
  }),
  requestTimeline: z.array(statisticsTimelinePointSchema),
  regions: z.array(statisticsCountSchema),
  services: z.array(statisticsCountSchema),
  requestStatuses: z.array(statisticsCountSchema),
});

export type AdminStatistics = z.infer<typeof adminStatisticsSchema>;
export type StatisticsTimelinePoint = z.infer<typeof statisticsTimelinePointSchema>;

export interface StatisticsTimelineBucket {
  startDate: string;
  endDate: string;
  value: number;
}

export function parseStatisticsPeriod(value: unknown): StatisticsPeriod {
  const candidate = Array.isArray(value) ? value[0] : value;
  const numericValue = typeof candidate === "string" ? Number(candidate) : candidate;
  return statisticsPeriods.includes(numericValue as StatisticsPeriod)
    ? numericValue as StatisticsPeriod
    : 30;
}

export function bucketStatisticsTimeline(
  points: StatisticsTimelinePoint[],
  maxBuckets = 12,
): StatisticsTimelineBucket[] {
  if (!points.length || maxBuckets < 1) return [];
  const bucketSize = Math.max(1, Math.ceil(points.length / maxBuckets));
  const buckets: StatisticsTimelineBucket[] = [];

  for (let index = 0; index < points.length; index += bucketSize) {
    const group = points.slice(index, index + bucketSize);
    const first = group[0];
    const last = group.at(-1);
    if (!first || !last) continue;
    buckets.push({
      startDate: first.date,
      endDate: last.date,
      value: group.reduce((total, point) => total + point.value, 0),
    });
  }

  return buckets;
}

export function createEmptyAdminStatistics(periodDays: StatisticsPeriod): AdminStatistics {
  return {
    periodDays,
    generatedAt: new Date().toISOString(),
    metrics: {
      requestsCreated: 0,
      completedRequests: 0,
      completionRate: 0,
      publishedProfiles: 0,
      averageRating: 0,
      publishedReviews: 0,
      pendingReviews: 0,
      openComplaints: 0,
    },
    requestTimeline: [],
    regions: [],
    services: [],
    requestStatuses: [],
  };
}

export function createDemoAdminStatistics(
  periodDays: StatisticsPeriod,
  generatedAt = new Date(),
): AdminStatistics {
  const start = new Date(Date.UTC(
    generatedAt.getUTCFullYear(),
    generatedAt.getUTCMonth(),
    generatedAt.getUTCDate() - periodDays + 1,
  ));
  const pattern = [0, 1, 2, 1, 3, 2, 1, 0, 2, 4, 1, 2] as const;
  const requestTimeline = Array.from({ length: periodDays }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      value: pattern[index % pattern.length] ?? 0,
    };
  });
  const requestsCreated = requestTimeline.reduce((total, point) => total + point.value, 0);
  const completedRequests = Math.round(requestsCreated * 0.58);

  return {
    periodDays,
    generatedAt: generatedAt.toISOString(),
    metrics: {
      requestsCreated,
      completedRequests,
      completionRate: requestsCreated ? Number((completedRequests * 100 / requestsCreated).toFixed(1)) : 0,
      publishedProfiles: 48,
      averageRating: 4.7,
      publishedReviews: 98,
      pendingReviews: 3,
      openComplaints: 2,
    },
    requestTimeline,
    regions: [
      { key: "CL-RM", value: Math.max(1, Math.round(requestsCreated * 0.42)) },
      { key: "CL-VS", value: Math.max(1, Math.round(requestsCreated * 0.24)) },
      { key: "CL-BI", value: Math.max(1, Math.round(requestsCreated * 0.18)) },
      { key: "CL-LL", value: Math.max(1, Math.round(requestsCreated * 0.12)) },
    ],
    services: [
      { key: "Instalación de aire acondicionado", value: Math.max(1, Math.round(requestsCreated * 0.38)) },
      { key: "Mantención de aire acondicionado", value: Math.max(1, Math.round(requestsCreated * 0.29)) },
      { key: "Diagnóstico técnico", value: Math.max(1, Math.round(requestsCreated * 0.2)) },
      { key: "Refrigeración comercial", value: Math.max(1, Math.round(requestsCreated * 0.13)) },
    ],
    requestStatuses: [
      { key: "new", value: Math.max(1, Math.round(requestsCreated * 0.18)) },
      { key: "contacted", value: Math.max(1, Math.round(requestsCreated * 0.15)) },
      { key: "accepted", value: Math.max(1, Math.round(requestsCreated * 0.09)) },
      { key: "completed", value: completedRequests },
    ],
  };
}
