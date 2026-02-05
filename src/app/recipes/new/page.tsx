import RecipeForm from '@/components/RecipeForm';

export default function NewRecipePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">새 레시피 추가</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <RecipeForm />
      </div>
    </div>
  );
}
