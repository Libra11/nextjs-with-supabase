/**
 * Author: Libra
 * Date: 2025-03-24 13:56:08
 * LastEditors: Libra
 * Description:
 */
"use client";

import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tag,
  Search,
  Calendar,
  Clock,
  ArrowUpRight,
  Command,
  X,
  Sparkles,
  Bookmark,
  Info,
  Pin,
} from "lucide-react";
import { BlogWithTags } from "@/types/blog";
import { searchBlogs } from "@/lib/blog";
import { getPublicUrl } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { TagBadge } from "@/components/ui/tag-badge";
import { useTheme } from "next-themes";
import { MagicCard } from "@/components/magicui/magic-card";
import Image from "next/image";

// 扩展BlogWithTags类型，添加封面图URL
interface BlogWithCoverUrl extends BlogWithTags {
  coverImageUrl?: string;
}

// 全局状态管理 - 用于在组件外部控制搜索弹窗的显示/隐藏
let setGlobalOpen: React.Dispatch<React.SetStateAction<boolean>> | null = null;

export function openCommandSearch() {
  if (setGlobalOpen) {
    setGlobalOpen(true);
  }
}

function BlogSearchResult({
  blog,
  onClick,
}: {
  blog: BlogWithCoverUrl;
  onClick: () => void;
}) {
  // 确保主标签存在
  const mainTag = blog.tags && blog.tags.length > 0 ? blog.tags[0] : null;
  // 剩余标签
  const remainingTags =
    blog.tags && blog.tags.length > 1 ? blog.tags.slice(1) : [];
  const { theme } = useTheme(); // 添加主题支持

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-1 mb-2"
      onClick={onClick}
    >
      <MagicCard
        gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
        backgroundClassName="bg-card"
        className="h-[144px] w-full rounded-xl cursor-pointer overflow-hidden group hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300"
      >
        <div className="flex h-full items-stretch gap-4 relative p-3">
          {/* 博客封面 */}
          <div className="relative w-[180px] h-[120px] rounded-xl overflow-hidden shrink-0 bg-accent/10 group-hover:shadow-lg transition-all duration-300 border border-border/30">
            {blog.coverImageUrl ? (
              <Image
                src={blog.coverImageUrl}
                alt={blog.title}
                fill
                sizes="180px"
                priority={false}
                className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                <Bookmark className="w-8 h-8 text-purple-600/50" />
              </div>
            )}
            {blog.is_top && (
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Pin className="w-3 h-3" />
                <span className="text-[10px]">置顶</span>
              </div>
            )}

            {/* 添加发光效果 */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-600/10 to-purple-600/10 transition-opacity duration-300"></div>
          </div>

          {/* 博客信息 */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center gap-2">
                {mainTag && (
                  <TagBadge
                    icon_name={mainTag.icon_name || ""}
                    color={mainTag.color || "#6c757d"}
                    iconOnly
                    className="shrink-0"
                  />
                )}
                <h3 className="font-medium truncate text-base group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  {blog.title}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-1 mt-1 group-hover:text-foreground/80 transition-colors duration-300">
                {blog.description}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {remainingTags.length > 0 && (
                  <>
                    {remainingTags.slice(0, 3).map((tag) => (
                      <TagBadge
                        key={tag.id}
                        icon_name={tag.icon_name || ""}
                        color={tag.color || "#6c757d"}
                        name={tag.name}
                        className="text-xs py-0 h-5 group-hover:bg-gradient-to-r group-hover:from-blue-600/10 group-hover:to-purple-600/10 group-hover:border-purple-500/20 transition-all duration-300"
                      />
                    ))}
                    {remainingTags.length > 3 && (
                      <span className="text-[10px] flex items-center text-muted-foreground">
                        +{remainingTags.length - 3}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 group-hover:text-blue-600 transition-all duration-300">
                  <Calendar className="h-3 w-3" />
                  {new Date(blog.created_at).toLocaleDateString("zh-CN")}
                </span>
                <span className="flex items-center gap-1 group-hover:text-purple-600 transition-all duration-300">
                  <Clock className="h-3 w-3" />
                  阅读量: {blog.view_count}
                </span>

                {/* 箭头 - 改为更动感的设计 */}
                <div className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowUpRight className="h-3 w-3 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MagicCard>
    </motion.div>
  );
}

function SearchHotKey() {
  const isMac =
    typeof navigator !== "undefined"
      ? navigator.platform.toUpperCase().indexOf("MAC") >= 0
      : false;

  return (
    <div className="flex items-center gap-1">
      <kbd className="px-2 py-1.5 text-xs rounded-md bg-gradient-to-r from-blue-600/5 to-purple-600/5 border border-purple-500/10 text-muted-foreground shadow-sm">
        {isMac ? "⌘" : "Ctrl"}
      </kbd>
      <span className="text-muted-foreground">+</span>
      <kbd className="px-2 py-1.5 text-xs rounded-md bg-gradient-to-r from-blue-600/5 to-purple-600/5 border border-purple-500/10 text-muted-foreground shadow-sm">
        K
      </kbd>
    </div>
  );
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BlogWithCoverUrl[]>([]);
  const debouncedKeyword = useDebounce(keyword, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [animationComplete, setAnimationComplete] = useState(false);

  // 让全局状态管理可以访问setOpen函数
  useEffect(() => {
    setGlobalOpen = setOpen;
    return () => {
      setGlobalOpen = null;
    };
  }, []);

  // 监听 Command+K 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 当弹窗打开时，聚焦到输入框
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        setAnimationComplete(true);
      }, 100);
    } else {
      setAnimationComplete(false);
    }
  }, [open]);

  // 设置即时加载状态 - 在关键词变化时立即显示加载
  useEffect(() => {
    if (keyword.trim()) {
      setLoading(true);
    }
  }, [keyword]);

  // 搜索逻辑
  const handleSearch = useCallback(async () => {
    if (!debouncedKeyword.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      // 搜索前确保设置loading状态
      setLoading(true);

      // 确保这个console可以捕获到最新的loading状态
      setTimeout(() => {
        console.log("搜索状态:", {
          loading: true,
          animationComplete,
          keyword: debouncedKeyword,
        });
      }, 0);

      const blogs = await searchBlogs(debouncedKeyword);

      // 加载封面图片URL
      const blogsWithCoverUrls = await Promise.all(
        blogs.map(async (blog) => ({
          ...blog,
          coverImageUrl: blog.cover_image
            ? await getPublicUrl(BUCKET_NAME, blog.cover_image)
            : "",
        }))
      );

      setResults(blogsWithCoverUrls);
    } catch (error) {
      console.error("搜索失败:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, animationComplete]);

  // 监听关键词变化进行搜索
  useEffect(() => {
    handleSearch();
  }, [debouncedKeyword, handleSearch]);

  // 跳转到博客详情
  const handleSelectBlog = (blog: BlogWithCoverUrl) => {
    router.push(`/blogs/${blog.id}`);
    setOpen(false);
  };

  // 重置搜索
  const handleReset = () => {
    setKeyword("");
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <DialogContent className="sm:max-w-3xl max-h-[85vh] p-0 rounded-xl border border-border/30 bg-gradient-to-b from-background to-background/95 backdrop-blur-md shadow-xl z-50 transition-all duration-500 shadow-purple-500/5">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="w-full"
            >
              <DialogHeader className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      搜索博客
                    </DialogTitle>
                  </div>
                  <SearchHotKey />
                </div>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  使用关键词搜索博客标题或标签，快速找到你感兴趣的内容。
                </DialogDescription>
              </DialogHeader>

              {/* 搜索框 */}
              <div className="px-6 pb-3 mt-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 rounded-xl blur-md opacity-70"></div>
                  <div className="relative flex items-center bg-background rounded-xl border border-border/30 overflow-hidden group focus-within:ring-1 focus-within:ring-purple-500/50 focus-within:border-purple-500/30 transition-all duration-300">
                    <Search className="ml-3 h-5 w-5 text-muted-foreground shrink-0 group-focus-within:text-purple-600 transition-colors duration-300" />
                    <Input
                      ref={inputRef}
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="搜索文章标题或标签..."
                      className="border-0 p-0 h-14 px-3 text-lg shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {keyword && (
                      <button
                        onClick={handleReset}
                        className="mr-3 p-1.5 rounded-full hover:bg-purple-600/10 text-muted-foreground hover:text-purple-600 transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 搜索结果 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`results-${loading}-${results.length}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ScrollArea className="max-h-[65vh] overflow-y-auto px-6 pb-2">
                    <div className="py-2">
                      {keyword.trim() && loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                          <div className="relative w-16 h-16 mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-30 blur-md animate-pulse"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-purple-600 animate-spin"></div>
                            <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                              <Search className="h-5 w-5 text-purple-600" />
                            </div>
                          </div>
                          <p className="text-muted-foreground animate-pulse">
                            正在搜索「{keyword}」...
                          </p>
                        </div>
                      ) : !keyword.trim() && animationComplete ? (
                        <div className="flex flex-col items-center justify-center py-16">
                          <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-lg opacity-50"></div>
                            <div className="relative flex items-center justify-center w-full h-full">
                              <motion.div
                                animate={{
                                  scale: [1, 1.05, 1],
                                  rotate: [0, 5, 0, -5, 0],
                                }}
                                transition={{
                                  duration: 5,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                }}
                              >
                                <Search className="h-10 w-10 text-purple-600/70" />
                              </motion.div>
                            </div>
                          </div>
                          <motion.p
                            className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2"
                            animate={{
                              backgroundPosition: [
                                "0% 50%",
                                "100% 50%",
                                "0% 50%",
                              ],
                            }}
                            transition={{
                              duration: 10,
                              repeat: Infinity,
                            }}
                          >
                            输入关键词开始搜索
                          </motion.p>
                          <p className="text-sm text-muted-foreground max-w-md text-center">
                            你可以搜索博客标题或标签名称，快速找到你感兴趣的内容
                          </p>
                        </div>
                      ) : keyword.trim() && results.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 flex items-center justify-center mb-4">
                            <Info className="h-8 w-8 text-purple-600/50" />
                          </div>
                          <p className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                            没有找到相关结果
                          </p>
                          <p className="text-sm text-muted-foreground max-w-md text-center">
                            请尝试其他关键词，或浏览我们的标签页面寻找更多内容
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <AnimatePresence>
                            {results.map((blog, index) => (
                              <motion.div
                                key={blog.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{
                                  duration: 0.3,
                                  delay: index * 0.05,
                                }}
                              >
                                <BlogSearchResult
                                  blog={blog}
                                  onClick={() => handleSelectBlog(blog)}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </motion.div>
              </AnimatePresence>

              {/* 底部状态栏 */}
              <div className="px-6 py-3 text-xs border-t border-border/30 bg-gradient-to-r from-blue-600/5 via-transparent to-purple-600/5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-gradient-to-r from-blue-600/5 to-purple-600/5 border border-purple-500/10">
                      ESC
                    </kbd>
                    <span>关闭</span>
                  </span>
                  {results.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <span className="flex items-center gap-1.5">
                        共找到
                        <span className="inline-flex h-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-2 text-xs font-medium text-purple-600">
                          {results.length}
                        </span>
                        个结果
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

// 默认导出
export default CommandSearch;
