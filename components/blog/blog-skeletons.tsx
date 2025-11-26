/*
 * @Author: Libra
 * @Date: 2025-01-08
 * @LastEditors: Libra
 * @Description: Skeleton components for blog loading states
 */
import { Skeleton } from '@/components/ui/skeleton';

export function BlogStatsSkeleton() {
  return (
    <div className="mb-16 mt-0 md:mt-8">
      <h2 className="title-gradient">博客统计</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ToppedBlogsSkeleton() {
  return (
    <div className="mb-16">
      <h2 className="title-gradient">置顶推荐</h2>
      <div className="relative w-full h-[346px] bg-card/50 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 gap-4 p-6">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function RegularBlogsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-[300px] rounded-xl" />
      ))}
    </div>
  );
}