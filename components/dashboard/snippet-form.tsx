/**
 * Author: Libra
 * Date: 2025-04-09
 * LastEditors: Libra
 * Description: 代码片段表单组件
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "@/types/blog";
import { SnippetWithTags } from "@/types/snippet";
import { useToast } from "@/components/ui/use-toast";
import MarkdownContent from "@/components/markdown-content";
import { Loader2 } from "lucide-react";
import { createSnippet, updateSnippet } from "@/lib/snippet";

// 表单验证schema
const formSchema = z.object({
  content: z.string().min(1, {
    message: "代码片段内容不能为空",
  }),
  tags: z.array(z.number()).optional(),
});

interface SnippetFormProps {
  tags: Tag[];
  snippet?: SnippetWithTags;
  selectedTags?: number[];
  isEditing?: boolean;
}

export default function SnippetForm({
  tags,
  snippet,
  selectedTags = [],
  isEditing = false,
}: SnippetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");

  // 默认值
  const defaultValues = {
    content: snippet?.content || "",
    tags: selectedTags,
  };

  // 表单初始化
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // 提交表单
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      let result;

      if (isEditing && snippet) {
        // 调用更新方法
        result = await updateSnippet(snippet.id, values);
      } else {
        // 调用创建方法
        result = await createSnippet(values);
      }

      toast({
        title: isEditing ? "更新成功" : "创建成功",
        description: "代码片段已保存",
      });

      // 跳转到片段详情页
      router.push(`/dashboard/snippets/${result.id}`);
      router.refresh();
    } catch (error) {
      console.error("提交表单失败:", error);
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const content = form.watch("content");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* 内容编辑区 */}
          <div className="space-y-2">
            <Tabs
              defaultValue="write"
              value={previewTab}
              onValueChange={(value) =>
                setPreviewTab(value as "write" | "preview")
              }
              className="w-full"
            >
              <TabsList className="mb-2">
                <TabsTrigger value="write">编写</TabsTrigger>
                <TabsTrigger value="preview">预览</TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="mt-0">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>内容</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="输入代码片段内容，支持 Markdown 格式..."
                          className="font-mono h-[400px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-0">
                <div className="border rounded-md p-4 h-[400px] overflow-y-auto bg-card">
                  <MarkdownContent content={content} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 标签选择 */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标签</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant={
                        field.value?.includes(tag.id) ? "default" : "outline"
                      }
                      size="sm"
                      className="h-8"
                      style={{
                        backgroundColor: field.value?.includes(tag.id)
                          ? tag.color || undefined
                          : undefined,
                        borderColor: tag.color || undefined,
                        color: field.value?.includes(tag.id)
                          ? "#fff"
                          : tag.color || undefined,
                      }}
                      onClick={() => {
                        const currentTags = field.value || [];
                        const newTags = currentTags.includes(tag.id)
                          ? currentTags.filter((id) => id !== tag.id)
                          : [...currentTags, tag.id];
                        field.onChange(newTags);
                      }}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "更新片段" : "创建片段"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
