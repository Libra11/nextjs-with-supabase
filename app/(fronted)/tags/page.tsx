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
import { X, Search, TagIcon, Filter, RefreshCw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { BlogSkeleton } from "@/components/ui/blog-skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Meteors } from "@/components/ui/meteors";

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

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  @keyframes glowPulse {
    0%, 100% {
      box-shadow: 0 0 5px 2px rgba(147, 51, 234, 0.1);
    }
    50% {
      box-shadow: 0 0 15px 5px rgba(147, 51, 234, 0.25);
    }
  }

  .tag-selector:hover {
    animation: glowPulse 2s infinite;
  }

  .tag-floating {
    animation: float 6s ease-in-out infinite;
  }

  .tag-pulse {
    animation: pulse 3s ease-in-out infinite;
  }

  .tag-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    max-height: 320px;
    overflow-y: auto;
    padding-right: 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
  }

  .tag-grid::-webkit-scrollbar {
    width: 6px;
  }

  .tag-grid::-webkit-scrollbar-track {
    background: transparent;
  }

  .tag-grid::-webkit-scrollbar-thumb {
    background-color: rgba(155, 155, 155, 0.5);
    border-radius: 20px;
    border: transparent;
  }
`;

export default function TagsPage() {
  // 定义状态
  const [blogsWithUrls, setBlogsWithUrls] = useState<
    (BlogWithTags & { coverImageUrl: string })[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const loadingRef = useRef(false); // 添加 loading 引用，用于防止重复加载

  // 标签筛选相关状态 - 改为支持多选
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const { theme, resolvedTheme } = useTheme();
  const [isTagGridExpanded, setIsTagGridExpanded] = useState(false);

  // 客户端渲染标志
  const [mounted, setMounted] = useState(false);

  const PAGE_SIZE = 8; // 每页显示的博客数量

  // 使用 useRef 跟踪页面是否已经挂载，防止重复加载
  const isMounted = useRef(false);
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

  // 加载初始数据
  useEffect(() => {
    // 确保组件已挂载
    if (!mounted) return;

    // 如果页面已经挂载过一次，重置状态
    if (isMounted.current) {
      // 重置页面到初始状态，而不是直接加载，避免重复
      currentPageRef.current = 1;
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
      loadingRef.current = true;
      const tags = await getTags();
      setAllTags(tags);
      loadingRef.current = false;
    } catch (error) {
      console.error("加载标签失败", error);
      loadingRef.current = false;
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
    if (selectedTagIds.length === 0 || loadingRef.current) return;

    try {
      loadingRef.current = true;

      // 构建筛选条件
      const filters = {
        status: "published",
        tagIds: selectedTagIds,
      };

      const { blogs: newBlogs, count } = await getBlogs(
        currentPageRef.current,
        PAGE_SIZE,
        filters
      );

      // 更新总数计数
      setTotalCount(count);

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

  const loadMore = async () => {
    if (!initialLoadComplete || loadingRef.current) return;
    await loadBlogs();
  };

  // 如果组件还未挂载，返回一个基础的加载占位符
  if (!mounted) {
    return (
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="h-52 w-full rounded-2xl bg-muted/30 animate-pulse mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent animate-[shimmer_1.5s_infinite]"></div>
        </div>
        <BlogSkeleton />
      </div>
    );
  }

  // 确定使用的主题颜色
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  return (
    <div className="mx-auto max-w-[1200px] px-4">
      {/* 添加动画样式 */}
      <style jsx global>
        {floatingStyles}
      </style>

      {/* 顶部标题区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 mt-0 md:mt-4"
      >
        <div className="relative inline-block">
          <h2 className="title-gradient">标签筛选</h2>
        </div>
        <p className="text-muted-foreground mt-4">
          探索通过不同标签分类的博客文章，找到你感兴趣的专题内容。点击下方标签开始你的阅读之旅。
        </p>
      </motion.div>

      {/* 标签选择区域 - 全新设计 */}
      <AnimatePresence mode="wait">
        <motion.div
          key="tag-selector"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative">
            <div
              className={cn(
                "rounded-2xl overflow-hidden shadow-lg transition-all duration-500",
                "border border-primary/10 bg-background/80 backdrop-blur-md",
                isDark ? "bg-zinc-900/40" : "bg-white/90"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-purple-400/5"></div>

              {/* 标签头部 */}
              <div className="pt-6 px-6 pb-4 relative z-10 border-b border-primary/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <TagIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">标签</h3>
                      <p className="text-sm text-muted-foreground">
                        选择一个或多个感兴趣的标签
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedTagIds.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1.5 px-3 py-1 h-9 rounded-full border-primary/20 hover:bg-primary/10 transition-all duration-300"
                        onClick={clearTagFilter}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>重置选择</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 h-9 rounded-full border-primary/20 hover:bg-primary/10 transition-all duration-300",
                        isTagGridExpanded && "bg-purple-600/10"
                      )}
                      onClick={() => setIsTagGridExpanded(!isTagGridExpanded)}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>
                        {isTagGridExpanded ? "收起标签" : "展开所有标签"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* 已选标签显示 */}
                {selectedTagIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 flex flex-wrap items-center gap-2"
                  >
                    <span className="text-sm text-muted-foreground px-2">
                      已选:
                    </span>
                    {allTags
                      .filter((tag) => selectedTagIds.includes(tag.id))
                      .map((tag) => (
                        <motion.div
                          key={tag.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-primary rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1.5 border border-purple-600/20 shadow-sm"
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
                        </motion.div>
                      ))}
                  </motion.div>
                )}
              </div>

              {/* 标签网格 */}
              <div className="p-6 relative z-10">
                <AnimatePresence>
                  <motion.div
                    className={cn(
                      "grid gap-3",
                      isTagGridExpanded
                        ? "tag-grid"
                        : "grid-cols-3 md:grid-cols-5 lg:grid-cols-8"
                    )}
                    style={{
                      maxHeight: isTagGridExpanded ? "320px" : "auto",
                    }}
                  >
                    {allTags.map((tag, idx) => (
                      <motion.div
                        key={tag.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03, duration: 0.3 }}
                        onClick={() => handleTagSelect(tag.id)}
                        className={cn(
                          "relative group",
                          "flex items-center gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                          "hover:shadow-md hover:scale-105",
                          selectedTagIds.includes(tag.id)
                            ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-purple-600/30 shadow-sm shadow-purple-600/5"
                            : "bg-card hover:bg-accent/10 border border-transparent hover:border-purple-600/20"
                        )}
                      >
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-md transition-opacity duration-300"></div>

                        <div className="relative z-10 flex items-center gap-2 truncate">
                          <TagBadge
                            icon_name={tag.icon_name || ""}
                            color={tag.color || "#6c757d"}
                            iconOnly
                            className={cn(
                              "w-5 h-5 border-0 bg-transparent transition-transform duration-300",
                              selectedTagIds.includes(tag.id) && "scale-110"
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 flex-1",
                              selectedTagIds.includes(tag.id) &&
                                "text-primary font-medium"
                            )}
                          >
                            {tag.name}
                          </span>
                        </div>

                        {/* Selected indicator */}
                        {selectedTagIds.includes(tag.id) && (
                          <motion.div
                            className="absolute inset-0 rounded-xl ring-2 ring-purple-600/30 ring-offset-1 ring-offset-background/10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          ></motion.div>
                        )}
                      </motion.div>
                    ))}

                    {!isTagGridExpanded && allTags.length > 16 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        onClick={() => setIsTagGridExpanded(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 bg-muted/50 hover:bg-muted/80 text-muted-foreground border border-dashed border-muted-foreground/30"
                      >
                        <span>查看更多...</span>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* 装饰性元素 */}
            <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-xl"></div>
            <div className="absolute -top-3 -left-3 w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 blur-xl"></div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 博客结果显示部分 */}
      <AnimatePresence mode="wait">
        {selectedTagIds.length > 0 ? (
          <motion.div
            key="blog-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <motion.div
                className="flex items-center gap-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/80 to-purple-600/80 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    {selectedTagIds.length === 1
                      ? `「${getSelectedTagNames()[0]}」`
                      : `已选 ${selectedTagIds.length} 个标签下的博客`}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {initialLoadComplete && `找到 ${totalCount} 篇相关文章`}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  onClick={clearTagFilter}
                  className="flex items-center gap-1.5 rounded-full px-4 border-purple-600/20 hover:bg-purple-600/10 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  <span>清除筛选</span>
                </Button>
              </motion.div>
            </div>

            {blogsWithUrls.length === 0 && !loadingRef.current ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center py-16 rounded-2xl bg-muted/10 border border-muted/20 backdrop-blur-sm"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-600/10 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-xl text-muted-foreground mb-4">
                    所选标签下暂无博客文章
                  </p>
                  <Button
                    variant="outline"
                    onClick={clearTagFilter}
                    className="bg-purple-600/10 hover:bg-purple-600/20 border-purple-600/30 text-purple-600"
                  >
                    返回标签列表
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                {loadingRef.current && blogsWithUrls.length === 0 ? (
                  <BlogSkeleton />
                ) : (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                  >
                    {blogsWithUrls.map((blog) => (
                      <motion.div
                        key={blog.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }}
                      >
                        <BlogCard key={blog.id} blog={blog} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* 无限滚动加载组件 */}
                {initialLoadComplete && (
                  <InfiniteScroll
                    hasMore={hasMore}
                    loadMore={loadMore}
                    isLoading={loadingRef.current}
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
          </motion.div>
        ) : (
          <motion.div
            key="tag-welcome"
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative overflow-hidden rounded-2xl w-full bg-gradient-to-br from-blue-600/5 to-purple-600/5 border border-purple-600/10 backdrop-blur-sm">
              <Meteors number={20} />

              <div className="relative z-10 px-8 py-16 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-0.5"
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <Search className="w-10 h-10 text-purple-600" />
                  </div>
                </motion.div>

                <motion.h2
                  className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  发现精彩博客内容
                </motion.h2>

                <motion.p
                  className="text-muted-foreground mb-8 max-w-lg text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  从上方选择一个或多个感兴趣的标签，开始探索相关博客文章
                </motion.p>

                <motion.div
                  className="flex flex-wrap justify-center gap-3 max-w-2xl"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {/* 推荐标签显示 - 漂浮效果 */}
                  {allTags.slice(0, 8).map((tag, index) => (
                    <motion.div
                      key={tag.id}
                      custom={index}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: 0.5 + index * 0.1,
                        duration: 0.5,
                      }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className={cn(
                        "tag-floating",
                        "bg-gradient-to-r cursor-pointer",
                        "from-blue-600/10 to-purple-600/10 shadow-lg",
                        "hover:from-blue-600/20 hover:to-purple-600/20",
                        "text-purple-600 rounded-full px-4 py-2 text-sm font-medium",
                        "flex items-center gap-2 border border-purple-600/20",
                        "transition-all duration-300 hover:shadow-purple-600/20"
                      )}
                      onClick={() => handleTagSelect(tag.id)}
                      style={{
                        animationDelay: `${index * 0.2}s`,
                      }}
                    >
                      <TagBadge
                        icon_name={tag.icon_name || ""}
                        color={tag.color || "#6c757d"}
                        iconOnly
                        className="w-5 h-5 border-0 bg-transparent"
                      />
                      {tag.name}
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.3, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    className="bg-muted/50 hover:bg-muted/80 transition-all duration-200 cursor-pointer text-muted-foreground rounded-full px-4 py-2 text-sm flex items-center gap-1.5 border border-muted/30"
                    onClick={() => setIsTagGridExpanded(true)}
                  >
                    <span>查看更多...</span>
                  </motion.div>
                </motion.div>
              </div>

              {/* 背景装饰 */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-0"></div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-0"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
