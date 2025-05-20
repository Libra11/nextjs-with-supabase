import { notFound } from 'next/navigation';
import RecipeForm from '@/components/recipe-form';
import { getRecipeById } from '@/lib/recipe';

interface EditRecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold mb-8">编辑菜谱: {recipe.title}</h1>
      <RecipeForm recipe={recipe} isEditing={true} />
    </div>
  );
} 