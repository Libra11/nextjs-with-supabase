import { getAllCategories } from '@/lib/recipe';
import CategoryList from './category-list';

export default async function CategoriesPage() {
  const categories = await getAllCategories();
  
  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            分类管理
          </span>
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        管理菜谱的分类标签，包括新增、编辑和删除操作。这些分类将在创建或编辑菜谱时可供选择。
      </p>
      
      <CategoryList initialCategories={categories} />
    </div>
  );
} 