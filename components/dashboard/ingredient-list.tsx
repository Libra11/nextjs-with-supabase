/**
 * Author: Libra
 * Date: 2025-05-21 13:53:59
 * LastEditors: Libra
 * Description:
 */
"use client";

import { useState, useEffect } from "react";
import { Ingredient, IngredientCategory } from "@/types/recipe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, FileImage } from "lucide-react";
import {
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getAllIngredientCategories,
} from "@/lib/recipe-client";
import { useRouter } from "next/navigation";

interface IngredientListProps {
  initialIngredients: Ingredient[];
  categories: IngredientCategory[];
}

export default function IngredientList({
  initialIngredients,
  categories,
}: IngredientListProps) {
  const router = useRouter();
  const [ingredients, setIngredients] =
    useState<Ingredient[]>(initialIngredients);
  const [filteredIngredients, setFilteredIngredients] =
    useState<Ingredient[]>(initialIngredients);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [newIngredient, setNewIngredient] = useState<{
    name: string;
    icon: string;
    category: string | null;
  }>({
    name: "",
    icon: "",
    category: null,
  });

  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] =
    useState<Ingredient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 过滤配料列表
  useEffect(() => {
    let filtered = [...ingredients];

    // 应用搜索过滤
    if (searchTerm) {
      filtered = filtered.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 应用分类过滤
    if (categoryFilter) {
      filtered = filtered.filter(
        (ingredient) => ingredient.category_id === categoryFilter
      );
    }

    setFilteredIngredients(filtered);
  }, [ingredients, searchTerm, categoryFilter]);

  // 添加配料
  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await createIngredient({
        name: newIngredient.name.trim(),
        icon: newIngredient.icon.trim() || null,
        category_id: newIngredient.category,
      });

      if (created) {
        setIngredients((prev) => [...prev, created]);
        setNewIngredient({ name: "", icon: "", category: null });
        setIsAddDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating ingredient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 更新配料
  const handleUpdateIngredient = async () => {
    if (!editIngredient || !editIngredient.name.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await updateIngredient(editIngredient.id, {
        name: editIngredient.name.trim(),
        icon: editIngredient.icon?.trim() || null,
        category_id: editIngredient.category_id,
      });

      if (updated) {
        setIngredients((prev) =>
          prev.map((ing) => (ing.id === updated.id ? updated : ing))
        );
        setEditIngredient(null);
        setIsEditDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating ingredient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除配料
  const handleDeleteIngredient = async () => {
    if (!ingredientToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deleteIngredient(ingredientToDelete.id);

      if (success) {
        setIngredients((prev) =>
          prev.filter((ing) => ing.id !== ingredientToDelete.id)
        );
        setIngredientToDelete(null);
        setDeleteConfirmOpen(false);
        router.refresh();
      } else {
        alert("无法删除正在使用中的配料");
        setDeleteConfirmOpen(false);
      }
    } catch (error) {
      console.error("Error deleting ingredient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (ingredient: Ingredient) => {
    setEditIngredient({ ...ingredient });
    setIsEditDialogOpen(true);
  };

  const openDeleteConfirm = (ingredient: Ingredient) => {
    setIngredientToDelete(ingredient);
    setDeleteConfirmOpen(true);
  };

  // Find category name by id
  const getCategoryNameById = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>配料列表</CardTitle>
            <CardDescription>
              目前共有 {ingredients.length} 个配料
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                添加配料
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新配料</DialogTitle>
                <DialogDescription>
                  添加新的配料，可以指定分类和图标
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    配料名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="输入配料名称，如：盐、胡椒粉、洋葱"
                    value={newIngredient.name}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="category">
                    分类
                  </label>
                  <Select
                    value={newIngredient.category || "none"}
                    onValueChange={(value) =>
                      setNewIngredient({
                        ...newIngredient,
                        category: value === "none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无分类</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="icon">
                    图标URL (可选)
                  </label>
                  <Input
                    id="icon"
                    placeholder="输入图标URL链接"
                    value={newIngredient.icon}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        icon: e.target.value,
                      })
                    }
                  />
                  {newIngredient.icon && (
                    <div className="mt-2 relative h-10 w-10 overflow-hidden rounded-md">
                      <img
                        src={newIngredient.icon}
                        alt="图标预览"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/40?text=错误";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleAddIngredient}
                  disabled={!newIngredient.name.trim() || isSubmitting}
                >
                  {isSubmitting ? "添加中..." : "添加配料"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="搜索配料..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={categoryFilter || "none"}
              onValueChange={(value) => setCategoryFilter(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择分类过滤" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">全部分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter(null);
              }}
            >
              重置过滤
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">图标</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {searchTerm || categoryFilter
                      ? "没有符合筛选条件的配料"
                      : "暂无配料数据，请点击 添加配料 按钮创建"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell>
                      {ingredient.icon ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-md">
                          <img
                            src={ingredient.icon}
                            alt={ingredient.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/40?text=错误";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                          <FileImage className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {ingredient.name}
                    </TableCell>
                    <TableCell>
                      {ingredient.category_id ? (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                          {getCategoryNameById(ingredient.category_id)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">无分类</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(ingredient)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => openDeleteConfirm(ingredient)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑配料</DialogTitle>
            <DialogDescription>修改配料信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-name">
                配料名称 <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-name"
                placeholder="输入配料名称"
                value={editIngredient?.name || ""}
                onChange={(e) =>
                  setEditIngredient(
                    editIngredient
                      ? {
                          ...editIngredient,
                          name: e.target.value,
                        }
                      : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-category">
                分类
              </label>
              <Select
                value={editIngredient?.category_id || "none"}
                onValueChange={(value) =>
                  setEditIngredient(
                    editIngredient
                      ? {
                          ...editIngredient,
                          category_id: value === "none" ? null : value,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-icon">
                图标URL (可选)
              </label>
              <Input
                id="edit-icon"
                placeholder="输入图标URL链接"
                value={editIngredient?.icon || ""}
                onChange={(e) =>
                  setEditIngredient(
                    editIngredient
                      ? {
                          ...editIngredient,
                          icon: e.target.value,
                        }
                      : null
                  )
                }
              />
              {editIngredient?.icon && (
                <div className="mt-2 relative h-10 w-10 overflow-hidden rounded-md">
                  <img
                    src={editIngredient.icon}
                    alt={editIngredient.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/40?text=错误";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateIngredient}
              disabled={!editIngredient?.name.trim() || isSubmitting}
            >
              {isSubmitting ? "保存中..." : "保存更改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除配料 "{ingredientToDelete?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteIngredient();
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
