/**
 * Author: Libra
 * Date: 2025-03-07 17:53:19
 * LastEditors: Libra
 * Description:
 */
"use client";

import { BlogForm } from "@/components/blog-form";
import { CreateBlogInput, UpdateBlogInput } from "@/types/blog";
import { createBlog, getTags, createTag } from "@/lib/blog";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Upload, AlertCircle, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProcessedFile {
  name: string;
  content: string;
  folder: string;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
}

export default function NewBlogPage() {
  const router = useRouter();
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (data: CreateBlogInput | UpdateBlogInput) => {
    try {
      await createBlog(data as CreateBlogInput);
      router.push("/dashboard/blogs");
    } catch (error) {
      console.error("创建博客失败:", error);
    }
  };

  const handleFolderSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const processedFiles: ProcessedFile[] = [];

    // 将FileList转换为数组进行操作
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // 只处理markdown文件
      if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
        // 获取文件的路径结构
        const path = file.webkitRelativePath || "";
        const pathParts = path.split("/");

        // 至少应该有文件夹和文件名两部分
        if (pathParts.length >= 2) {
          const folderName = pathParts[pathParts.length - 2]; // 获取直接父文件夹名称
          const fileName = file.name.replace(/\.(md|markdown)$/, ""); // 去掉扩展名作为标题

          // 读取文件内容
          const content = await file.text();

          processedFiles.push({
            name: fileName,
            content,
            folder: folderName,
            status: "pending",
          });
        }
      }
    }

    setFiles(processedFiles);
  };

  const extractDescription = (content: string): string => {
    // 从Markdown内容提取前200个字符作为描述
    const withoutHeaders = content.replace(/^#.*$/gm, "").trim();
    const withoutMarkdown = withoutHeaders.replace(/[*_~`#]+/g, "");
    return withoutMarkdown.substring(0, 200);
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    // 获取所有标签，用于标签匹配
    const existingTags = await getTags();

    // 创建标签ID映射表
    const tagNameToId: Record<string, number> = {};
    existingTags.forEach((tag) => {
      tagNameToId[tag.name.toLowerCase()] = tag.id;
    });

    // 处理每个文件
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const file = updatedFiles[i];
      file.status = "processing";
      setFiles([...updatedFiles]);

      try {
        // 确保文件夹名称存在对应的标签，如果不存在则创建
        let tagId: number;
        const folderLower = file.folder.toLowerCase();

        if (tagNameToId[folderLower]) {
          tagId = tagNameToId[folderLower];
        } else {
          // 创建新标签
          const newTag = await createTag(file.folder);
          tagId = newTag.id;
          tagNameToId[folderLower] = tagId; // 更新映射
        }

        // 创建博客
        await createBlog({
          title: file.name,
          description: extractDescription(file.content),
          content: file.content,
          status: "published", // 默认发布
          tags: [tagId], // 使用文件夹名作为标签
          is_top: false,
        });

        // 更新状态
        file.status = "success";
        file.message = "导入成功";
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error);
        file.status = "error";
        file.message = error instanceof Error ? error.message : "未知错误";
      }

      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新建博客</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="single">单篇创建</TabsTrigger>
          <TabsTrigger value="batch">批量导入</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <BlogForm onSubmit={handleSubmit} />
        </TabsContent>

        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>批量导入 Markdown 文件</CardTitle>
              <CardDescription>
                选择一个包含 Markdown
                文件的文件夹，文件名将用作博客标题，文件内容作为博客内容，
                父文件夹名称将用作博客标签。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    选择文件夹
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      // @ts-ignore webkitdirectory属性在标准DOM类型中不存在，但在浏览器中可用
                      webkitdirectory=""
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={handleFolderSelect}
                      disabled={isProcessing}
                      variant="outline"
                      className="gap-2"
                    >
                      <FolderOpen className="h-4 w-4" />
                      选择文件夹
                    </Button>
                    <Button
                      onClick={processFiles}
                      disabled={files.length === 0 || isProcessing}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      导入文件
                    </Button>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">
                      文件列表 ({files.length})
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-md flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <FolderOpen className="h-3 w-3" />
                              <span>{file.folder}</span>
                            </div>
                          </div>
                          <div>
                            {file.status === "pending" && (
                              <Badge variant="outline">待处理</Badge>
                            )}
                            {file.status === "processing" && (
                              <Badge
                                variant="secondary"
                                className="animate-pulse"
                              >
                                处理中...
                              </Badge>
                            )}
                            {file.status === "success" && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                成功
                              </Badge>
                            )}
                            {file.status === "error" && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                失败
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {files.length > 0 &&
                  files.some((f) => f.status === "success") && (
                    <div className="mt-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-900">
                      <div className="flex gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-800 dark:text-green-300">
                            导入成功
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            成功导入{" "}
                            {files.filter((f) => f.status === "success").length}{" "}
                            篇博客。
                            <Button
                              variant="link"
                              className="p-0 h-auto"
                              onClick={() => router.push("/dashboard/blogs")}
                            >
                              查看博客列表
                            </Button>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {files.length > 0 &&
                  files.some((f) => f.status === "error") && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-900">
                      <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800 dark:text-red-300">
                            导入失败
                          </h4>
                          <p className="text-sm text-red-700 dark:text-red-400">
                            有{" "}
                            {files.filter((f) => f.status === "error").length}{" "}
                            篇博客导入失败， 请检查文件内容或重试。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/blogs")}
              >
                返回博客列表
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
