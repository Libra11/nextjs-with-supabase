/**
 * Problem Form Component for Creating/Editing LeetCode Problems
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateLeetCodeProblemInput,
  LeetCodeProblem,
  Difficulty,
} from "@/types/leetcode";
import { createProblem, updateProblem } from "@/lib/leetcode";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ProblemFormProps {
  initialData?: LeetCodeProblem;
  mode: "create" | "edit";
}

export function ProblemForm({ initialData, mode }: ProblemFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [leetcodeId, setLeetcodeId] = useState(
    initialData?.leetcode_id?.toString() || ""
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialData?.difficulty || "easy"
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [solution, setSolution] = useState(initialData?.solution || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [animationComponent, setAnimationComponent] = useState(
    initialData?.animation_component || ""
  );
  const [timeComplexity, setTimeComplexity] = useState(
    initialData?.time_complexity || ""
  );
  const [spaceComplexity, setSpaceComplexity] = useState(
    initialData?.space_complexity || ""
  );
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status || "draft");

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const input: CreateLeetCodeProblemInput = {
        title,
        leetcode_id: leetcodeId ? parseInt(leetcodeId) : undefined,
        difficulty,
        description,
        solution: solution || undefined,
        code: code || undefined,
        tags,
        animation_component: animationComponent || undefined,
        time_complexity: timeComplexity || undefined,
        space_complexity: spaceComplexity || undefined,
        status: status as any,
      };

      if (mode === "create") {
        await createProblem(input);
      } else if (initialData) {
        await updateProblem(initialData.id, input);
      }

      router.push("/dashboard/leetcode");
      router.refresh();
    } catch (error) {
      console.error("提交失败:", error);
      alert("操作失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">题目标题 *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="例如: 两数之和"
        />
      </div>

      {/* LeetCode ID & Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="leetcode_id">LeetCode 编号</Label>
          <Input
            id="leetcode_id"
            type="number"
            value={leetcodeId}
            onChange={(e) => setLeetcodeId(e.target.value)}
            placeholder="例如: 1"
          />
        </div>
        <div>
          <Label htmlFor="difficulty">难度 *</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">简单</SelectItem>
              <SelectItem value="medium">中等</SelectItem>
              <SelectItem value="hard">困难</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">题目描述 * (支持 Markdown)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={8}
          placeholder="输入题目描述，支持 Markdown 格式..."
        />
      </div>

      {/* Solution */}
      <div>
        <Label htmlFor="solution">题解 (支持 Markdown)</Label>
        <Textarea
          id="solution"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          rows={8}
          placeholder="输入题解内容，支持 Markdown 格式..."
        />
      </div>

      {/* Code */}
      <div>
        <Label htmlFor="code">示例代码</Label>
        <Textarea
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={8}
          placeholder="输入示例代码..."
          className="font-mono text-sm"
        />
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags">标签</Label>
        <div className="flex gap-2 mb-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="输入标签后按回车添加"
          />
          <Button type="button" onClick={handleAddTag}>
            添加
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveTag(tag)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* Animation Component */}
      <div>
        <Label htmlFor="animation_component">动画组件名称</Label>
        <Input
          id="animation_component"
          value={animationComponent}
          onChange={(e) => setAnimationComponent(e.target.value)}
          placeholder="例如: two-sum"
        />
        <p className="text-xs text-muted-foreground mt-1">
          对应 components/leetcode/animations/ 目录下的组件名
        </p>
      </div>

      {/* Complexity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="time_complexity">时间复杂度</Label>
          <Input
            id="time_complexity"
            value={timeComplexity}
            onChange={(e) => setTimeComplexity(e.target.value)}
            placeholder="例如: O(n)"
          />
        </div>
        <div>
          <Label htmlFor="space_complexity">空间复杂度</Label>
          <Input
            id="space_complexity"
            value={spaceComplexity}
            onChange={(e) => setSpaceComplexity(e.target.value)}
            placeholder="例如: O(1)"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="status">状态 *</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "published")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "提交中..." : mode === "create" ? "创建题目" : "更新题目"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
