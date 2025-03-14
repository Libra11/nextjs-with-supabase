/**
 * Author: Libra
 * Date: 2025-03-07 20:29:54
 * LastEditors: Libra
 * Description: 博客列表页面
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
import { TagIcon, X } from "lucide-react";

export default function BlogsPage() {
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

  // 标签筛选相关状态
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [showTags, setShowTags] = useState(false);

  const PAGE_SIZE = 6; // 每页显示的博客数量

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
      setHasMore(true);
      setInitialLoadComplete(false);

      // 延迟加载，确保状态已经重置
      setTimeout(() => {
        loadBlogs(true);
      }, 0);
    } else {
      // 首次挂载，直接加载
      loadBlogs(true);
      // 加载所有标签
      loadAllTags();
      isMounted.current = true;
    }

    // 组件卸载时的清理函数
    return () => {
      // 不重置isMounted，这样我们可以知道组件已经挂载过
    };
  }, [selectedTagId]); // 当选中的标签ID变化时重新加载

  // 加载所有标签
  const loadAllTags = async () => {
    try {
      const tags = await getTags();
      setAllTags(tags);
    } catch (error) {
      console.error("加载标签失败", error);
    }
  };

  // 选择标签处理
  const handleTagSelect = (tagId: number) => {
    // 如果点击的是当前已选标签，则取消选择
    if (selectedTagId === tagId) {
      setSelectedTagId(null);
    } else {
      setSelectedTagId(tagId);
    }
    // 重置页面状态
    setPage(1);
  };

  // 清除标签筛选
  const clearTagFilter = () => {
    setSelectedTagId(null);
  };

  // 加载博客数据并处理封面图片
  const loadBlogs = async (isInitialLoad = false) => {
    if (loading) return;

    try {
      setLoading(true);
      // 构建筛选条件
      const filters: { tagId?: number; status?: string } = {};

      // 如果选择了标签，添加标签筛选
      if (selectedTagId) {
        filters.tagId = selectedTagId;
      }

      const { blogs: newBlogs, count } = await getBlogs(
        page,
        PAGE_SIZE,
        filters
      );
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

  return (
    <div className="container mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">我的博客</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          分享我的技术经验、思考和最新见解
        </p>
      </div>

      {/* 标签筛选器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">按标签筛选</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-1"
          >
            <TagIcon className="w-4 h-4" />
            {showTags ? "隐藏标签" : "显示标签"}
          </Button>
        </div>

        {showTags && (
          <div className="flex flex-wrap gap-2 animate-in fade-in-50 duration-300">
            {allTags.map((tag) => (
              <div
                key={tag.id}
                onClick={() => handleTagSelect(tag.id)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <TagBadge
                  name={tag.name}
                  icon_name={tag.icon_name || ""}
                  color={
                    selectedTagId === tag.id
                      ? tag.color || "#6c757d"
                      : `${tag.color || "#6c757d"}80`
                  } // 未选中的标签颜色更淡
                />
              </div>
            ))}
          </div>
        )}

        {/* 当前筛选状态 */}
        {selectedTagId && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">当前筛选:</span>
            {allTags
              .filter((t) => t.id === selectedTagId)
              .map((tag) => (
                <div key={tag.id} className="flex items-center gap-1">
                  <TagBadge
                    name={tag.name}
                    icon_name={tag.icon_name || ""}
                    color={tag.color || "#6c757d"}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={clearTagFilter}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>

      {blogsWithUrls.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            {selectedTagId ? "该标签下暂无博客文章" : "暂无博客文章"}
          </p>
          {selectedTagId && (
            <Button variant="outline" className="mt-4" onClick={clearTagFilter}>
              清除筛选
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogsWithUrls.map((blog) => (
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
