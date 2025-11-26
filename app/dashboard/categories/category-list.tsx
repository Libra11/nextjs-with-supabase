"use client";

import { useState } from "react";
import { RecipeCategory } from "@/types/recipe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getAllCategories 
} from "@/lib/recipe-client";
import { useRouter } from "next/navigation";

interface CategoryListProps {
  initialCategories: RecipeCategory[];
}

export default function CategoryList({ initialCategories }: CategoryListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<RecipeCategory[]>(initialCategories);
  const [newCategory, setNewCategory] = useState<{name: string; description: string}>({
    name: "",
    description: "",
  });
  const [editCategory, setEditCategory] = useState<RecipeCategory | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<RecipeCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const created = await createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || null,
      });
      
      if (created) {
        setCategories((prev) => [...prev, created]);
        setNewCategory({ name: "", description: "" });
        setIsAddDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCategory || !editCategory.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const updated = await updateCategory(editCategory.id, {
        name: editCategory.name.trim(),
        description: editCategory.description?.trim() || null,
      });
      
      if (updated) {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === updated.id ? updated : cat))
        );
        setEditCategory(null);
        setIsEditDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsSubmitting(true);
    try {
      const success = await deleteCategory(categoryToDelete.id);
      
      if (success) {
        setCategories((prev) => 
          prev.filter((cat) => cat.id !== categoryToDelete.id)
        );
        setCategoryToDelete(null);
        setDeleteConfirmOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (category: RecipeCategory) => {
    setEditCategory({ ...category });
    setIsEditDialogOpen(true);
  };

  const openDeleteConfirm = (category: RecipeCategory) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const refreshCategories = async () => {
    const refreshedCategories = await getAllCategories();
    setCategories(refreshedCategories);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>分类列表</CardTitle>
            <CardDescription>
              目前共有 {categories.length} 个分类
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                新增分类
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增分类</DialogTitle>
                <DialogDescription>
                  创建新的菜谱分类，便于整理和检索菜谱
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    分类名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="输入分类名称"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="description">
                    描述 (可选)
                  </label>
                  <Textarea
                    id="description"
                    placeholder="输入分类描述"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
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
                  onClick={handleAddCategory} 
                  disabled={!newCategory.name.trim() || isSubmitting}
                >
                  {isSubmitting ? "创建中..." : "创建分类"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">分类名称</TableHead>
                <TableHead className="w-auto">描述</TableHead>
                <TableHead className="w-[120px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    暂无分类数据，请点击"新增分类"按钮创建
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || "无描述"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => openDeleteConfirm(category)}
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
        <CardFooter className="border-t bg-muted/30 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCategories}
            className="ml-auto"
          >
            刷新列表
          </Button>
        </CardFooter>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>
              修改现有菜谱分类的信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-name">
                分类名称 <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-name"
                placeholder="输入分类名称"
                value={editCategory?.name || ""}
                onChange={(e) =>
                  setEditCategory(editCategory ? {
                    ...editCategory,
                    name: e.target.value
                  } : null)
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-description">
                描述 (可选)
              </label>
              <Textarea
                id="edit-description"
                placeholder="输入分类描述"
                value={editCategory?.description || ""}
                onChange={(e) =>
                  setEditCategory(editCategory ? {
                    ...editCategory,
                    description: e.target.value
                  } : null)
                }
                rows={3}
              />
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
              onClick={handleUpdateCategory}
              disabled={!editCategory?.name.trim() || isSubmitting}
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
              您确定要删除分类 "{categoryToDelete?.name}" 吗？此操作无法撤销，
              删除后将从所有使用此分类的菜谱中移除关联。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCategory();
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