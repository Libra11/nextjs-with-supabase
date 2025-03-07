/**
 * Author: Libra
 * Date: 2025-03-07 17:53:07
 * LastEditors: Libra
 * Description:
 */
"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BlogWithTags,
  CreateBlogInput,
  Tag,
  UpdateBlogInput,
} from "@/types/blog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MultiSelect } from "@/components/ui/multi-select";
import { useEffect, useState } from "react";
import { getTags } from "@/lib/blog";

const formSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  content: z.string().min(1, "内容不能为空"),
  status: z.enum(["draft", "published"]),
  cover_image: z.string().optional(),
  tags: z.array(z.number()),
});

interface BlogFormProps {
  initialData?: BlogWithTags;
  onSubmit: (data: CreateBlogInput | UpdateBlogInput) => Promise<void>;
}

export function BlogForm({ initialData, onSubmit }: BlogFormProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      status: initialData?.status || "draft",
      cover_image: initialData?.cover_image || "",
      tags: initialData?.tags?.map((tag) => tag.id) || [],
    },
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setIsLoading(true);
      const data = await getTags();
      setTags(data || []);
    } catch (error) {
      console.error("加载标签失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await onSubmit({
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
    } catch (error) {
      console.error("提交表单失败:", error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标题</FormLabel>
              <FormControl>
                <Input placeholder="请输入博客标题" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>内容</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入博客内容"
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cover_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>封面图片</FormLabel>
              <FormControl>
                <Input placeholder="请输入封面图片URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>状态</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="published">发布</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标签</FormLabel>
              <FormControl>
                <MultiSelect
                  selected={field.value}
                  options={tags.map((tag) => ({
                    value: tag.id,
                    label: tag.name,
                  }))}
                  onChange={field.onChange}
                  placeholder="选择标签"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {initialData ? "更新博客" : "创建博客"}
        </Button>
      </form>
    </Form>
  );
}
