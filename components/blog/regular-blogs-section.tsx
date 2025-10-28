/**
 * Author: Libra
 * Date: 2025-07-08 16:06:16
 * LastEditors: Libra
 * Description:
 */
/*
 * @Author: Libra
 * @Date: 2025-01-08
 * @LastEditors: Libra
 * @Description: Regular blogs section with Suspense
 */
import { useRegularBlogs } from "@/hooks/use-blog-suspense";
import { BlogCard } from "@/components/ui/blog-card";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getBlogs } from "@/lib/blog";
import { getBatchPublicUrls } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";
import { BlogWithTags } from "@/types/blog";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";

export function RegularBlogsSection() {
  const PAGE_SIZE = 8;
  const initialData = useRegularBlogs(1, PAGE_SIZE);

  const [allBlogs, setAllBlogs] = useState<
    (BlogWithTags & { coverImageUrl: string })[]
  >(initialData.blogs);
  const [hasMore, setHasMore] = useState(
    initialData.count > initialData.blogs.length
  );
  const loadingRef = useRef(false); // 使用 ref 来管理 loading 状态
  const currentPageRef = useRef(2); // Start from page 2 since page 1 is loaded by Suspense

  // Update allBlogs when initialData changes
  useEffect(() => {
    setAllBlogs(initialData.blogs);
  }, [initialData.blogs]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    try {
      loadingRef.current = true;
      const { blogs: newBlogs, count } = await getBlogs(
        currentPageRef.current,
        PAGE_SIZE,
        { status: "published", is_top: false }
      );

      if (!newBlogs || newBlogs.length === 0) {
        setHasMore(false);
        return;
      }

      // 批量获取封面图URLs
      const coverImages = newBlogs
        .map((blog) => blog.cover_image)
        .filter((img): img is string => Boolean(img));
      const urlMap =
        coverImages.length > 0
          ? getBatchPublicUrls(BUCKET_NAME, coverImages)
          : {};

      const blogsWithCoverUrls = newBlogs.map((blog) => ({
        ...blog,
        coverImageUrl: blog.cover_image ? urlMap[blog.cover_image] || "" : "",
      }));

      setAllBlogs((prevBlogs) => {
        // Get existing blog IDs to avoid duplicates
        const existingIds = new Set(prevBlogs.map((b) => b.id));

        // Filter out any blogs that already exist
        const newUniqueBlogs = blogsWithCoverUrls.filter(
          (blog) => !existingIds.has(blog.id)
        );

        const updatedBlogs = [...prevBlogs, ...newUniqueBlogs];

        // Update hasMore based on the actual total blogs loaded
        setHasMore(updatedBlogs.length < count);

        return updatedBlogs;
      });
      currentPageRef.current += 1;
    } catch (error) {
      console.error("加载更多博客失败", error);
    } finally {
      loadingRef.current = false;
    }
  }, [hasMore]);

  if (allBlogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">暂无博客文章</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {useMemo(() => {
          // Ensure unique blogs before rendering
          const uniqueBlogs = allBlogs.filter(
            (blog, index, self) =>
              index === self.findIndex((b) => b.id === blog.id)
          );

          return uniqueBlogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              bgClassName="overflow-hidden border border-slate-200/80 dark:border-slate-800/70 bg-white/90 dark:bg-[#101223]/85 shadow-[0_24px_50px_-32px_rgba(15,23,42,0.28)] dark:shadow-[inset_0_0_25px_12px_rgba(12,12,18,0.65)]"
            />
          ));
        }, [allBlogs])}
      </div>

      <InfiniteScroll
        hasMore={hasMore}
        loadMore={loadMore}
        loadingText="加载更多博客..."
        endMessage="已经到底了，没有更多博客了"
        loaderClassName="flex justify-center items-center py-10 text-muted-foreground"
        endMessageClassName="text-center py-10 text-muted-foreground text-sm"
      />
    </>
  );
}
