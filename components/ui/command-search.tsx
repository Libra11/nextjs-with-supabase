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
  BookOpen,
} from "lucide-react";
import { BlogWithTags } from "@/types/blog";
import { searchBlogs } from "@/lib/blog";
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
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

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
        className={cn(
          "w-full rounded-xl cursor-pointer overflow-hidden group hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300",
          isMobile ? "h-auto" : "h-[144px]"
        )}
      >
        {isMobile ? (
          // 移动端布局 - 自适应宽度和换行
          <div className="w-full relative p-3 max-w-full">
            {/* 顶部区域 - 标题和主标签 */}
            <div className="flex items-center gap-2 mb-2 w-full max-w-full">
              {mainTag && (
                <TagBadge
                  icon_name={mainTag.icon_name || ""}
                  color={mainTag.color || "#6c757d"}
                  iconOnly
                  className="shrink-0 h-5 w-5"
                />
              )}
              <h3 className="font-medium text-sm group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 pr-5 truncate max-w-[calc(100%-40px)]">
                {blog.title}
                {blog.is_top && (
                  <span className="inline-flex items-center ml-1.5 bg-black/50 backdrop-blur-sm text-white px-1 py-0.5 rounded text-[9px]">
                    <Pin className="w-2 h-2 mr-0.5" />
                    置顶
                  </span>
                )}
              </h3>
            </div>

            {/* 中间区域 - 封面图和描述 */}
            <div className="flex gap-3 mb-2 w-full max-w-full">
              {/* 封面图 */}
              <div className="relative w-[60px] h-[60px] rounded-lg overflow-hidden shrink-0 bg-accent/10 border border-border/30">
                {blog.coverImageUrl ? (
                  <Image
                    src={blog.coverImageUrl}
                    alt={blog.title}
                    fill
                    sizes="60px"
                    priority={false}
                    className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                    <Bookmark className="w-4 h-4 text-purple-600/50" />
                  </div>
                )}
              </div>

              {/* 描述 */}
              <div className="flex-1 min-w-0 max-w-[calc(100%-75px)]">
                <p className="text-xs text-muted-foreground line-clamp-3 group-hover:text-foreground/80 transition-colors duration-300">
                  {blog.description}
                </p>
              </div>
            </div>

            {/* 底部区域 - 标签和信息 */}
            <div className="flex items-center justify-between w-full max-w-full flex-wrap gap-y-1">
              {/* 标签部分 */}
              <div className="flex flex-wrap gap-1 items-center max-w-[70%]">
                {remainingTags.length > 0 && (
                  <>
                    {remainingTags.slice(0, 1).map((tag) => (
                      <TagBadge
                        key={tag.id}
                        icon_name={tag.icon_name || ""}
                        color={tag.color || "#6c757d"}
                        name={tag.name}
                        className="text-[10px] py-0 h-4 group-hover:bg-gradient-to-r group-hover:from-blue-600/10 group-hover:to-purple-600/10 group-hover:border-purple-500/20 transition-all duration-300"
                      />
                    ))}
                    {remainingTags.length > 1 && (
                      <span className="text-[10px] flex items-center text-muted-foreground">
                        +{remainingTags.length - 1}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* 日期和阅读量 */}
              <div className="flex items-center text-[10px] text-muted-foreground gap-2 shrink-0">
                <span className="flex items-center gap-0.5 whitespace-nowrap">
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(blog.created_at).toLocaleDateString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-0.5 whitespace-nowrap">
                  <Clock className="h-2.5 w-2.5" />
                  {blog.view_count}
                </span>
              </div>
            </div>

            {/* 箭头指示 */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ArrowUpRight className="h-2.5 w-2.5 text-purple-600" />
              </div>
            </div>
          </div>
        ) : (
          // 桌面端水平布局
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
        )}
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
      const blogsWithCoverUrls = blogs.map((blog) => ({
        ...blog,
        coverImageUrl: blog.cover_image || "",
      }));

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
          <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 rounded-xl border border-border/30 bg-gradient-to-b from-background to-background/95 backdrop-blur-md shadow-xl z-50 transition-all duration-500 shadow-purple-500/5 w-[95vw] sm:w-full mx-auto overflow-hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="w-full flex flex-col max-h-[90vh] overflow-hidden"
            >
              <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: rgba(139, 92, 246, 0.2);
                  border-radius: 3px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(139, 92, 246, 0.4);
                }

                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: rgba(139, 92, 246, 0.2) transparent;
                }
              `}</style>
              <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      搜索博客
                    </DialogTitle>
                  </div>
                  <SearchHotKey />
                </div>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-2">
                  使用关键词搜索博客标题或标签，快速找到你感兴趣的内容。
                </DialogDescription>
              </DialogHeader>

              {/* 搜索框 */}
              <div className="px-4 sm:px-6 pb-3 mt-1 flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 rounded-xl blur-md opacity-70"></div>
                  <div className="relative flex items-center bg-background rounded-xl border border-border/30 overflow-hidden group focus-within:ring-1 focus-within:ring-purple-500/50 focus-within:border-purple-500/30 transition-all duration-300">
                    <Search className="ml-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 group-focus-within:text-purple-600 transition-colors duration-300" />
                    <Input
                      ref={inputRef}
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="搜索文章标题或标签..."
                      className="border-0 p-0 h-11 sm:h-12 px-3 text-base sm:text-lg shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {keyword && (
                      <button
                        onClick={handleReset}
                        className="mr-3 p-1.5 rounded-full hover:bg-purple-600/10 text-muted-foreground hover:text-purple-600 transition-colors duration-200"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  className="flex-grow overflow-hidden"
                >
                  <div className="max-h-[500px] sm:max-h-none overflow-y-auto px-4 sm:px-6 pb-2 w-full custom-scrollbar">
                    <div className="py-2 w-full max-w-full">
                      {keyword.trim() && loading ? (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-30 blur-md animate-pulse"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-purple-600 animate-spin"></div>
                            <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                            </div>
                          </div>
                          <p className="text-sm sm:text-base text-muted-foreground animate-pulse">
                            正在搜索「{keyword}」...
                          </p>
                        </div>
                      ) : !keyword.trim() && animationComplete ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6">
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
                                <Search className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600/70" />
                              </motion.div>
                            </div>
                          </div>
                          <motion.p
                            className="text-base sm:text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2"
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
                          <p className="text-xs sm:text-sm text-muted-foreground max-w-md text-center px-4">
                            你可以搜索博客标题或标签名称，快速找到你感兴趣的内容
                          </p>
                        </div>
                      ) : keyword.trim() && results.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 flex items-center justify-center mb-4">
                            <Info className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600/50" />
                          </div>
                          <p className="text-base sm:text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                            没有找到相关结果
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground max-w-md text-center px-4">
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
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* 底部状态栏 */}
              <div className="px-4 sm:px-6 py-2 sm:py-3 text-xs border-t border-border/30 bg-gradient-to-r from-blue-600/5 via-transparent to-purple-600/5 flex-shrink-0">
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
