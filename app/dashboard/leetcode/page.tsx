/**
 * Author: Libra
 * Date: 2025-10-02 00:44:21
 * LastEditTime: 2025-10-27 23:43:17
 * LastEditors: Libra
 * Description: 
*/
/**
 * LeetCode Problems Management Page
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
import { LeetCodeProblem, Difficulty } from "@/types/leetcode";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  getProblems,
  deleteProblem,
  searchProblemsAdmin,
} from "@/lib/leetcode";
import Link from "next/link";
import { Edit, Trash2, Eye, Search, X } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DifficultyBadge } from "@/components/leetcode/difficulty-badge";
import { Badge } from "@/components/ui/badge";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function LeetCodeManagementPage() {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewProblem, setPreviewProblem] = useState<LeetCodeProblem | null>(
    null
  );

  // Search states
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchStatus, setSearchStatus] = useState<string>("all");
  const [searchDifficulty, setSearchDifficulty] = useState<string>("all");

  useEffect(() => {
    loadProblems();
  }, [currentPage, pageSize]);

  const loadProblems = async () => {
    try {
      setIsLoading(true);

      if (
        searchKeyword ||
        searchStatus !== "all" ||
        searchDifficulty !== "all"
      ) {
        const data = await searchProblemsAdmin(searchKeyword, {
          status: searchStatus !== "all" ? (searchStatus as any) : undefined,
          difficulty:
            searchDifficulty !== "all"
              ? (searchDifficulty as Difficulty)
              : undefined,
          page: currentPage,
          pageSize: pageSize,
        });
        setProblems(data.problems);
        setTotalItems(data.count);
      } else {
        const data = await getProblems({
          page: currentPage,
          pageSize: pageSize,
          status: undefined,
        });
        setProblems(data.problems);
        setTotalItems(data.count);
      }
    } catch (error) {
      console.error("加载题目列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (id: number) => {
    setProblemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!problemToDelete) return;

    try {
      await deleteProblem(problemToDelete);
      await loadProblems();
    } catch (error) {
      console.error("删除题目失败:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setProblemToDelete(null);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadProblems();
  };

  const handleResetSearch = () => {
    setSearchKeyword("");
    setSearchStatus("all");
    setSearchDifficulty("all");
    setCurrentPage(1);
    setTimeout(() => {
      loadProblems();
    }, 0);
  };

  const handlePreview = (problem: LeetCodeProblem) => {
    setPreviewProblem(problem);
    setIsPreviewOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const renderPaginationItems = (): ReactNode[] => {
    const items: ReactNode[] = [];
    const maxVisiblePages = 5;

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
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    } else if (currentPage >= totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
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
    } else {
      items.push(
        <PaginationItem key="ellipsis-left">
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
        <PaginationItem key="ellipsis-right">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

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

    return items;
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">算法题目管理</h1>
        <Link href="/dashboard/leetcode/new">
          <Button>新建题目</Button>
        </Link>
      </div>

      {/* Search Area */}
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">题目搜索</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="text-sm font-medium mb-1 block">
                关键词搜索
              </label>
              <Input
                placeholder="搜索标题、描述或题解..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">难度</label>
              <Select
                value={searchDifficulty}
                onValueChange={setSearchDifficulty}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
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
            <div className="md:col-span-4 flex items-end space-x-2">
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
      ) : problems.length === 0 ? (
        <div className="py-24 text-center text-gray-500">
          <p className="text-xl">暂无题目</p>
          <p className="mt-2">点击"新建题目"按钮创建您的第一道题目</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 h-0">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">编号</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>难度</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell className="font-medium">
                      {problem.leetcode_id || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {problem.title}
                    </TableCell>
                    <TableCell>
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {problem.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{problem.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {problem.status === "published" ? (
                        <Badge variant="default">已发布</Badge>
                      ) : (
                        <Badge variant="outline">草稿</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(problem.created_at),
                        "yyyy-MM-dd HH:mm",
                        {
                          locale: zhCN,
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePreview(problem)}
                          title="预览题目"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Link href={`/dashboard/leetcode/${problem.id}/edit`}>
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(problem.id)}
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
                共 {totalItems} 道题目
              </span>
            </div>
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
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
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除题目</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。题目将被永久删除，且无法恢复。
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

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewProblem?.title}</DialogTitle>
            <div className="mt-2">
              {previewProblem && (
                <DifficultyBadge difficulty={previewProblem.difficulty} />
              )}
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 mt-4">
            {previewProblem && (
              <MarkdownContent content={previewProblem.description} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
