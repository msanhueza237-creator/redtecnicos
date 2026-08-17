export interface DirectoryMetricProfile {
  communes: readonly string[];
  rating: number;
  reviewCount: number;
}

export interface DirectoryMetrics {
  profileCount: number;
  communeCount: number;
  publishedReviewCount: number;
  averageRating: number;
}

export function calculateDirectoryMetrics(profiles: readonly DirectoryMetricProfile[]): DirectoryMetrics {
  const publishedReviewCount = profiles.reduce((total, profile) => total + profile.reviewCount, 0);
  const weightedRatingTotal = profiles.reduce(
    (total, profile) => total + profile.rating * profile.reviewCount,
    0,
  );

  return {
    profileCount: profiles.length,
    communeCount: new Set(profiles.flatMap((profile) => profile.communes)).size,
    publishedReviewCount,
    averageRating: publishedReviewCount > 0 ? weightedRatingTotal / publishedReviewCount : 0,
  };
}
