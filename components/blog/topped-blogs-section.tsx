/*
 * @Author: Libra
 * @Date: 2025-01-08
 * @LastEditors: Libra
 * @Description: Topped blogs section with Suspense
 */
import { useToppedBlogs } from '@/hooks/use-blog-suspense';
import { BlogCard } from '@/components/ui/blog-card';
import { OverlappingCards } from '@/components/ui/overlapping-cards';
import { cn } from '@/lib/utils';

export function ToppedBlogsSection() {
  const toppedBlogs = useToppedBlogs();

  if (toppedBlogs.length === 0) {
    return null;
  }

  return (
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
              className={cn('border-none')}
              bgClassName="bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200/60 dark:from-[#222222] dark:via-[#141414] dark:to-[#0d0d0d] dark:border-transparent"
            />
          )}
        />
      </div>
    </div>
  );
}
