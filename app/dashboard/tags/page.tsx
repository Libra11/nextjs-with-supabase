/**
 * Author: Libra
 * Date: 2025-03-10 11:35:56
 * LastEditors: Libra
 * Description:
 */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTags, createTag, updateTag, deleteTag } from "@/lib/blog";
import { Tag } from "@/types/blog";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { icons } from "@/icons.config";
import React from "react";
import { TagBadge } from "@/components/ui/tag-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { PencilIcon, TrashIcon } from "lucide-react";

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6c757d");
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});

  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [editTagIcon, setEditTagIcon] = useState("");

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  useEffect(() => {
    loadTags();
    Promise.all(
      Object.entries(icons).map(async ([name, importFn]: any) => {
        const icon = await importFn();
        return [name, icon.default] as const;
      })
    ).then((loadedPairs) => {
      setLoadedIcons(Object.fromEntries(loadedPairs));
    });
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
    if (!newTagName.trim() || !selectedIcon) return;

    setLoading(true);
    try {
      await createTag(newTagName.trim(), selectedColor, selectedIcon);
      setNewTagName("");
      await loadTags();
      router.refresh();
    } catch (error) {
      console.error("创建标签失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagColor(tag.color || "#6c757d");
    setEditTagIcon(tag.icon_name || "");
    setIsEditMode(true);
  };

  const closeEditDialog = () => {
    setIsEditMode(false);
    setEditingTag(null);
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;
    if (!editTagName.trim() || !editTagIcon) return;

    setLoading(true);
    try {
      await updateTag(
        editingTag.id,
        editTagName.trim(),
        editTagColor,
        editTagIcon
      );
      await loadTags();
      closeEditDialog();
      router.refresh();
    } catch (error) {
      console.error("更新标签失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTagToDelete(null);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    setLoading(true);
    try {
      await deleteTag(tagToDelete.id);
      await loadTags();
      closeDeleteDialog();
      router.refresh();
    } catch (error) {
      console.error("删除标签失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTagPreview = (name: string, color: string, iconName: string) => {
    if (!iconName || !loadedIcons[iconName]) return null;

    return <TagBadge name={name} icon_name={iconName} color={color} />;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">标签管理</h1>

      <form onSubmit={handleCreateTag} className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium mb-1">标签名称</label>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="输入新标签名称"
            />
          </div>

          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium mb-1">标签颜色</label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                placeholder="#RRGGBB"
                className="flex-1"
              />
            </div>
          </div>

          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium mb-1">标签图标</label>
            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
              <SelectTrigger>
                <SelectValue placeholder="选择图标" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectGroup>
                  {Object.entries(loadedIcons).map(
                    ([iconName, IconComponent]) => (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center">
                          <div className="w-6 h-6 mr-2 flex items-center justify-center">
                            <IconComponent />
                          </div>
                          {iconName}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !newTagName.trim() || !selectedIcon}
        >
          添加标签
        </Button>
      </form>

      {/* 预览选中的图标和颜色 */}
      {selectedIcon && loadedIcons[selectedIcon] && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">预览:</h3>
          {renderTagPreview(newTagName, selectedColor, selectedIcon)}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">已有标签</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/10 transition-colors"
            >
              <TagBadge
                name={tag.name}
                icon_name={tag.icon_name || ""}
                color={tag.color || "#6c757d"}
              />

              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(tag)}
                        className="h-8 w-8"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>编辑标签</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(tag)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>删除标签</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-4">
              暂无标签，请添加一些标签
            </p>
          )}
        </div>
      </div>

      {/* 编辑标签对话框 */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
            <DialogDescription>修改标签的名称、颜色和图标</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">标签名称</label>
              <Input
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                placeholder="输入标签名称"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">标签颜色</label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  placeholder="#RRGGBB"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">标签图标</label>
              <Select value={editTagIcon} onValueChange={setEditTagIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="选择图标" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectGroup>
                    {Object.entries(loadedIcons).map(
                      ([iconName, IconComponent]) => (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center">
                            <div className="w-6 h-6 mr-2 flex items-center justify-center">
                              <IconComponent />
                            </div>
                            {iconName}
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* 预览 */}
            {editTagIcon && loadedIcons[editTagIcon] && (
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-2">预览:</h3>
                {renderTagPreview(editTagName, editTagColor, editTagIcon)}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              取消
            </Button>
            <Button
              onClick={handleUpdateTag}
              disabled={loading || !editTagName.trim() || !editTagIcon}
            >
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除标签"{tagToDelete?.name}
              "吗？此操作不可撤销，并且会从所有使用此标签的博客中移除该标签。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
