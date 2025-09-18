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
import { HtmlDocumentWithCategory, HtmlCategory } from "@/types/html-document";
import { useEffect, useState } from "react";
import {
  getHtmlDocuments,
  deleteHtmlDocument,
  getHtmlCategories,
  searchHtmlDocuments,
} from "@/lib/html-document";
import Link from "next/link";
import { Edit, Trash2, Eye, Search, X, Plus, Globe } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { icons } from "@/icons.config";

// 动态图标组件
const DynamicIcon = ({ 
  name, 
  size = 16, 
  className = "", 
  loadedIcons 
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
        flexShrink: 0 
      }}
    >
      <IconComponent 
        style={{ 
          width: '100%', 
          height: '100%',
          maxWidth: size,
          maxHeight: size
        }} 
      />
    </div>
  );
};

export default function HtmlDocumentsPage() {
  const [documents, setDocuments] = useState<HtmlDocumentWithCategory[]>([]);
  const [categories, setCategories] = useState<HtmlCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSearching, setIsSearching] = useState(false);

  // 加载数据
  const loadDocuments = async (page = 1) => {
    setLoading(true);
    try {
      const filters: any = {};
      
      if (selectedCategory && selectedCategory !== "all") {
        filters.category_id = parseInt(selectedCategory);
      }
      
      if (searchKeyword.trim()) {
        filters.title = searchKeyword.trim();
      }

      const { documents: docs, count } = await getHtmlDocuments(page, pageSize, filters);
      setDocuments(docs);
      setTotalCount(count);
      setCurrentPage(page);
    } catch (error) {
      console.error("加载HTML文档失败:", error);
      toast.error("加载HTML文档失败");
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

  // 搜索函数
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadDocuments(1);
      return;
    }
    
    setIsSearching(true);
    try {
      const searchResults = await searchHtmlDocuments(searchKeyword);
      setDocuments(searchResults);
      setTotalCount(searchResults.length);
      setCurrentPage(1);
    } catch (error) {
      console.error("搜索失败:", error);
      toast.error("搜索失败");
    } finally {
      setIsSearching(false);
    }
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchKeyword("");
    setSelectedCategory("all");
    loadDocuments(1);
  };

  // 删除文档
  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const success = await deleteHtmlDocument(id);
      if (success) {
        toast.success("删除成功");
        loadDocuments(currentPage);
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    } finally {
      setDeleting(null);
    }
  };

  // 计算总页数
  const totalPages = Math.ceil(totalCount / pageSize);

  // 生成分页数组
  const generatePaginationArray = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  useEffect(() => {
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
  }, [selectedCategory]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchKeyword.trim()) {
        handleSearch();
      } else {
        loadDocuments(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchKeyword]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">HTML文档管理</h1>
          <Badge variant="secondary" className="ml-2">
            {totalCount} 个文档
          </Badge>
        </div>
        <Link href="/dashboard/html-documents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新建文档
          </Button>
        </Link>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索标题或内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchKeyword && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center gap-2">
                  <DynamicIcon name={category.icon} size={14} loadedIcons={loadedIcons} />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchKeyword || (selectedCategory && selectedCategory !== "all")) && (
          <Button variant="outline" onClick={clearSearch}>
            <X className="mr-2 h-4 w-4" />
            清除筛选
          </Button>
        )}
      </div>

      {/* 文档列表 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px] max-w-[300px]">标题</TableHead>
                <TableHead className="min-w-[120px]">分类</TableHead>
                <TableHead className="min-w-[80px]">浏览量</TableHead>
                <TableHead className="min-w-[120px]">创建时间</TableHead>
                <TableHead className="min-w-[120px]">更新时间</TableHead>
                <TableHead className="min-w-[80px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchKeyword || selectedCategory ? "未找到匹配的文档" : "暂无HTML文档"}
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="max-w-[280px] truncate" title={doc.title}>
                      <Link 
                        href={`/html-documents/${doc.id}`}
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        {doc.title}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.category ? (
                      <Badge 
                        variant="secondary" 
                        className="whitespace-nowrap"
                        style={{ backgroundColor: doc.category.color + '20', color: doc.category.color }}
                      >
                        <DynamicIcon name={doc.category.icon} size={12} className="mr-1 shrink-0" loadedIcons={loadedIcons} />
                        <span className="truncate">{doc.category.name}</span>
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">无分类</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3 w-3 shrink-0" />
                      <span className="text-sm">{doc.view_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(doc.created_at), "yyyy-MM-dd HH:mm", {
                      locale: zhCN,
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(doc.updated_at), "yyyy-MM-dd HH:mm", {
                      locale: zhCN,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/dashboard/html-documents/${doc.id}`}>
                              <Button variant="ghost" size="sm">
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={deleting === doc.id}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    确定要删除文档 "{doc.title}" 吗？此操作不可撤销。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(doc.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    删除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent>删除</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      loadDocuments(currentPage - 1);
                    }
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {generatePaginationArray().map((page, index) => (
                <PaginationItem key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2">...</span>
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        loadDocuments(page as number);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      loadDocuments(currentPage + 1);
                    }
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}