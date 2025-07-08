/*
 * @Author: Libra
 * @Date: 2025-01-08
 * @LastEditors: Libra
 * @Description: Blog stats section with Suspense
 */
import { useBlogStats } from '@/hooks/use-blog-suspense';
import { StatsOverview } from '@/components/ui/stats-overview';

export function BlogStatsSection() {
  const blogStats = useBlogStats();

  return (
    <StatsOverview
      blogCount={blogStats.blogCount}
      tagCount={blogStats.tagCount}
      viewCount={blogStats.viewCount}
      dayCount={blogStats.dayCount}
      className="mb-16 mt-0 md:mt-8"
    />
  );
}