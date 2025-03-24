/**
 * Author: Libra
 * Date: 2025-03-19 13:36:51
 * LastEditors: Libra
 * Description: 标签页面
 */
"use client";

import { getBlogs, getTags } from "@/lib/blog";
import { getPublicUrl } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { BlogWithTags, Tag } from "@/types/blog";
import { BlogCard } from "@/components/ui/blog-card";
import { useState, useEffect, useRef } from "react";
import { TagBadge } from "@/components/ui/tag-badge";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { MagicCard } from "@/components/magicui/magic-card";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { BlogSkeleton } from "@/components/ui/blog-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// 添加标签浮动动画的样式
const floatingStyles = `
  @keyframes float {
    0% {
      transform: translateY(0px) scale(1);
    }
    50% {
      transform: translateY(-15px) scale(1.05);
    }
    100% {
      transform: translateY(0px) scale(1);
    }
  }
`;

export default function TagsPage() {
  // 定义状态
  const [page, setPage] = useState(1);
  const [blogs, setBlogs] = useState<BlogWithTags[]>([]);
  const [blogsWithUrls, setBlogsWithUrls] = useState<
    (BlogWithTags & { coverImageUrl: string })[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // 标签筛选相关状态 - 改为支持多选
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const { theme, resolvedTheme } = useTheme();

  // 客户端渲染标志
  const [mounted, setMounted] = useState(false);

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
      setHasMore(true);
      setInitialLoadComplete(false);

      // 延迟加载，确保状态已经重置
      setTimeout(() => {
        loadBlogs(true);
      }, 0);
    } else {
      // 首次挂载，直接加载标签
      loadAllTags();
      isMounted.current = true;
    }

    // 组件卸载时的清理函数
    return () => {
      // 不重置isMounted，这样我们可以知道组件已经挂载过
    };
  }, [selectedTagIds, mounted]); // 当选中的标签IDs变化时重新加载

  // 加载所有标签
  const loadAllTags = async () => {
    try {
      setLoading(true);
      const tags = await getTags();
      setAllTags(tags);
      setLoading(false);
    } catch (error) {
      console.error("加载标签失败", error);
      setLoading(false);
    }
  };

  // 选择标签处理 - 支持多选
  const handleTagSelect = (tagId: number) => {
    setSelectedTagIds((prev) => {
      // 如果已选中，则移除；否则添加
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // 清除标签筛选
  const clearTagFilter = () => {
    setSelectedTagIds([]);
    setBlogs([]);
    setBlogsWithUrls([]);
  };

  // 获取已选标签名称的列表
  const getSelectedTagNames = () => {
    return allTags
      .filter((tag) => selectedTagIds.includes(tag.id))
      .map((tag) => tag.name);
  };

  // 加载博客数据并处理封面图片
  const loadBlogs = async (isInitialLoad = false) => {
    if (loading || selectedTagIds.length === 0) return;

    try {
      setLoading(true);
      // 构建筛选条件
      const filters: { tagId?: number; tagIds?: number[]; status?: string } = {
        status: "published", // 只显示已发布的博客
      };

      // 添加标签筛选
      if (selectedTagIds.length === 1) {
        // 单选模式 - 使用 tagId
        filters.tagId = selectedTagIds[0];
      } else {
        // 多选模式 - 使用 tagIds (如果后端支持)
        filters.tagIds = selectedTagIds;
      }

      console.log("筛选条件:", filters);

      const { blogs: newBlogs, count } = await getBlogs(
        page,
        PAGE_SIZE,
        filters
      );

      console.log(`获取到 ${newBlogs.length} 篇博客，总数: ${count}`);

      setTotalCount(count);

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

  // 如果组件还未挂载，返回一个基础的加载占位符
  if (!mounted) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <MagicCard
          gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
          gradientOpacity={0.5}
          gradientSize={400}
          gradientFrom="#9E7AFF"
          gradientTo="#FE8BBB"
          className="rounded-xl w-full overflow-hidden mb-8"
        >
          <div className="p-5">
            {/* 标签网格骨架 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {Array.from({ length: 16 }, (_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          </div>
        </MagicCard>
        <BlogSkeleton />
      </div>
    );
  }

  // 确定使用的主题颜色
  const currentTheme = resolvedTheme || theme;

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 添加动画样式 */}
      <style jsx global>
        {floatingStyles}
      </style>

      <div className="mb-8">
        <h2 className="title-gradient">标签筛选</h2>
      </div>

      {/* 简化的标签选择部分 */}
      <div className="mb-8">
        <MagicCard
          gradientColor={currentTheme === "dark" ? "#262626" : "#D9D9D955"}
          gradientOpacity={0.5}
          gradientSize={400}
          gradientFrom="#9E7AFF"
          gradientTo="#FE8BBB"
          className="rounded-xl w-full overflow-hidden"
        >
          <div className="p-5">
            {/* 标签网格 - 直接显示所有标签 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {allTags.map((tag) => (
                <div
                  key={tag.id}
                  onClick={() => handleTagSelect(tag.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-accent/50",
                    selectedTagIds.includes(tag.id)
                      ? "bg-primary/10 border-primary/30 shadow-sm"
                      : "bg-card hover:bg-accent/10"
                  )}
                >
                  <TagBadge
                    icon_name={tag.icon_name || ""}
                    color={tag.color || "#6c757d"}
                    iconOnly
                    className="w-5 h-5 border-0 bg-transparent"
                  />
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap overflow-hidden text-ellipsis",
                      selectedTagIds.includes(tag.id) &&
                        "text-primary font-medium"
                    )}
                  >
                    {tag.name}
                  </span>
                </div>
              ))}
            </div>

            {/* 已选标签显示区域 */}
            {selectedTagIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  已选标签：
                </span>

                {allTags
                  .filter((tag) => selectedTagIds.includes(tag.id))
                  .map((tag) => (
                    <div
                      key={tag.id}
                      className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1.5"
                    >
                      <TagBadge
                        icon_name={tag.icon_name || ""}
                        color={tag.color || "#6c757d"}
                        iconOnly
                        className="w-4 h-4 border-0 bg-transparent"
                      />
                      {tag.name}
                      <X
                        className="w-3.5 h-3.5 ml-1 cursor-pointer hover:text-primary/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTagSelect(tag.id);
                        }}
                      />
                    </div>
                  ))}

                {selectedTagIds.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTagFilter}
                    className="text-xs ml-2"
                  >
                    清除全部
                  </Button>
                )}
              </div>
            )}
          </div>
        </MagicCard>
      </div>

      {/* 博客结果显示部分 */}
      {selectedTagIds.length > 0 ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">
                {selectedTagIds.length === 1
                  ? `「${getSelectedTagNames()[0]}」标签下的博客`
                  : `已选 ${selectedTagIds.length} 个标签下的博客`}
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={clearTagFilter}
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              清除筛选
            </Button>
          </div>

          {blogsWithUrls.length === 0 && !loading ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-xl text-muted-foreground mb-4">
                所选标签下暂无博客文章
              </p>
              <Button variant="outline" onClick={clearTagFilter}>
                返回标签列表
              </Button>
            </div>
          ) : (
            <>
              {loading && blogsWithUrls.length === 0 ? (
                <BlogSkeleton />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {blogsWithUrls.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
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
                  endMessage={`已加载全部${
                    selectedTagIds.length === 1
                      ? ` ${getSelectedTagNames()[0]} 标签`
                      : "所选标签"
                  }下的博客`}
                  loaderClassName="flex justify-center items-center py-10 text-muted-foreground"
                  endMessageClassName="text-center py-10 text-muted-foreground text-sm"
                />
              )}
            </>
          )}
        </div>
      ) : (
        <MagicCard
          className="rounded-xl overflow-hidden w-full h-[300px] flex items-center justify-center"
          gradientColor={currentTheme === "dark" ? "#262626" : "#F8F8F855"}
          gradientSize={800}
          gradientOpacity={0.8}
          gradientFrom={currentTheme === "dark" ? "#7168D8" : "#9E7AFF"}
          gradientTo={currentTheme === "dark" ? "#FC65B3" : "#FE8BBB"}
        >
          <div className="text-center max-w-[600px] px-6 py-10 relative">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Search className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              发现精彩博客内容
            </h2>
            <p className="text-muted-foreground mb-6">
              从上方选择一个或多个感兴趣的标签，开始探索相关博客文章
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {allTags.slice(0, 5).map((tag) => (
                <div
                  key={tag.id}
                  onClick={() => handleTagSelect(tag.id)}
                  className="bg-primary/10 hover:bg-primary/20 transition-all duration-200 cursor-pointer text-primary rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
                >
                  <TagBadge
                    icon_name={tag.icon_name || ""}
                    color={tag.color || "#6c757d"}
                    iconOnly
                    className="w-4 h-4 border-0 bg-transparent"
                  />
                  {tag.name}
                </div>
              ))}
              <div className="bg-muted hover:bg-muted/80 transition-all duration-200 cursor-pointer text-muted-foreground rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-1.5">
                <span>更多...</span>
              </div>
            </div>
          </div>
        </MagicCard>
      )}
    </div>
  );
}
