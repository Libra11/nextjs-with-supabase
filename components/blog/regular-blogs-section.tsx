/*
 * @Author: Libra
 * @Date: 2025-01-08
 * @LastEditors: Libra
 * @Description: Regular blogs section with Suspense
 */
import { useRegularBlogs } from '@/hooks/use-blog-suspense';
import { BlogCard } from '@/components/ui/blog-card';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { getBlogs } from '@/lib/blog';
import { getBatchPublicUrls } from '@/lib/bucket';
import { BUCKET_NAME } from '@/const';
import { BlogWithTags } from '@/types/blog';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';

export function RegularBlogsSection() {
  const PAGE_SIZE = 8;
  const initialData = useRegularBlogs(1, PAGE_SIZE);
  
  const [allBlogs, setAllBlogs] = useState<(BlogWithTags & { coverImageUrl: string })[]>(initialData.blogs);
  const [hasMore, setHasMore] = useState(initialData.count > initialData.blogs.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const currentPageRef = useRef(2); // Start from page 2 since page 1 is loaded by Suspense

  // Update allBlogs when initialData changes
  useEffect(() => {
    setAllBlogs(initialData.blogs);
  }, [initialData.blogs]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      const { blogs: newBlogs, count } = await getBlogs(
        currentPageRef.current,
        PAGE_SIZE,
        { status: 'published', is_top: false }
      );

      if (!newBlogs || newBlogs.length === 0) {
        setHasMore(false);
        return;
      }

      // 批量获取封面图URLs
      const coverImages = newBlogs.map(blog => blog.cover_image).filter((img): img is string => Boolean(img));
      const urlMap = coverImages.length > 0 ? getBatchPublicUrls(BUCKET_NAME, coverImages) : {};
      
      const blogsWithCoverUrls = newBlogs.map(blog => ({
        ...blog,
        coverImageUrl: blog.cover_image ? urlMap[blog.cover_image] || '' : '',
      }));

      setAllBlogs(prevBlogs => {
        // Get existing blog IDs to avoid duplicates
        const existingIds = new Set(prevBlogs.map(b => b.id));
        
        // Filter out any blogs that already exist
        const newUniqueBlogs = blogsWithCoverUrls.filter(blog => !existingIds.has(blog.id));
        
        return [...prevBlogs, ...newUniqueBlogs];
      });
      
      setHasMore(currentPageRef.current * PAGE_SIZE < count);
      currentPageRef.current += 1;
    } catch (error) {
      console.error('加载更多博客失败', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

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
            (blog, index, self) => index === self.findIndex(b => b.id === blog.id)
          );
          
          return uniqueBlogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              bgClassName="shadow-[inset_0px_0px_25px_12px_#222222] overflow-hidden"
            />
          ));
        }, [allBlogs])}
      </div>
      
      <InfiniteScroll
        hasMore={hasMore}
        loadMore={loadMore}
        isLoading={isLoadingMore}
        loadingText="加载更多博客..."
        endMessage="已经到底了，没有更多博客了"
        loaderClassName="flex justify-center items-center py-10 text-muted-foreground"
        endMessageClassName="text-center py-10 text-muted-foreground text-sm"
      />
    </>
  );
}