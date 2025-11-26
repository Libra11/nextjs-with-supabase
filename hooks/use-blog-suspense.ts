/*
 * @Author: Libra
 * @Date: 2025-01-08
 * @LastEditors: Libra
 * @Description: Suspense-compatible blog data fetching hooks
 */
import { getBlogs, getBlogStats } from '@/lib/blog';
import { getBatchPublicUrls } from '@/lib/bucket';
import { BUCKET_NAME } from '@/const';
import { BlogWithTags, BlogStats } from '@/types/blog';
import { useSuspenseData } from './use-suspense-data';

// Hook for fetching blog stats with Suspense
export function useBlogStats(): BlogStats {
  return useSuspenseData(['blog-stats'], async () => {
    return await getBlogStats();
  });
}

// Hook for fetching topped blogs with Suspense
export function useToppedBlogs(): (BlogWithTags & { coverImageUrl: string })[] {
  return useSuspenseData(['topped-blogs'], async () => {
    const { blogs: topped } = await getBlogs(1, 99, {
      status: 'published',
      is_top: true,
    });

    if (!topped) return [];

    // 批量获取封面图URLs
    const coverImages = topped.map(blog => blog.cover_image).filter((img): img is string => Boolean(img));
    const urlMap = coverImages.length > 0 ? getBatchPublicUrls(BUCKET_NAME, coverImages) : {};

    return topped.map(blog => ({
      ...blog,
      coverImageUrl: blog.cover_image ? urlMap[blog.cover_image] || '' : '',
    }));
  });
}

// Hook for fetching regular blogs with Suspense (initial load)
export function useRegularBlogs(
  page = 1,
  pageSize = 8
): { blogs: (BlogWithTags & { coverImageUrl: string })[]; count: number } {
  return useSuspenseData(['regular-blogs', page, pageSize], async () => {
    const { blogs: newBlogs, count } = await getBlogs(page, pageSize, {
      status: 'published',
      is_top: false,
    });

    if (!newBlogs) return { blogs: [], count: 0 };

    // 批量获取封面图URLs
    const coverImages = newBlogs.map(blog => blog.cover_image).filter((img): img is string => Boolean(img));
    const urlMap = coverImages.length > 0 ? getBatchPublicUrls(BUCKET_NAME, coverImages) : {};

    const blogsWithCoverUrls = newBlogs.map(blog => ({
      ...blog,
      coverImageUrl: blog.cover_image ? urlMap[blog.cover_image] || '' : '',
    }));

    return { blogs: blogsWithCoverUrls, count };
  });
}