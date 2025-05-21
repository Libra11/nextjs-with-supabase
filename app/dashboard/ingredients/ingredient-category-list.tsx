"use client";

import { useState, useEffect } from "react";
import { IngredientCategory } from "@/types/recipe";
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
import { Plus, Pencil, Trash2, FileImage } from "lucide-react";
import { 
  createIngredientCategory, 
  updateIngredientCategory, 
  deleteIngredientCategory, 
  getAllIngredientCategories,
  getIngredientsByCategory
} from "@/lib/recipe-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface IngredientCategoryListProps {
  initialCategories: IngredientCategory[];
}

export default function IngredientCategoryList({ initialCategories }: IngredientCategoryListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<IngredientCategory[]>(initialCategories);
  const [newCategory, setNewCategory] = useState<{name: string; description: string; icon: string}>({
    name: "",
    description: "",
    icon: "",
  });
  const [editCategory, setEditCategory] = useState<IngredientCategory | null>(null);
  const [originalCategoryName, setOriginalCategoryName] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<IngredientCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryItemCounts, setCategoryItemCounts] = useState<Record<string, number>>({});

  // 获取每个分类下的配料数量
  const loadCategoryItemCounts = async () => {
    const counts: Record<string, number> = {};
    
    await Promise.all(categories.map(async (category) => {
      const items = await getIngredientsByCategory(category.id);
      counts[category.id] = items.length;
    }));
    
    setCategoryItemCounts(counts);
  };
  
  // 在分类加载后获取项目数量
  useEffect(() => {
    loadCategoryItemCounts();
  }, [categories]);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const created = await createIngredientCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || null,
        icon: newCategory.icon.trim() || null,
      });
      
      if (created) {
        setCategories((prev) => [...prev, created]);
        setNewCategory({ name: "", description: "", icon: "" });
        setIsAddDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating ingredient category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCategory || !editCategory.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const updated = await updateIngredientCategory(originalCategoryName, {
        name: editCategory.name.trim(),
        description: editCategory.description?.trim() || null,
        icon: editCategory.icon?.trim() || null,
      });
      
      if (updated) {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === originalCategoryName ? updated : cat))
        );
        setEditCategory(null);
        setIsEditDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating ingredient category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsSubmitting(true);
    try {
      const success = await deleteIngredientCategory(categoryToDelete.id);
      
      if (success) {
        setCategories((prev) => 
          prev.filter((cat) => cat.id !== categoryToDelete.id)
        );
        setCategoryToDelete(null);
        setDeleteConfirmOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting ingredient category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (category: IngredientCategory) => {
    setEditCategory({ ...category });
    setOriginalCategoryName(category.id); // 保存原始名称以供更新时使用
    setIsEditDialogOpen(true);
  };

  const openDeleteConfirm = (category: IngredientCategory) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const refreshCategories = async () => {
    const refreshedCategories = await getAllIngredientCategories();
    setCategories(refreshedCategories);
    await loadCategoryItemCounts();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>调料分类列表</CardTitle>
            <CardDescription>
              目前共有 {categories.length} 个调料分类
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
                <DialogTitle>新增调料分类</DialogTitle>
                <DialogDescription>
                  创建新的调料分类，便于管理和选择食材
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    分类名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="输入分类名称，例如：蔬菜、肉类、调味料"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="icon">
                    图标URL (可选)
                  </label>
                  <Input
                    id="icon"
                    placeholder="输入图标URL链接"
                    value={newCategory.icon}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, icon: e.target.value })
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
                <TableHead className="w-[100px]">图标</TableHead>
                <TableHead className="w-[180px]">分类名称</TableHead>
                <TableHead className="w-[80px] text-center">项目数</TableHead>
                <TableHead className="w-auto">描述</TableHead>
                <TableHead className="w-[120px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    暂无调料分类数据，请点击"新增分类"按钮创建
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.icon ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-md">
                          <img
                            src={category.icon}
                            alt={category.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/40?text=错误";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                          <FileImage className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm bg-muted/50 rounded-full px-2 py-0.5 inline-block">
                        {categoryItemCounts[category.id] || 0}
                      </div>
                    </TableCell>
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
            <DialogTitle>编辑调料分类</DialogTitle>
            <DialogDescription>
              修改现有调料分类的信息，将会更新所有使用此分类的配料
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
              <label className="text-sm font-medium" htmlFor="edit-icon">
                图标URL (可选)
              </label>
              <Input
                id="edit-icon"
                placeholder="输入图标URL链接"
                value={editCategory?.icon || ""}
                onChange={(e) =>
                  setEditCategory(editCategory ? {
                    ...editCategory,
                    icon: e.target.value
                  } : null)
                }
              />
              {editCategory?.icon && (
                <div className="mt-2 relative h-10 w-10 overflow-hidden rounded-md">
                  <img
                    src={editCategory.icon}
                    alt={editCategory.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/40?text=错误";
                    }}
                  />
                </div>
              )}
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
              将会清除使用此分类的所有配料的分类信息（配料本身不会被删除）。
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