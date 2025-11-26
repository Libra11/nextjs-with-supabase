/**
 * Author: Libra
 * Date: 2025-03-07 19:36:53
 * LastEditors: Libra
 * Description:
 */
/**
 * Author: Libra
 * Date: 2025-03-07 17:49:45
 * LastEditors: Libra
 * Description: 博客管理
 */
"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BlogWithTags, Tag } from "@/types/blog";
import { useEffect, useState } from "react";
import {
  getBlogs,
  deleteBlog,
  updateBlog,
  getTags,
  searchBlogsAdmin,
} from "@/lib/blog";
import Link from "next/link";
import { Edit, Trash2, PinIcon, Eye, Search, X } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { TagBadge } from "@/components/ui/tag-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import MarkdownContent from "@/components/markdown-content";
import { Input } from "@/components/ui/input";
import { MultiSelect, Option } from "@/components/ui/multi-select";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogWithTags[]>([]);
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlog, setPreviewBlog] = useState<BlogWithTags | null>(null);

  // 搜索相关状态
  const [searchTitle, setSearchTitle] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>("all");

  const totalPages = Math.ceil(totalItems / pageSize);

  useEffect(() => {
    loadBlogs();
    loadTags();
  }, [currentPage, pageSize]);

  const loadTags = async () => {
    try {
      setIsLoadingTags(true);
      const tags = await getTags();
      setAllTags(tags);
    } catch (error) {
      console.error("加载标签失败:", error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const loadBlogs = async () => {
    try {
      setIsLoading(true);

      // 使用关键词搜索或普通分页获取
      if (
        searchKeyword ||
        selectedTagIds.length > 0 ||
        (searchStatus && searchStatus !== "all")
      ) {
        const data = await searchBlogsAdmin(searchKeyword, {
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          status:
            searchStatus && searchStatus !== "all" ? searchStatus : undefined,
          page: currentPage,
          pageSize: pageSize,
        });
        setBlogs(data.blogs);
        setTotalItems(data.count);
      } else {
        // 基本分页获取
        const data = await getBlogs(currentPage, pageSize, {
          title: searchTitle || undefined,
        });
        setBlogs(data.blogs);
        setTotalItems(data.count);
      }
    } catch (error) {
      console.error("加载博客列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (id: number) => {
    setBlogToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!blogToDelete) return;

    try {
      await deleteBlog(blogToDelete);
      await loadBlogs();
    } catch (error) {
      console.error("删除博客失败:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setBlogToDelete(null);
    }
  };

  // 处理置顶状态切换
  const handleToggleTop = async (id: number, currentIsTop: boolean) => {
    try {
      setLoading((prev) => ({ ...prev, [id]: true }));
      await updateBlog(id, { is_top: !currentIsTop });
      await loadBlogs();
    } catch (error) {
      console.error("更新置顶状态失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // 重置到第一页
  };

  const handlePreview = (blog: BlogWithTags) => {
    setPreviewBlog(blog);
    setIsPreviewOpen(true);
  };

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1); // 重置页码
    loadBlogs(); // 重新加载博客
  };

  // 重置搜索
  const handleResetSearch = () => {
    setSearchTitle("");
    setSearchKeyword("");
    setSelectedTagIds([]);
    setSearchStatus("all");
    setCurrentPage(1);
    // 重置后立即加载数据
    setTimeout(() => {
      loadBlogs();
    }, 0);
  };

  // 将标签数据转换为 Option 格式
  const tagOptions: Option[] = allTags.map((tag) => ({
    value: tag.id,
    label: tag.name,
  }));

  // 生成可点击的页码
  const renderPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const maxVisiblePages = 5;

    const linkClass = "cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors";

    // 当总页数少于或等于最大可见页数时，显示所有页码
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className={linkClass}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      return items;
    }

    // 当总页数大于最大可见页数时，显示部分页码加省略号
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
          className={linkClass}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // 当前页靠近开始
    if (currentPage <= 3) {
      for (let i = 2; i <= 4; i++) {
        if (i <= totalPages) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
                className={linkClass}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (totalPages > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    // 当前页靠近结束
    else if (currentPage >= totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );

      for (let i = totalPages - 3; i < totalPages; i++) {
        if (i > 1) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
                className={linkClass}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
    }
    // 当前页在中间
    else {
      items.push(
        <PaginationItem key="ellipsis3">
          <PaginationEllipsis />
        </PaginationItem>
      );

      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className={linkClass}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key="ellipsis4">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className={linkClass}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-6 flex flex-col h-full p-2">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            博客管理
          </h1>
          <p className="text-muted-foreground mt-1">
            管理您的博客文章，包括发布、编辑和删除。
          </p>
        </div>
        <Link href="/dashboard/blogs/new">
          <Button className="shadow-lg hover:shadow-xl transition-all duration-300">
            <Edit className="mr-2 h-4 w-4" />
            新建博客
          </Button>
        </Link>
      </div>

      {/* 搜索区域 */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/50 transition-all hover:shadow-md hover:border-border/80">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">筛选与搜索</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                关键词
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索内容..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9 bg-background/50 focus:bg-background transition-colors"
                />
              </div>
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                标题
              </label>
              <Input
                placeholder="搜索标题..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                标签
              </label>
              <MultiSelect
                options={tagOptions}
                selected={selectedTagIds}
                onChange={setSelectedTagIds}
                placeholder="选择标签..."
                className="w-full bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="md:col-span-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                状态
              </label>
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger className="w-full bg-background/50 focus:bg-background transition-colors">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <Button
                onClick={handleSearch}
                className="flex-1 shadow-sm hover:shadow transition-all"
                disabled={isLoading}
              >
                搜索
              </Button>
              <Button
                variant="outline"
                onClick={handleResetSearch}
                className="flex-1 hover:bg-muted transition-colors"
                disabled={isLoading}
              >
                重置
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">正在加载数据...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-muted/10 rounded-xl border border-dashed border-border">
          <div className="bg-muted/30 p-6 rounded-full mb-4">
            <Search className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">暂无博客</h3>
          <p className="text-muted-foreground mt-2 max-w-sm text-center">
            没有找到符合条件的博客文章。您可以尝试调整搜索条件或创建一篇新博客。
          </p>
          <Link href="/dashboard/blogs/new" className="mt-6">
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              新建博客
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 h-0">
          <div className="flex-1 overflow-hidden rounded-xl border border-border shadow-sm bg-card">
            <div className="overflow-auto h-full custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b border-border/60">
                    <TableHead className="w-[30%] pl-6">标题</TableHead>
                    <TableHead className="w-[25%]">标签</TableHead>
                    <TableHead className="w-[10%]">状态</TableHead>
                    <TableHead className="w-[10%] text-center">置顶</TableHead>
                    <TableHead className="w-[15%]">创建时间</TableHead>
                    <TableHead className="w-[10%] text-right pr-6">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow 
                      key={blog.id} 
                      className="group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0"
                    >
                      <TableCell className="font-medium pl-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="truncate max-w-[300px] text-base group-hover:text-primary transition-colors">
                            {blog.title}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {blog.description || "暂无描述"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {blog.tags.length > 0 ? (
                            blog.tags.map((tag) => (
                              <TagBadge
                                key={tag.id}
                                name={tag.name}
                                icon_name={tag.icon_name || ""}
                                color={tag.color || ""}
                                className="text-xs px-2 py-0.5"
                              />
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">无标签</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {blog.status === "published" ? (
                          <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            已发布
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground bg-muted/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1.5"></span>
                            草稿
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleTop(blog.id, blog.is_top)}
                                disabled={loading[blog.id]}
                                className={`h-8 w-8 transition-all duration-300 ${
                                  blog.is_top
                                    ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-600"
                                    : "text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-500/10"
                                }`}
                              >
                                <PinIcon className={`h-4 w-4 ${blog.is_top ? "fill-current" : ""}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              {blog.is_top ? "取消置顶" : "置顶博客"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(blog.created_at), "yyyy-MM-dd HH:mm", {
                          locale: zhCN,
                        })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePreview(blog)}
                                  className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>预览</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>编辑</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(blog.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>删除</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2 bg-card/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>每页显示</span>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[70px] h-8 bg-background/50">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>
                共 <span className="font-medium text-foreground">{totalItems}</span> 篇
              </span>
            </div>

            <Pagination className="justify-end w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    className={`h-8 px-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors ${
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }`}
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    className={`h-8 px-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors ${
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5" />
              </div>
              <AlertDialogTitle>确认删除博客</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              此操作无法撤销。该博客文章将被永久删除，且无法恢复。建议您在删除前确认是否已备份重要内容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="hover:bg-muted">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 博客预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              {previewBlog?.status === "published" ? (
                <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0 h-5">已发布</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground bg-muted/50 text-[10px] px-1.5 py-0 h-5">草稿</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {previewBlog && format(new Date(previewBlog.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN })}
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold leading-tight">{previewBlog?.title}</DialogTitle>
            <DialogDescription className="mt-2 text-base line-clamp-2">{previewBlog?.description}</DialogDescription>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {previewBlog?.tags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  icon_name={tag.icon_name || ""}
                  color={tag.color || ""}
                  className="text-xs"
                />
              ))}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
            <div className="max-w-4xl mx-auto">
              {previewBlog && <MarkdownContent content={previewBlog.content} />}
            </div>
          </div>
          <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              关闭
            </Button>
            <Link href={`/dashboard/blogs/${previewBlog?.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                编辑此博客
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
