import Link from 'next/link';
import { getAllRecipes } from '@/lib/recipe';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import RecipeActions from './recipe-actions';
import { ListFilter, Plus, Utensils } from 'lucide-react';

export const revalidate = 0; // 不缓存，每次请求重新获取

export default async function RecipesAdminPage() {
  const recipes = await getAllRecipes();

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">菜谱管理</h1>
        <div className="flex gap-3">
          <Link href="/dashboard/ingredients">
            <Button variant="outline" className="flex items-center gap-1">
              <Utensils className="h-4 w-4" />
              调料分类
            </Button>
          </Link>
          <Link href="/dashboard/categories">
            <Button variant="outline" className="flex items-center gap-1">
              <ListFilter className="h-4 w-4" />
              管理分类
            </Button>
          </Link>
          <Link href="/dashboard/recipes/new">
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              创建菜谱
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>难度</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                    暂无菜谱
                  </TableCell>
                </TableRow>
              ) : (
                recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.title}</TableCell>
                    <TableCell>{recipe.difficulty_level || '-'}</TableCell>
                    <TableCell>
                      {new Date(recipe.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          recipe.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {recipe.is_published ? '已发布' : '草稿'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <RecipeActions recipe={recipe} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 