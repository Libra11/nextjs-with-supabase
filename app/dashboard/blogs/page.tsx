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
import { getBlogs, deleteBlog } from "@/lib/blog";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogWithTags[]>([]);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const data = await getBlogs();
      setBlogs(data);
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
            <TableHead>状态</TableHead>
            <TableHead>标签</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>更新时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blogs.map((blog) => (
            <TableRow key={blog.id}>
              <TableCell className="font-medium">{blog.title}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    blog.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {blog.status === "published" ? "已发布" : "草稿"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(blog.created_at), "yyyy-MM-dd HH:mm", {
                  locale: zhCN,
                })}
              </TableCell>
              <TableCell>
                {format(new Date(blog.updated_at), "yyyy-MM-dd HH:mm", {
                  locale: zhCN,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
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
