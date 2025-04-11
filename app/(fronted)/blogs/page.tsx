/**
 * Author: Libra
 * Date: 2025-03-07 20:29:54
 * LastEditors: Libra
 * Description: 博客列表页面
 */
"use client";

import { getBlogs, getBlogStats } from "@/lib/blog";
import { getPublicUrl } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { BlogWithTags, BlogStats } from "@/types/blog";
import { BlogCard } from "@/components/ui/blog-card";
import { OverlappingCards } from "@/components/ui/overlapping-cards";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Tags, Eye, Clock } from "lucide-react";
import { StatsOverview } from "@/components/ui/stats-overview";
import { BlogSkeleton } from "@/components/ui/blog-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogsPage() {
  // 定义状态
  const [blogsWithUrls, setBlogsWithUrls] = useState<
    (BlogWithTags & { coverImageUrl: string })[]
  >([]);
  const [toppedBlogs, setToppedBlogs] = useState<
    (BlogWithTags & { coverImageUrl: string })[]
  >([]);
  const [regularBlogs, setRegularBlogs] = useState<
    (BlogWithTags & { coverImageUrl: string })[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [blogStats, setBlogStats] = useState<BlogStats>({
    blogCount: 0,
    tagCount: 0,
    viewCount: 0,
    dayCount: 0,
  });

  const PAGE_SIZE = 8; // 每页显示的博客数量

  const loadingRef = useRef(false);
  const currentPageRef = useRef(1);

  // 确保组件已挂载，防止 hydration 不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取封面图的公共URL
  const getCoverImage = async (cover_image: string) => {
    const url = await getPublicUrl(BUCKET_NAME, cover_image);
    return url || "";
  };

  // 加载博客数据并处理封面图片
  const loadBlogs = async (isInitialLoad = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;

      const { blogs: newBlogs, count } = await getBlogs(
        currentPageRef.current,
        PAGE_SIZE,
        { status: "published" }
      );

      if (!newBlogs || newBlogs.length === 0) {
        setHasMore(false);
        if (isInitialLoad) {
          setInitialLoadComplete(true);
        }
        return;
      }

      // 处理新获取的博客封面图片
      const blogsWithCoverUrls = await Promise.all(
        newBlogs.map(async (blog) => ({
          ...blog,
          coverImageUrl: blog.cover_image
            ? await getCoverImage(blog.cover_image)
            : "",
        }))
      );

      // 更新数据
      if (isInitialLoad) {
        setBlogsWithUrls(blogsWithCoverUrls);
      } else {
        setBlogsWithUrls((prev) => [...prev, ...blogsWithCoverUrls]);
      }

      // 更新分页状态
      const nextPage = currentPageRef.current + 1;
      setHasMore(currentPageRef.current * PAGE_SIZE < count);

      // 更新页码
      currentPageRef.current = nextPage;
      if (isInitialLoad) {
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error("加载博客失败", error);
    } finally {
      loadingRef.current = false;
    }
  };

  // 组件挂载或重置时加载初始数据
  useEffect(() => {
    if (mounted) {
      loadBlogs(true);
      loadBlogStats();
    }
  }, [mounted]);

  // 加载博客统计数据
  const loadBlogStats = async () => {
    try {
      const stats = await getBlogStats();
      setBlogStats(stats);
    } catch (error) {
      console.error("加载博客统计数据失败", error);
    }
  };

  // 分离置顶和普通博客
  useEffect(() => {
    if (blogsWithUrls.length > 0) {
      const topped = blogsWithUrls.filter((blog) => blog.is_top);
      const regular = blogsWithUrls.filter((blog) => !blog.is_top);
      setToppedBlogs(topped);
      setRegularBlogs(regular);
    }
  }, [blogsWithUrls]);

  const loadMore = async () => {
    if (!initialLoadComplete || loadingRef.current) return;
    await loadBlogs();
  };

  // 如果组件还未挂载，返回骨架屏
  if (!mounted) {
    return (
      <div className="mx-auto max-w-[1200px]">
        {/* 统计卡片骨架 */}
        <div className="mb-16 mt-8">
          <h2 className="title-gradient">博客统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>

        {/* 置顶博客骨架 */}
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

        {/* 最新文章骨架 */}
        <div>
          <h2 className="title-gradient">最新文章</h2>
          <BlogSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 使用 StatsOverview 组件，传递真实的统计数据 */}
      <StatsOverview
        blogCount={blogStats.blogCount}
        tagCount={blogStats.tagCount}
        viewCount={blogStats.viewCount}
        dayCount={blogStats.dayCount}
        className="mb-16 mt-0 md:mt-8"
      />

      {/* 置顶博客展示区 */}
      {toppedBlogs.length > 0 ? (
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <h2 className="title-gradient">置顶推荐</h2>
          </div>

          <div className="relative w-full h-[346px]">
            <OverlappingCards
              items={toppedBlogs}
              cardWidth={280}
              cardSpacing={150}
              className="h-full w-full"
              renderItem={(blog) => (
                <BlogCard
                  blog={blog}
                  className={cn("border-none")}
                  bgClassName="bg-gradient-to-r from-[#222222] to-[#0d0d0d]"
                />
              )}
            />
          </div>
        </div>
      ) : loadingRef.current && !initialLoadComplete ? (
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
      ) : null}

      <div>
        <h2 className="title-gradient">最新文章</h2>
      </div>

      {blogsWithUrls.length === 0 && !loadingRef.current ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">暂无博客文章</p>
        </div>
      ) : (
        <>
          {/* 博客列表 - 显示骨架屏或实际内容 */}
          {loadingRef.current && regularBlogs.length === 0 ? (
            <BlogSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularBlogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  bgClassName="shadow-[inset_0px_0px_25px_12px_#222222] overflow-hidden"
                />
              ))}
            </div>
          )}

          {/* 无限滚动加载组件 */}
          {initialLoadComplete && (
            <InfiniteScroll
              hasMore={hasMore}
              loadMore={loadMore}
              isLoading={loadingRef.current}
              loadingText="加载更多博客..."
              endMessage="已经到底了，没有更多博客了"
              loaderClassName="flex justify-center items-center py-10 text-muted-foreground"
              endMessageClassName="text-center py-10 text-muted-foreground text-sm"
            />
          )}
        </>
      )}
    </div>
  );
}
