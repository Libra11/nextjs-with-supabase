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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  HtmlCategory,
  CreateHtmlCategoryInput,
  UpdateHtmlCategoryInput,
} from "@/types/html-document";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getHtmlCategories,
  createHtmlCategory,
  updateHtmlCategory,
  deleteHtmlCategory,
} from "@/lib/html-document";
import { Edit, Trash2, Plus, ListFilter, Palette } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { icons } from "@/icons.config";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 动态图标组件
const DynamicIcon = ({
  name,
  size = 16,
  className = "",
  loadedIcons,
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
        flexShrink: 0,
      }}
    >
      <IconComponent
        style={{
          width: "100%",
          height: "100%",
          maxWidth: size,
          maxHeight: size,
        }}
      />
    </div>
  );
};

export default function HtmlCategoriesPage() {
  const [categories, setCategories] = useState<HtmlCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});

  // 对话框状态
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HtmlCategory | null>(
    null
  );

  // 表单数据
  const [formData, setFormData] = useState<CreateHtmlCategoryInput>({
    name: "",
    description: "",
    icon: "",
    color: "#6c757d",
    sort_order: 0,
  });

  // 常用颜色选项
  const colorOptions = [
    "#007bff",
    "#28a745",
    "#dc3545",
    "#ffc107",
    "#17a2b8",
    "#6c757d",
    "#343a40",
    "#f8f9fa",
    "#e83e8c",
    "#fd7e14",
  ];

  // 加载分类列表
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getHtmlCategories();
      setCategories(data);
    } catch (error) {
      console.error("加载分类失败:", error);
      toast.error("加载分类失败");
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      color: "#6c757d",
      sort_order: 0,
    });
  };

  // 打开创建对话框
  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (category: HtmlCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      color: category.color,
      sort_order: category.sort_order,
    });
    setIsEditOpen(true);
  };

  // 提交创建
  const handleSubmitCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入分类名称");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createHtmlCategory(formData);
      if (result) {
        toast.success("分类创建成功");
        setIsCreateOpen(false);
        resetForm();
        loadCategories();
      } else {
        toast.error("创建失败");
      }
    } catch (error) {
      console.error("创建失败:", error);
      toast.error("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 提交更新
  const handleSubmitUpdate = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error("请输入分类名称");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateHtmlCategory(editingCategory.id, formData);
      if (result) {
        toast.success("分类更新成功");
        setIsEditOpen(false);
        setEditingCategory(null);
        resetForm();
        loadCategories();
      } else {
        toast.error("更新失败");
      }
    } catch (error) {
      console.error("更新失败:", error);
      toast.error("更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 删除分类
  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const success = await deleteHtmlCategory(id);
      if (success) {
        toast.success("删除成功");
        loadCategories();
      } else {
        toast.error("删除失败，可能有卡片正在使用该分类");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    } finally {
      setDeleting(null);
    }
  };

  // 更新表单字段
  const updateFormField = (
    field: keyof CreateHtmlCategoryInput,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
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
  }, []);

  // 使用useCallback优化事件处理函数
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormField("name", e.target.value);
    },
    []
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormField("description", e.target.value);
    },
    []
  );

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormField("color", e.target.value);
    },
    []
  );

  const handleSortOrderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormField("sort_order", parseInt(e.target.value) || 0);
    },
    []
  );

  const handleColorSelect = useCallback((color: string) => {
    updateFormField("color", color);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingCategory(null);
  }, []);

  // 表单组件
  const CategoryForm = ({
    onSubmit,
    submitText,
  }: {
    onSubmit: () => void;
    submitText: string;
  }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">分类名称 *</Label>
        <Input
          id="name"
          placeholder="请输入分类名称"
          value={formData.name}
          onChange={handleNameChange}
        />
      </div>

      <div>
        <Label htmlFor="description">描述</Label>
        <Input
          id="description"
          placeholder="请输入分类描述"
          value={formData.description}
          onChange={handleDescriptionChange}
        />
      </div>

      <div>
        <Label htmlFor="icon">图标</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Select
              value={formData.icon}
              onValueChange={(value) => updateFormField("icon", value)}
            >
              <SelectTrigger className="flex-1">
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
            <div className="flex items-center justify-center w-10 h-10 border rounded bg-muted">
              <DynamicIcon
                name={formData.icon}
                size={18}
                loadedIcons={loadedIcons}
              />
            </div>
          </div>
          {formData.icon && loadedIcons[formData.icon] && (
            <div className="text-sm text-muted-foreground">
              预览:{" "}
              <DynamicIcon
                name={formData.icon}
                size={16}
                loadedIcons={loadedIcons}
                className="inline-block ml-1"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="color">颜色</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              id="color"
              type="text"
              placeholder="#6c757d"
              value={formData.color}
              onChange={handleColorChange}
              className="flex-1"
            />
            <div
              className="w-10 h-10 rounded border border-border"
              style={{ backgroundColor: formData.color }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color, index) => (
              <Button
                key={`color-${index}-${color}`}
                variant={formData.color === color ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
              >
                <span className="sr-only">{color}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="sort_order">排序</Label>
        <Input
          id="sort_order"
          type="number"
          placeholder="0"
          value={formData.sort_order}
          onChange={handleSortOrderChange}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleDialogClose}>
          取消
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? "保存中..." : submitText}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ListFilter className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">HTML分类管理</h1>
          <Badge variant="secondary" className="ml-2">
            {categories.length} 个分类
          </Badge>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              新建分类
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>新建分类</DialogTitle>
              <DialogDescription>创建一个新的知识卡片分类</DialogDescription>
            </DialogHeader>
            <CategoryForm onSubmit={handleSubmitCreate} submitText="创建分类" />
          </DialogContent>
        </Dialog>
      </div>

      {/* 分类列表 */}
      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>图标</TableHead>
                  <TableHead>颜色</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      暂无分类，点击右上角创建第一个分类
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <DynamicIcon
                            name={category.icon}
                            size={16}
                            loadedIcons={loadedIcons}
                          />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {category.description || "无描述"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {category.icon ? (
                          <div className="flex items-center gap-2">
                            <DynamicIcon
                              name={category.icon}
                              size={20}
                              loadedIcons={loadedIcons}
                            />
                            <span className="text-sm text-muted-foreground">
                              {category.icon}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">无</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-mono">
                            {category.color}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{category.sort_order}</TableCell>
                      <TableCell>
                        {format(new Date(category.created_at), "yyyy-MM-dd", {
                          locale: zhCN,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog
                            open={
                              isEditOpen && editingCategory?.id === category.id
                            }
                            onOpenChange={setIsEditOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>编辑分类</DialogTitle>
                                <DialogDescription>
                                  修改分类信息
                                </DialogDescription>
                              </DialogHeader>
                              <CategoryForm
                                onSubmit={handleSubmitUpdate}
                                submitText="保存更改"
                              />
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deleting === category.id}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除分类 "{category.name}"
                                  吗？如果有卡片正在使用该分类，删除将失败。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
