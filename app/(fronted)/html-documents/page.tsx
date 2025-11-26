/**
 * Author: Libra
 * Date: 2025-09-16 16:56:42
 * LastEditors: Libra
 * Description:
 */
"use client";

import { useState, useEffect } from "react";
import { HtmlDocumentWithCategory, HtmlCategory } from "@/types/html-document";
import { getHtmlDocuments, getHtmlCategories } from "@/lib/html-document";
import { Button } from "@/components/ui/button";
import { Globe, Eye, Calendar, Filter, X, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { MagicCard } from "@/components/magicui/magic-card";
import { icons } from "@/icons.config";

// 动画样式
const animationStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// 动态图标组件
const DynamicIcon = ({
  name,
  size = 16,
  className = "",
  loadedIcons,
}: {
  name?: string;
  size?: number;
  className?: string;
  loadedIcons?: Record<string, any>;
}) => {
  if (!name || !loadedIcons || !loadedIcons[name]) return null;

  const IconComponent = loadedIcons[name];
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <IconComponent
        style={{
          width: "100%",
          height: "100%",
          maxWidth: size,
          maxHeight: size,
        }}
      />
    </div>
  );
};

// 加载骨架屏 - 模仿博客卡片布局
const DocumentSkeleton = () => {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-primary/10 shadow-lg">
      <div className="flex flex-col p-3">
        {/* 图片区域骨架 */}
        <div className="relative w-full h-[220px] bg-muted/30 animate-pulse rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent animate-[shimmer_1.5s_infinite]"></div>
          {/* 分类标签骨架 */}
          <div className="absolute top-2 right-2 bg-muted/50 rounded-md px-2 py-1 flex items-center gap-1">
            <div className="w-3 h-3 bg-muted/60 rounded animate-pulse"></div>
            <div className="w-8 h-3 bg-muted/60 rounded animate-pulse"></div>
          </div>
        </div>

        {/* 内容区域骨架 */}
        <div className="flex-1 px-1 py-2 space-y-3">
          {/* 标题区域 */}
          <div className="h-5 bg-muted/40 rounded animate-pulse"></div>

          {/* 描述区域 */}
          <div className="space-y-1">
            <div className="h-3 bg-muted/30 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-muted/30 rounded w-1/2 animate-pulse"></div>
          </div>

          {/* 元数据区域 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted/40 rounded animate-pulse"></div>
              <div className="h-3 bg-muted/30 rounded w-16 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted/40 rounded animate-pulse"></div>
              <div className="h-3 bg-muted/30 rounded w-12 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 卡片卡片组件 - 完全模仿博客卡片样式，但使用竖向图片布局
const DocumentCard = ({
  document,
  index,
  loadedIcons,
}: {
  document: HtmlDocumentWithCategory;
  index: number;
  loadedIcons: Record<string, any>;
}) => {
  const { theme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 获取主分类（第一个分类作为主分类）
  const mainCategory = document.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="h-full"
    >
      <Link href={`/html-documents/${document.id}`} className="block group">
        {isClient ? (
          <MagicCard
            gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
            backgroundClassName={cn("bg-card")}
            className="h-full w-full rounded-xl"
          >
            <div className="flex flex-col p-3">
              {/* 图片区域 - 使用竖向布局，类似博客卡片但更高 */}
              <div className="relative w-full h-[220px]">
                {document.cover_image_url ? (
                  <Image
                    src={document.cover_image_url}
                    alt={document.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                )}
                {/* 分类标签在图片上 */}
                {mainCategory && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center gap-1">
                    <DynamicIcon
                      name={mainCategory.icon || ""}
                      size={12}
                      className="text-white"
                      loadedIcons={loadedIcons}
                    />
                    <span className="text-[10px] font-medium">
                      {mainCategory.name}
                    </span>
                  </div>
                )}
              </div>

              {/* 内容区域 - 完全模仿博客卡片 */}
              <div className="flex-1">
                <div className="px-1 py-2">
                  {/* 标题 */}
                  <div className="text-base my-1 font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {document.title}
                  </div>

                  {/* 描述 - 如果没有描述，显示分类名 */}
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 h-8">
                    {mainCategory?.name || "知识卡片"}
                  </p>

                  {/* 元数据信息 */}
                  <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {format(new Date(document.created_at), "yyyy-MM-dd", {
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">
                        {document.view_count} 次浏览
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MagicCard>
        ) : (
          // 服务端渲染时的静态卡片
          <div className="h-full w-full rounded-xl border border-primary/10 shadow-lg">
            <div className="flex flex-col p-3">
              {/* 图片区域 */}
              <div className="relative w-full h-[220px]">
                {document.cover_image_url ? (
                  <Image
                    src={document.cover_image_url}
                    alt={document.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                )}
                {/* 分类标签在图片上 */}
                {mainCategory && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center gap-1">
                    <DynamicIcon
                      name={mainCategory.icon || ""}
                      size={12}
                      className="text-white"
                      loadedIcons={loadedIcons}
                    />
                    <span className="text-[10px] font-medium">
                      {mainCategory.name}
                    </span>
                  </div>
                )}
              </div>

              {/* 内容区域 */}
              <div className="flex-1">
                <div className="px-1 py-2">
                  <div className="text-base my-1 font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {document.title}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 h-8">
                    {mainCategory?.name || "知识卡片"}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {format(new Date(document.created_at), "yyyy-MM-dd", {
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">
                        {document.view_count} 次浏览
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
};

export default function HtmlDocumentsPage() {
  const [documents, setDocuments] = useState<HtmlDocumentWithCategory[]>([]);
  const [categories, setCategories] = useState<HtmlCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});

  // 筛选状态
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCategoryGridExpanded, setIsCategoryGridExpanded] = useState(false);
  const pageSize = 12;

  const { theme, resolvedTheme } = useTheme();

  // 加载数据
  const loadDocuments = async (page = 1, categoryId?: number) => {
    setLoading(page === 1);
    try {
      const filters: any = {};

      if (categoryId) {
        filters.category_id = categoryId;
      }

      const { documents: docs, count } = await getHtmlDocuments(
        page,
        pageSize,
        filters
      );

      if (page === 1) {
        setDocuments(docs);
      } else {
        setDocuments((prev) => [...prev, ...docs]);
      }

      setTotalCount(count);
      setCurrentPage(page);
    } catch (error) {
      console.error("加载知识卡片失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 加载分类
  const loadCategories = async () => {
    try {
      const categoriesData = await getHtmlCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("加载分类失败:", error);
    }
  };

  // 选择分类处理
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    const id = categoryId === "all" ? undefined : parseInt(categoryId);
    loadDocuments(1, id);
  };

  // 获得已选分类名称
  const getSelectedCategoryName = () => {
    if (selectedCategory === "all") return "全部分类";
    const category = categories.find(
      (cat) => cat.id.toString() === selectedCategory
    );
    return category?.name || "未知分类";
  };

  // 加载更多
  const loadMore = () => {
    const nextPage = currentPage + 1;
    const categoryId =
      selectedCategory === "all" ? undefined : parseInt(selectedCategory);
    loadDocuments(nextPage, categoryId);
  };

  // 计算是否还有更多数据
  const hasMore = documents.length < totalCount;

  // 确保组件已挂载，防止 hydration 不匹配
  useEffect(() => {
    setMounted(true);
    loadDocuments();
    loadCategories();
    // 加载自定义图标
    Promise.all(
      Object.entries(icons).map(async ([name, importFn]: any) => {
        const icon = await importFn();
        return [name, icon.default] as const;
      })
    ).then((loadedPairs) => {
      setLoadedIcons(Object.fromEntries(loadedPairs));
    });
  }, []);

  // 如果组件还未挂载，返回骨架屏
  if (!mounted) {
    return (
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="h-52 w-full rounded-2xl bg-muted/30 animate-pulse mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent animate-[shimmer_1.5s_infinite]"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <DocumentSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // 确定使用的主题颜色
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      {/* 添加动画样式 */}
      <style jsx global>
        {animationStyles}
      </style>

      {/* 顶部标题区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 mt-0 md:mt-4"
      >
        <div className="relative inline-block">
          <h2 className="title-gradient">HTML 卡片</h2>
        </div>
        <p className="text-muted-foreground mt-4">
          探索精心收集的知识卡片集合，包含交互式演示、创意设计和实用工具。点击下方分类开始您的探索之旅。
        </p>
      </motion.div>

      {/* 分类选择区域 - 全新设计 */}
      <AnimatePresence mode="wait">
        <motion.div
          key="category-selector"
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

              {/* 分类头部 */}
              <div className="pt-6 px-6 pb-4 relative z-10 border-b border-primary/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Filter className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">分类</h3>
                      <p className="text-sm text-muted-foreground">
                        选择一个感兴趣的分类
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedCategory !== "all" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1.5 px-3 py-1 h-9 rounded-full border-primary/20 hover:bg-primary/10 transition-all duration-300"
                        onClick={() => handleCategorySelect("all")}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>重置选择</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 h-9 rounded-full border-primary/20 hover:bg-primary/10 transition-all duration-300",
                        isCategoryGridExpanded && "bg-purple-600/10"
                      )}
                      onClick={() =>
                        setIsCategoryGridExpanded(!isCategoryGridExpanded)
                      }
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>
                        {isCategoryGridExpanded ? "收起分类" : "展开所有分类"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* 已选分类显示 */}
                {selectedCategory !== "all" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 flex flex-wrap items-center gap-2"
                  >
                    <span className="text-sm text-muted-foreground px-2">
                      已选:
                    </span>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-primary rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1.5 border border-purple-600/20 shadow-sm"
                    >
                      {selectedCategory !== "all" && (
                        <DynamicIcon
                          name={
                            categories.find(
                              (cat) => cat.id.toString() === selectedCategory
                            )?.icon || ""
                          }
                          size={16}
                          className="text-primary"
                          loadedIcons={loadedIcons}
                        />
                      )}
                      {getSelectedCategoryName()}
                      <X
                        className="w-3.5 h-3.5 ml-1 cursor-pointer hover:text-primary/80"
                        onClick={() => handleCategorySelect("all")}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* 分类网格 */}
              <div className="p-6 relative z-10">
                <AnimatePresence>
                  <motion.div
                    className={cn(
                      "grid gap-3",
                      isCategoryGridExpanded
                        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-80 overflow-y-auto"
                        : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
                    )}
                  >
                    {/* 全部分类选项 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0, duration: 0.3 }}
                      onClick={() => handleCategorySelect("all")}
                      className={cn(
                        "relative group",
                        "flex items-center gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                        "hover:shadow-md hover:scale-105",
                        selectedCategory === "all"
                          ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-purple-600/30 shadow-sm shadow-purple-600/5"
                          : "bg-card hover:bg-accent/10 border border-transparent hover:border-purple-600/20"
                      )}
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-md transition-opacity duration-300"></div>

                      <div className="relative z-10 flex items-center gap-2 truncate">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center transition-transform duration-300",
                            selectedCategory === "all" && "scale-110"
                          )}
                        >
                          <CreditCard className="w-3 h-3 text-primary" />
                        </div>
                        <span
                          className={cn(
                            "text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 flex-1",
                            selectedCategory === "all" &&
                              "text-primary font-medium"
                          )}
                        >
                          全部
                        </span>
                      </div>

                      {selectedCategory === "all" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl ring-2 ring-purple-600/30 ring-offset-1 ring-offset-background/10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        ></motion.div>
                      )}
                    </motion.div>

                    {/* 具体分类选项 */}
                    {categories
                      .slice(0, isCategoryGridExpanded ? categories.length : 11)
                      .map((category, idx) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: (idx + 1) * 0.03,
                            duration: 0.3,
                          }}
                          onClick={() =>
                            handleCategorySelect(category.id.toString())
                          }
                          className={cn(
                            "relative group",
                            "flex items-center gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                            "hover:shadow-md hover:scale-105",
                            selectedCategory === category.id.toString()
                              ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-purple-600/30 shadow-sm shadow-purple-600/5"
                              : "bg-card hover:bg-accent/10 border border-transparent hover:border-purple-600/20"
                          )}
                        >
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-md transition-opacity duration-300"></div>

                          <div className="relative z-10 flex items-center gap-2 truncate">
                            <DynamicIcon
                              name={category.icon}
                              size={16}
                              className={cn(
                                "transition-transform duration-300",
                                selectedCategory === category.id.toString() &&
                                  "scale-110"
                              )}
                              loadedIcons={loadedIcons}
                            />
                            <span
                              className={cn(
                                "text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 flex-1",
                                selectedCategory === category.id.toString() &&
                                  "text-primary font-medium"
                              )}
                            >
                              {category.name}
                            </span>
                          </div>

                          {selectedCategory === category.id.toString() && (
                            <motion.div
                              className="absolute inset-0 rounded-xl ring-2 ring-purple-600/30 ring-offset-1 ring-offset-background/10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            ></motion.div>
                          )}
                        </motion.div>
                      ))}

                    {!isCategoryGridExpanded && categories.length > 11 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        onClick={() => setIsCategoryGridExpanded(true)}
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

      {/* 卡片网格 - 使用动画和新的卡片设计 */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <DocumentSkeleton key={index} />
            ))}
          </motion.div>
        ) : documents.length === 0 ? (
          // 空状态 - 美化设计
          <motion.div
            key="empty"
            className="col-span-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center py-16 rounded-2xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 border border-primary/10 backdrop-blur-sm">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-6">
                  <Globe className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  暂无卡片
                </h3>
                <p className="text-muted-foreground text-lg">
                  {selectedCategory !== "all"
                    ? "未找到匹配的知识卡片"
                    : "还没有知识卡片，敬请期待"}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // 卡片列表 - 新的卡片设计
          <motion.div
            key="documents"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {documents.map((document, index) => (
              <DocumentCard
                key={document.id}
                document={document}
                index={index}
                loadedIcons={loadedIcons}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加载更多 - 美化按钮设计 */}
      {hasMore && !loading && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={loadMore}
            variant="outline"
            className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-primary/20 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            加载更多
          </Button>
        </motion.div>
      )}
    </div>
  );
}
