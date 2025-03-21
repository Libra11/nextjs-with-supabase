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
import { TagIcon, X, Search } from "lucide-react";

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

  // 标签筛选相关状态
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [selectedTagName, setSelectedTagName] = useState<string>("");

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
  }, [selectedTagId]); // 当选中的标签ID变化时重新加载

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

  // 选择标签处理
  const handleTagSelect = (tagId: number, tagName: string) => {
    setSelectedTagId(tagId);
    setSelectedTagName(tagName);
    // 开始加载博客
    setTimeout(() => {
      loadBlogs(true);
    }, 0);
  };

  // 清除标签筛选
  const clearTagFilter = () => {
    setSelectedTagId(null);
    setSelectedTagName("");
    setBlogs([]);
    setBlogsWithUrls([]);
  };

  // 加载博客数据并处理封面图片
  const loadBlogs = async (isInitialLoad = false) => {
    if (loading || !selectedTagId) return;

    try {
      setLoading(true);
      // 构建筛选条件
      const filters: { tagId?: number; status?: string } = {
        status: "published", // 只显示已发布的博客
      };

      // 添加标签筛选
      filters.tagId = selectedTagId;

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
    <div className="mx-auto max-w-[1200px]">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">博客标签</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          按照主题和兴趣浏览博客文章
        </p>
      </div>

      {/* 标签选择部分 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
        {allTags.map((tag) => (
          <div
            key={tag.id}
            onClick={() => handleTagSelect(tag.id, tag.name)}
            className={`
              cursor-pointer transition-all duration-300 p-4 rounded-lg border
              hover:scale-105 hover:shadow-md text-center
              ${
                selectedTagId === tag.id
                  ? "bg-primary/10 border-primary/30 shadow-md"
                  : "bg-card hover:bg-accent/10"
              }
            `}
          >
            <TagBadge
              name={tag.name}
              icon_name={tag.icon_name || ""}
              color={tag.color || "#6c757d"}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              点击查看相关博客
            </div>
          </div>
        ))}
      </div>

      {/* 博客结果显示部分 */}
      {selectedTagId ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">
                「{selectedTagName}」标签下的博客
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
                该标签下暂无博客文章
              </p>
              <Button variant="outline" onClick={clearTagFilter}>
                返回标签列表
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  endMessage={`已加载全部 ${selectedTagName} 标签的博客`}
                  loaderClassName="flex justify-center items-center py-10 text-muted-foreground"
                  endMessageClassName="text-center py-10 text-muted-foreground text-sm"
                />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-xl text-muted-foreground">
            请选择一个标签以查看相关博客
          </p>
        </div>
      )}
    </div>
  );
}
