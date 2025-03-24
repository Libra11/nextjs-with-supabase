/**
 * Author: Libra
 * Date: 2025-04-01
 * LastEditors: Libra
 * Description: 博客卡片骨架屏组件
 */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

interface BlogSkeletonProps {
  count?: number;
  className?: string;
}

export function BlogSkeleton({ count = 8, className = "" }: BlogSkeletonProps) {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;
  const isLightTheme = currentTheme === "light";

  // 生成指定数量的骨架卡片
  const skeletonCards = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className="rounded-xl overflow-hidden h-[314px] bg-card border border-border/30"
    >
      {/* 封面图区域 */}
      <Skeleton className="w-full h-[180px] rounded-t-lg rounded-b-none" />

      <div className="p-3">
        {/* 标签和标题区域 */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-3/4 h-6" />
        </div>

        {/* 描述区域 */}
        <Skeleton className="w-full h-4 mt-2" />
        <Skeleton className="w-5/6 h-4 mt-2" />

        {/* 底部信息区域 */}
        <div className="flex items-center gap-3 mt-4">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
    </div>
  ));

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {skeletonCards}
    </div>
  );
}

export default BlogSkeleton;
