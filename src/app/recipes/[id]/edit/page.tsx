'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import RecipeForm from '@/components/RecipeForm';
import type { Recipe } from '@/types';

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}`);
        const data = await response.json();

        if (data.success) {
          setRecipe(data.data);
        } else {
          setError(data.error || 'Recipe not found');
        }
      } catch (err) {
        setError('Failed to fetch recipe');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || '레시피를 찾을 수 없습니다'}</p>
        <Link href="/" className="text-blue-600 hover:text-blue-700">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">레시피 수정</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <RecipeForm recipe={recipe} isEdit />
      </div>
    </div>
  );
}
