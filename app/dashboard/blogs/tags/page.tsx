"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTags, createTag } from "@/lib/blog";
import { Tag } from "@/types/blog";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { BlogNav } from "@/components/blog-nav";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (error) {
      console.error("加载标签失败:", error);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setLoading(true);
    try {
      await createTag(newTagName.trim());
      setNewTagName("");
      await loadTags();
    } catch (error) {
      console.error("创建标签失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <BlogNav />
      <h1 className="text-2xl font-bold">标签管理</h1>

      <form onSubmit={handleCreateTag} className="flex gap-2">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="输入新标签名称"
          className="max-w-xs"
        />
        <Button type="submit" disabled={loading || !newTagName.trim()}>
          添加标签
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 mt-4">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2"
          >
            <span>{tag.name}</span>
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-muted-foreground">暂无标签，请添加一些标签</p>
        )}
      </div>
    </div>
  );
}
