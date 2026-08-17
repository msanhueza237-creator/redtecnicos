import { describe, expect, it } from "vitest";
import {
  bucketStatisticsTimeline,
  createDemoAdminStatistics,
  parseStatisticsPeriod,
} from "@/domain/admin-statistics";

describe("admin statistics", () => {
  it("accepts only the supported reporting periods", () => {
    expect(parseStatisticsPeriod("7")).toBe(7);
    expect(parseStatisticsPeriod(["90", "30"])).toBe(90);
    expect(parseStatisticsPeriod("365")).toBe(365);
    expect(parseStatisticsPeriod("15")).toBe(30);
    expect(parseStatisticsPeriod(undefined)).toBe(30);
  });

  it("groups a long daily series without losing requests", () => {
    const points = Array.from({ length: 30 }, (_, index) => ({
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
      value: index % 4,
    }));
    const buckets = bucketStatisticsTimeline(points, 10);

    expect(buckets).toHaveLength(10);
    expect(buckets[0]).toEqual({ startDate: "2026-07-01", endDate: "2026-07-03", value: 3 });
    expect(buckets.reduce((total, bucket) => total + bucket.value, 0)).toBe(
      points.reduce((total, point) => total + point.value, 0),
    );
  });

  it("creates coherent demo indicators for the selected period", () => {
    const statistics = createDemoAdminStatistics(7, new Date("2026-08-17T12:00:00.000Z"));

    expect(statistics.periodDays).toBe(7);
    expect(statistics.requestTimeline).toHaveLength(7);
    expect(statistics.metrics.requestsCreated).toBe(
      statistics.requestTimeline.reduce((total, point) => total + point.value, 0),
    );
    expect(statistics.metrics.completedRequests).toBeLessThanOrEqual(statistics.metrics.requestsCreated);
    expect(statistics.regions.every((region) => region.value > 0)).toBe(true);
  });
});
