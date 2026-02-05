'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IngredientSelector from './IngredientSelector';
import PasswordModal from './PasswordModal';
import type { Recipe, RecipeFormData, RecipeIngredient } from '@/types';

interface RecipeFormProps {
  recipe?: Recipe;
  isEdit?: boolean;
}

const SOURCE_TYPES = [
  { value: '', label: '선택 안함' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'website', label: '웹사이트' },
  { value: 'original', label: '오리지널' },
];

export default function RecipeForm({ recipe, isEdit = false }: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<RecipeFormData>({
    title: recipe?.title || '',
    description: recipe?.description || '',
    imageUrl: recipe?.imageUrl || '',
    category: recipe?.category || '',
    tags: recipe?.tags || [],
    servings: recipe?.servings || 0,
    prepTime: recipe?.prepTime || 0,
    cookTime: recipe?.cookTime || 0,
    ingredients: recipe?.ingredients || [],
    instructions: recipe?.instructions || [''],
    sourceUrl: recipe?.sourceUrl || '',
    sourceType: recipe?.sourceType || undefined,
  });

  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Fetch categories and tags
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const response = await fetch('/api/recipes?meta=true');
        const data = await response.json();
        if (data.success) {
          setCategories(data.data.categories || []);
          setAvailableTags(data.data.tags || []);
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    fetchMeta();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'servings' || name === 'prepTime' || name === 'cookTime'
        ? parseInt(value) || 0
        : value,
    }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData((prev) => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const removeInstruction = (index: number) => {
    if (formData.instructions.length <= 1) return;
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, instructions: newInstructions }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAddNewTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      if (!availableTags.includes(newTag.trim())) {
        setAvailableTags((prev) => [...prev, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const cat = newCategory.trim();
      if (!categories.includes(cat)) {
        setCategories((prev) => [...prev, cat]);
      }
      setFormData((prev) => ({ ...prev, category: cat }));
      setNewCategory('');
    }
  };

  const handleIngredientsChange = (ingredients: RecipeIngredient[]) => {
    setFormData((prev) => ({ ...prev, ingredients }));
  };

  const handleSubmit = async (password: string) => {
    setLoading(true);
    setError('');

    try {
      const url = isEdit ? `/api/recipes/${recipe?.id}` : '/api/recipes';
      const method = isEdit ? 'PATCH' : 'POST';

      // Filter out empty instructions
      const cleanedData = {
        ...formData,
        instructions: formData.instructions.filter((inst) => inst.trim()),
        sourceType: formData.sourceType || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('비밀번호가 올바르지 않습니다');
        }
        throw new Error(data.error || 'Failed to save recipe');
      }

      router.push(`/recipes/${data.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setShowPasswordModal(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요');
      return;
    }

    setShowPasswordModal(true);
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            제목 *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            이미지 URL
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  formData.category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="새 카테고리"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddNewCategory}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              추가
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  formData.tags.includes(tag)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="새 태그"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddNewTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              추가
            </button>
          </div>
        </div>

        {/* Time and Servings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-1">
              인분
            </label>
            <input
              type="number"
              id="servings"
              name="servings"
              value={formData.servings || ''}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-1">
              준비 시간 (분)
            </label>
            <input
              type="number"
              id="prepTime"
              name="prepTime"
              value={formData.prepTime || ''}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700 mb-1">
              조리 시간 (분)
            </label>
            <input
              type="number"
              id="cookTime"
              name="cookTime"
              value={formData.cookTime || ''}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">재료</label>
          <IngredientSelector
            selectedIngredients={formData.ingredients}
            onChange={handleIngredientsChange}
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">조리 순서</label>
          <div className="space-y-2">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded font-medium">
                  {index + 1}
                </span>
                <textarea
                  value={instruction}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="조리 단계를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  disabled={formData.instructions.length <= 1}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addInstruction}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + 단계 추가
          </button>
        </div>

        {/* Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sourceType" className="block text-sm font-medium text-gray-700 mb-1">
              출처 유형
            </label>
            <select
              id="sourceType"
              name="sourceType"
              value={formData.sourceType || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
              출처 URL
            </label>
            <input
              type="url"
              id="sourceUrl"
              name="sourceUrl"
              value={formData.sourceUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </form>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleSubmit}
        title={isEdit ? '레시피 수정' : '레시피 등록'}
      />
    </>
  );
}
