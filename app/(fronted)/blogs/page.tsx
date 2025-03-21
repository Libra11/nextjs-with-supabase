/**
 * Author: Libra
 * Date: 2025-03-07 20:29:54
 * LastEditors: Libra
 * Description: 博客列表页面
 */
"use client";

import { getBlogs } from "@/lib/blog";
import { getPublicUrl } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { BlogWithTags } from "@/types/blog";
import { BlogCard } from "@/components/ui/blog-card";
import { OverlappingCards } from "@/components/ui/overlapping-cards";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
  const PAGE_SIZE = 8; // 每页显示的博客数量

  // 使用 useRef 跟踪页面是否已经挂载，防止重复加载
  const isMounted = useRef(false);

  // 获取封面图的公共URL
  const getCoverImage = async (cover_image: string) => {
    const url = await getPublicUrl(BUCKET_NAME, cover_image);
    return url || "";
  };

  // 加载初始数据
  useEffect(() => {
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
      }, 0);
    } else {
      // 首次挂载，直接加载
      loadBlogs(true);
      isMounted.current = true;
    }

    // 组件卸载时的清理函数
    return () => {
      // 不重置isMounted，这样我们可以知道组件已经挂载过
    };
  }, []);

  // 分离置顶和普通博客
  useEffect(() => {
    if (blogsWithUrls.length > 0) {
      const topped = blogsWithUrls.filter((blog) => blog.is_top);
      const regular = blogsWithUrls.filter((blog) => !blog.is_top);

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
        // 合并新旧博客数据
        setBlogs((prevBlogs) => [...prevBlogs, ...newBlogs]);
        setBlogsWithUrls((prevBlogs) => [...prevBlogs, ...blogsWithCoverUrls]);
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

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 置顶博客展示区 */}
      {toppedBlogs.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="title-gradient">置顶推荐</h2>
          </div>

          <div className="relative w-full h-[396px]">
            <OverlappingCards
              items={[
                ...toppedBlogs,
                ...toppedBlogs,
                ...toppedBlogs,
                ...toppedBlogs,
                ...toppedBlogs,
                ...toppedBlogs,
                ...toppedBlogs,
                ...toppedBlogs,
                ...toppedBlogs,
              ]}
              cardWidth={280}
              cardSpacing={150}
              className="h-full w-full"
              renderItem={(blog) => (
                <BlogCard
                  blog={blog}
                  className={cn("border-none")}
                  hasGradient={true}
                />
              )}
            />
          </div>
        </div>
      )}

      {blogsWithUrls.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">暂无博客文章</p>
        </div>
      ) : (
        <>
          {/* 最新文章标题 */}
          <div className="mb-6">
            <h2 className="title-gradient">最新文章</h2>
          </div>

          {/* 常规博客列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              ...regularBlogs,
              ...regularBlogs,
              ...regularBlogs,
              ...regularBlogs,
              ...regularBlogs,
            ].map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

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
