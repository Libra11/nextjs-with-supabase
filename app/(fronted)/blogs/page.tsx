/**
 * Author: Libra
 * Date: 2025-03-07 20:29:54
 * LastEditors: Libra
 * Description: 博客列表页面
 */
"use client";

import { Suspense, useState, useEffect } from "react";
import { BlogStatsSection } from "@/components/blog/blog-stats-section";
import { ToppedBlogsSection } from "@/components/blog/topped-blogs-section";
import { RegularBlogsSection } from "@/components/blog/regular-blogs-section";
import { BlogStatsSkeleton, ToppedBlogsSkeleton, RegularBlogsSkeleton } from "@/components/blog/blog-skeletons";
import { BlogErrorBoundary } from "@/components/blog/blog-error-boundary";

export default function BlogsPage() {
  const [mounted, setMounted] = useState(false);

  // 确保组件已挂载，防止 hydration 不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 如果组件还未挂载，返回骨架屏
  if (!mounted) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <BlogStatsSkeleton />
        <ToppedBlogsSkeleton />
        <div>
          <h2 className="title-gradient">最新文章</h2>
          <RegularBlogsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 博客统计 - 使用 Suspense + Error Boundary */}
      <BlogErrorBoundary fallback={<BlogStatsSkeleton />}>
        <Suspense fallback={<BlogStatsSkeleton />}>
          <BlogStatsSection />
        </Suspense>
      </BlogErrorBoundary>

      {/* 置顶博客 - 使用 Suspense + Error Boundary */}
      <BlogErrorBoundary fallback={<ToppedBlogsSkeleton />}>
        <Suspense fallback={<ToppedBlogsSkeleton />}>
          <ToppedBlogsSection />
        </Suspense>
      </BlogErrorBoundary>

      {/* 最新文章 - 使用 Suspense + Error Boundary */}
      <div>
        <h2 className="title-gradient">最新文章</h2>
      </div>

      <BlogErrorBoundary fallback={<RegularBlogsSkeleton />}>
        <Suspense fallback={<RegularBlogsSkeleton />}>
          <RegularBlogsSection />
        </Suspense>
      </BlogErrorBoundary>
    </div>
  );
}
