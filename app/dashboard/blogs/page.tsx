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
import { BlogWithTags } from "@/types/blog";
import { useEffect, useState } from "react";
import { getBlogs, deleteBlog, updateBlog } from "@/lib/blog";
import Link from "next/link";
import { Edit, Trash2, PinIcon } from "lucide-react";
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

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogWithTags[]>([]);
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const data = await getBlogs();
      setBlogs(data.blogs);
    } catch (error) {
      console.error("加载博客列表失败:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这篇博客吗？")) return;
    try {
      await deleteBlog(id);
      await loadBlogs();
    } catch (error) {
      console.error("删除博客失败:", error);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">博客管理</h1>
        <Link href="/dashboard/blogs/new">
          <Button>新建博客</Button>
        </Link>
      </div>

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
                        onClick={() => handleToggleTop(blog.id, blog.is_top)}
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
                  <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(blog.id)}
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
  );
}
