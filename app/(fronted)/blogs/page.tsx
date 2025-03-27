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
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Tags, Eye, Clock } from "lucide-react";
import { StatsOverview } from "@/components/ui/stats-overview";
import { BlogSkeleton } from "@/components/ui/blog-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogsPage() {
  // 定义状态
  const [page, setPage] = useState(1);
  const [blogs, setBlogs] = useState<BlogWithTags[]>([]);
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
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  // 客户端渲染标志
  const [mounted, setMounted] = useState(false);
  // 博客统计数据
  const [blogStats, setBlogStats] = useState<BlogStats>({
    blogCount: 0,
    tagCount: 0,
    viewCount: 0,
    dayCount: 0,
  });

  const PAGE_SIZE = 8; // 每页显示的博客数量

  // 使用 useRef 跟踪页面是否已经挂载，防止重复加载
  const isMounted = useRef(false);

  // 确保组件已挂载，防止 hydration 不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取封面图的公共URL
  const getCoverImage = async (cover_image: string) => {
    const url = await getPublicUrl(BUCKET_NAME, cover_image);
    return url || "";
  };

  // 加载初始数据
  useEffect(() => {
    // 确保组件已挂载
    if (!mounted) return;

    // 如果页面已经挂载过一次，重置状态
    if (isMounted.current) {
      // 重置页面到初始状态，而不是直接加载，避免重复
      setPage(1);
      setBlogs([]);
      setBlogsWithUrls([]);
      setToppedBlogs([]);
      setRegularBlogs([]);
      setHasMore(true);
      setInitialLoadComplete(false);

      // 延迟加载，确保状态已经重置
      setTimeout(() => {
        loadBlogs(true);
        loadBlogStats();
      }, 0);
    } else {
      // 首次挂载，直接加载
      loadBlogs(true);
      loadBlogStats();
      isMounted.current = true;
    }

    // 组件卸载时的清理函数
    return () => {
      // 不重置isMounted，这样我们可以知道组件已经挂载过
    };
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

      console.log(blogsWithUrls);
      setToppedBlogs(topped);
      setRegularBlogs(regular);
    }
  }, [blogsWithUrls]);

  // 加载博客数据并处理封面图片
  const loadBlogs = async (isInitialLoad = false) => {
    if (loading) return;

    try {
      setLoading(true);
      // 构建筛选条件 - 只显示已发布的博客
      const filters = { status: "published" };

      const { blogs: newBlogs, count } = await getBlogs(
        page,
        PAGE_SIZE,
        filters
      );

      if (!newBlogs || newBlogs.length === 0) {
        setHasMore(false);
        setLoading(false);

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

      // 如果是初始加载，则替换现有数据，否则追加
      if (isInitialLoad) {
        setBlogs(newBlogs);
        setBlogsWithUrls(blogsWithCoverUrls);
      } else {
        // 合并新旧博客数据并去重
        setBlogs((prevBlogs) => {
          // 使用博客ID进行去重
          const blogIds = new Set(prevBlogs.map((blog) => blog.id));
          const uniqueNewBlogs = newBlogs.filter(
            (blog) => !blogIds.has(blog.id)
          );
          return [...prevBlogs, ...uniqueNewBlogs];
        });

        setBlogsWithUrls((prevBlogs) => {
          // 使用博客ID进行去重
          const blogIds = new Set(prevBlogs.map((blog) => blog.id));
          const uniqueNewBlogs = blogsWithCoverUrls.filter(
            (blog) => !blogIds.has(blog.id)
          );
          return [...prevBlogs, ...uniqueNewBlogs];
        });
      }

      // 正确判断是否还有更多数据
      const currentTotal = isInitialLoad
        ? newBlogs.length
        : blogs.length + newBlogs.length;
      setHasMore(currentTotal < count);

      // 更新页码
      setPage((prevPage) => prevPage + 1);

      if (isInitialLoad) {
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error("加载博客失败", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!initialLoadComplete) return;
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
        className="mb-16 mt-8"
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
      ) : loading && !initialLoadComplete ? (
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

      {blogsWithUrls.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">暂无博客文章</p>
        </div>
      ) : (
        <>
          {/* 博客列表 - 显示骨架屏或实际内容 */}
          {loading && regularBlogs.length === 0 ? (
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
              isLoading={loading}
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
