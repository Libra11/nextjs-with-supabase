import RecipeForm from '@/components/recipe-form';

export default function NewRecipePage() {
  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold mb-8">创建新菜谱</h1>
      <RecipeForm />
    </div>
  );
} 