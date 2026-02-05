'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordModal from '@/components/PasswordModal';
import type { Recipe } from '@/types';

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async (password: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert('비밀번호가 올바르지 않습니다');
          return;
        }
        throw new Error(data.error);
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      alert('삭제에 실패했습니다');
      console.error('Error:', err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getSourceEmbed = () => {
    if (!recipe?.sourceUrl) return null;

    // Instagram embed
    if (recipe.sourceType === 'instagram' || recipe.sourceUrl.includes('instagram.com')) {
      return (
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Instagram에서 보기:</p>
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 break-all"
          >
            {recipe.sourceUrl}
          </a>
        </div>
      );
    }

    // YouTube embed
    if (recipe.sourceType === 'youtube' || recipe.sourceUrl.includes('youtube.com') || recipe.sourceUrl.includes('youtu.be')) {
      let videoId = '';
      if (recipe.sourceUrl.includes('youtube.com/watch')) {
        const url = new URL(recipe.sourceUrl);
        videoId = url.searchParams.get('v') || '';
      } else if (recipe.sourceUrl.includes('youtu.be/')) {
        videoId = recipe.sourceUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      }

      if (videoId) {
        return (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      }
    }

    // Default link
    return (
      <a
        href={recipe.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-700 break-all"
      >
        {recipe.sourceUrl}
      </a>
    );
  };

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

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <>
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </Link>

          <div className="flex justify-between items-start mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {recipe.category && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                    {recipe.category}
                  </span>
                )}
                {recipe.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/recipes/${recipe.id}/edit`}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                수정
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>

        {/* Image */}
        {recipe.imageUrl && (
          <div className="relative h-64 sm:h-96 mb-8 rounded-lg overflow-hidden bg-gray-200">
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          {totalTime > 0 && (
            <div className="text-center">
              <p className="text-gray-500 text-sm">총 시간</p>
              <p className="font-semibold">{totalTime}분</p>
            </div>
          )}
          {recipe.prepTime > 0 && (
            <div className="text-center">
              <p className="text-gray-500 text-sm">준비 시간</p>
              <p className="font-semibold">{recipe.prepTime}분</p>
            </div>
          )}
          {recipe.cookTime > 0 && (
            <div className="text-center">
              <p className="text-gray-500 text-sm">조리 시간</p>
              <p className="font-semibold">{recipe.cookTime}분</p>
            </div>
          )}
          {recipe.servings > 0 && (
            <div className="text-center">
              <p className="text-gray-500 text-sm">인분</p>
              <p className="font-semibold">{recipe.servings}인분</p>
            </div>
          )}
        </div>

        {/* Description */}
        {recipe.description && (
          <div className="mb-8">
            <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">재료</h2>
            <ul className="bg-white border rounded-lg divide-y">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.ingredientId} className="px-4 py-3 flex justify-between">
                  <span>{ingredient.name}</span>
                  <span className="text-gray-600">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Instructions */}
        {recipe.instructions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">조리 순서</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-medium">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 pt-1">{instruction}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Source */}
        {recipe.sourceUrl && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">출처</h2>
            {getSourceEmbed()}
          </section>
        )}
      </article>

      <PasswordModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSubmit={handleDelete}
        title="레시피 삭제"
      />

      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <p>삭제 중...</p>
          </div>
        </div>
      )}
    </>
  );
}
