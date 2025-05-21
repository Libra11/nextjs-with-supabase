import { getAllIngredientCategories, getAllIngredients } from '@/lib/recipe';
import IngredientCategoryList from './ingredient-category-list';
import IngredientList from '@/components/dashboard/ingredient-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function IngredientsPage() {
  const categories = await getAllIngredientCategories();
  const ingredients = await getAllIngredients();
  
  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-400">
            调料管理
          </span>
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        管理调料和配料，包括分类管理和具体配料的增删改查。
      </p>
      
      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories">分类管理</TabsTrigger>
          <TabsTrigger value="ingredients">配料管理</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <IngredientCategoryList initialCategories={categories} />
        </TabsContent>
        <TabsContent value="ingredients">
          <IngredientList 
            initialIngredients={ingredients} 
            categories={categories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 