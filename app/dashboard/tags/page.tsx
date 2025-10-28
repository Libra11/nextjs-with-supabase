/**
 * Author: Libra
 * Date: 2025-03-10 11:35:56
 * LastEditors: Libra
 * Description:
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagBadge } from "@/components/ui/tag-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import { getTags, createTag, updateTag, deleteTag } from "@/lib/blog";
import { Tag } from "@/types/blog";
import { icons } from "@/icons.config";

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6c757d");
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [editTagIcon, setEditTagIcon] = useState("");

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

  const handleCreateTag = async (e: FormEvent<HTMLFormElement>) => {
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

  const renderTagPreview = (
    name: string,
    color: string,
    iconName: string,
    className?: string
  ) => (
    <TagBadge
      name={name || "未命名标签"}
      icon_name={iconName || ""}
      color={color || "#6c757d"}
      className={`text-sm font-medium ${className ?? ""}`}
    />
  );

  const iconOptions = useMemo(
    () =>
      Object.entries(loadedIcons).sort(([a], [b]) =>
        a.localeCompare(b, "zh-CN")
      ),
    [loadedIcons]
  );

  const sortedTags = useMemo(
    () =>
      [...tags].sort((a, b) =>
        a.name.localeCompare(b.name, "zh-CN", { sensitivity: "base" })
      ),
    [tags]
  );

  const uniqueIconCount = useMemo(() => {
    const iconSet = new Set<string>();
    tags.forEach((tag) => {
      if (tag.icon_name) {
        iconSet.add(tag.icon_name);
      }
    });
    return iconSet.size;
  }, [tags]);

  const colorPaletteSize = useMemo(() => {
    const colorSet = new Set<string>();
    tags.forEach((tag) => {
      if (tag.color) {
        colorSet.add(tag.color.toLowerCase());
      }
    });
    return colorSet.size;
  }, [tags]);

  const accentColors = useMemo(() => {
    const palette = new Set<string>();
    tags.forEach((tag) => {
      if (tag.color) {
        palette.add(tag.color);
      }
    });
    return Array.from(palette).slice(0, 5);
  }, [tags]);

  const iconCoverage = useMemo(() => {
    if (!tags.length) return 0;
    const withoutIcon = tags.filter((tag) => !tag.icon_name).length;
    return Math.round(((tags.length - withoutIcon) / tags.length) * 100);
  }, [tags]);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/80 p-8 shadow-lg backdrop-blur">
        <div className="absolute -left-28 top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10 space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <Badge className="w-fit border border-primary/20 bg-primary/10 text-primary">
                标签面板
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  标签管理
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                  统一管理博客标签，为内容分类提供更出色的体验。借助色彩与图标，打造更具识别度的内容体系。
                </p>
              </div>
            </div>

            {sortedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-border/40 bg-background/80 p-4 shadow-sm backdrop-blur">
                {sortedTags.slice(0, 3).map((tag) => (
                  <TagBadge
                    key={tag.id}
                    name={tag.name}
                    icon_name={tag.icon_name || ""}
                    color={tag.color || "#6c757d"}
                    className="text-xs font-medium backdrop-blur"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/30 bg-background/80 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                总标签
              </p>
              <p className="mt-3 text-3xl font-bold text-foreground">
                {tags.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                目前可用的标签数量
              </p>
            </div>

            <div className="rounded-2xl border border-border/30 bg-background/80 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                图标覆盖率
              </p>
              <p className="mt-3 text-3xl font-bold text-foreground">
                {iconCoverage}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                拥有图标的标签占比
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                已选图标 {uniqueIconCount} 个
              </p>
            </div>

            <div className="rounded-2xl border border-border/30 bg-background/80 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                色彩搭配
              </p>
              <p className="mt-3 text-3xl font-bold text-foreground">
                {colorPaletteSize}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {accentColors.length > 0 ? (
                  accentColors.map((color) => (
                    <span
                      key={color}
                      className="h-5 w-5 rounded-full border border-border/60 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    暂无自定义色彩
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-border/40 bg-card/80 shadow-lg backdrop-blur">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold">创建新标签</CardTitle>
          <CardDescription>
            设置名称、颜色和图标，让标签在博客列表中脱颖而出。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateTag}
            className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  标签名称
                </label>
                <div className="space-y-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="输入新标签名称"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    推荐使用 2-6 个字，方便快速识别。
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  标签颜色
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/80 p-2">
                  <Input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border/60 bg-transparent p-1"
                  />
                  <Input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="#RRGGBB"
                    className="h-10 flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  支持自定义十六进制颜色，建议与博客主题协调。
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  标签图标
                </label>
                <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="选择图标" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectGroup>
                      {iconOptions.map(([iconName, IconComponent]) => (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/80">
                              <IconComponent />
                            </div>
                            <span className="text-sm font-medium">
                              {iconName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  选择一个与标签含义贴近的图标，提升识别度。
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !newTagName.trim() || !selectedIcon}
                className="h-11 w-full justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition hover:shadow-md disabled:opacity-60 lg:w-auto"
              >
                添加标签
              </Button>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border/50 bg-muted/10 p-6">
              <div>
                <p className="text-sm font-medium text-foreground">实时预览</p>
                <p className="text-xs text-muted-foreground">
                  根据当前设置预览标签样式。
                </p>
              </div>

              <div className="flex-1">
                {selectedIcon ? (
                  <div className="space-y-3 rounded-xl border border-border/40 bg-background/90 p-5 shadow-inner">
                    {renderTagPreview(
                      newTagName || "新标签",
                      selectedColor,
                      selectedIcon,
                      "text-base px-4 py-2 shadow-sm"
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1">
                        <span
                          className="h-3 w-3 rounded-full border border-border/60"
                          style={{ backgroundColor: selectedColor }}
                        />
                        {selectedColor.toUpperCase()}
                      </span>
                      <Badge className="rounded-full border border-primary/30 bg-primary/10 text-xs text-primary">
                        {selectedIcon}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[140px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/60 text-xs text-muted-foreground">
                    选择图标后将显示实时预览
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/80 shadow-lg backdrop-blur">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold">已有标签</CardTitle>
          <CardDescription>
            查看并管理已创建的标签，保持内容分类一致。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTags.length > 0 ? (
            <TooltipProvider delayDuration={200}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedTags.map((tag) => {
                  const color = tag.color || "#6c757d";
                  return (
                    <div
                      key={tag.id}
                      className="group flex flex-col gap-4 rounded-2xl border border-border/30 bg-background/80 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-3">
                          {renderTagPreview(
                            tag.name,
                            color,
                            tag.icon_name || "",
                            "text-sm font-semibold px-3 py-1.5 shadow-sm"
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/70 px-3 py-1">
                              <span
                                className="h-3 w-3 rounded-full border border-border/60"
                                style={{ backgroundColor: color }}
                              />
                              {color.toUpperCase()}
                            </span>
                            {tag.icon_name ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/70 px-3 py-1">
                                <span className="text-muted-foreground">
                                  图标
                                </span>
                                <span className="font-medium text-foreground">
                                  {tag.icon_name}
                                </span>
                              </span>
                            ) : (
                              <span className="italic text-muted-foreground">
                                暂无图标
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(tag)}
                                className="h-9 w-9 rounded-full border border-transparent transition hover:border-primary/40"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>编辑标签</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(tag)}
                                className="h-9 w-9 rounded-full border border-transparent text-destructive transition hover:border-destructive/40 hover:text-destructive"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>删除标签</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/10 p-10 text-center text-sm text-muted-foreground">
              暂无标签，请使用上方表单创建。
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="border border-border/40 bg-card/95">
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
            <DialogDescription>
              修改标签的名称、颜色和图标，让内容保持一致。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                标签名称
              </label>
              <Input
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                placeholder="输入标签名称"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                标签颜色
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/80 p-2">
                <Input
                  type="color"
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border/60 bg-transparent p-1"
                />
                <Input
                  type="text"
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  placeholder="#RRGGBB"
                  className="h-10 flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                标签图标
              </label>
              <Select value={editTagIcon} onValueChange={setEditTagIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="选择图标" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectGroup>
                    {iconOptions.map(([iconName, IconComponent]) => (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/80">
                            <IconComponent />
                          </div>
                          <span className="text-sm font-medium">
                            {iconName}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">实时预览</p>
              <div className="mt-3">
                {editTagIcon ? (
                  <div className="space-y-3 rounded-xl border border-border/40 bg-background/90 p-4 shadow-inner">
                    {renderTagPreview(
                      editTagName || "标签名称",
                      editTagColor,
                      editTagIcon,
                      "text-base px-4 py-2 shadow-sm"
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1">
                        <span
                          className="h-3 w-3 rounded-full border border-border/60"
                          style={{ backgroundColor: editTagColor }}
                        />
                        {editTagColor.toUpperCase()}
                      </span>
                      <Badge className="rounded-full border border-primary/30 bg-primary/10 text-xs text-primary">
                        {editTagIcon}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/60 text-xs text-muted-foreground">
                    选择图标后将显示预览
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="space-y-2 sm:space-y-0">
            <Button variant="outline" onClick={closeEditDialog}>
              取消
            </Button>
            <Button
              onClick={handleUpdateTag}
              disabled={loading || !editTagName.trim() || !editTagIcon}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border border-border/40 bg-card/95">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除标签 &quot;{tagToDelete?.name}&quot; 吗？此操作不可撤销，
              并且会从所有使用此标签的博客中移除该标签。
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
