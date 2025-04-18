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

    // 当总页数少于或等于最大可见页数时，显示所有页码
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
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
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">博客管理</h1>
        <Link href="/dashboard/blogs/new">
          <Button>新建博客</Button>
        </Link>
      </div>

      {/* 搜索区域 */}
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">博客搜索</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1 block">
                关键词搜索
              </label>
              <Input
                placeholder="搜索标题、描述或内容..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1 block">博客标题</label>
              <Input
                placeholder="输入博客标题关键词..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1 block">博客标签</label>
              <MultiSelect
                options={tagOptions}
                selected={selectedTagIds}
                onChange={setSelectedTagIds}
                placeholder="选择博客标签..."
                className="w-full"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-1 block">状态</label>
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end space-x-2">
              <Button
                onClick={handleSearch}
                className="flex-1"
                disabled={isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
              <Button
                variant="outline"
                onClick={handleResetSearch}
                className="flex-1"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                重置
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-24 text-center text-gray-500">
          <p className="text-xl">暂无博客</p>
          <p className="mt-2">点击"新建博客"按钮创建您的第一篇博客</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 h-0">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>置顶</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium">{blog.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {blog.tags.map((tag) => (
                          <TagBadge
                            key={tag.id}
                            name={tag.name}
                            icon_name={tag.icon_name || ""}
                            color={tag.color || ""}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {blog.status === "published" ? (
                        <Badge variant="default">已发布</Badge>
                      ) : (
                        <Badge variant="outline">草稿</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleToggleTop(blog.id, blog.is_top)
                              }
                              disabled={loading[blog.id]}
                              className={
                                blog.is_top
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              }
                            >
                              <PinIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {blog.is_top ? "取消置顶" : "置顶博客"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {format(new Date(blog.created_at), "yyyy-MM-dd HH:mm", {
                        locale: zhCN,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePreview(blog)}
                          title="预览博客"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">每页显示:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                共 {totalItems} 篇博客
              </span>
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除博客</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。博客将被永久删除，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 博客预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewBlog?.title}</DialogTitle>
            <DialogDescription>{previewBlog?.description}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 mt-4">
            {previewBlog && <MarkdownContent content={previewBlog.content} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
