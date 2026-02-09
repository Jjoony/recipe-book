'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Ingredient, RecipeIngredient } from '@/types';
import AddIngredientModal from './AddIngredientModal';

interface IngredientSelectorProps {
  selectedIngredients: RecipeIngredient[];
  onChange: (ingredients: RecipeIngredient[]) => void;
}

export default function IngredientSelector({
  selectedIngredients,
  onChange,
}: IngredientSelectorProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 새 재료 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalInitialName, setAddModalInitialName] = useState('');

  // 기존 재료들에서 단위와 카테고리 옵션 추출
  const existingUnits = useMemo(() => {
    return [...new Set(ingredients.map((i) => i.unit).filter(Boolean))].sort();
  }, [ingredients]);

  const existingCategories = useMemo(() => {
    return [...new Set(ingredients.map((i) => i.category).filter(Boolean))].sort();
  }, [ingredients]);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch('/api/ingredients');
        const data = await response.json();
        if (data.success) {
          setIngredients(data.data);
        }
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  const filteredIngredients = ingredients.filter(
    (ing) =>
      ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedIngredients.some((s) => s.ingredientId === ing.id)
  );

  const handleSelect = (ingredient: Ingredient) => {
    const newIngredient: RecipeIngredient = {
      ingredientId: ingredient.id,
      name: ingredient.name,
      amount: '',
      unit: ingredient.unit,
    };
    onChange([...selectedIngredients, newIngredient]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemove = (ingredientId: string) => {
    onChange(selectedIngredients.filter((i) => i.ingredientId !== ingredientId));
  };

  const handleAmountChange = (ingredientId: string, amount: string) => {
    onChange(
      selectedIngredients.map((i) =>
        i.ingredientId === ingredientId ? { ...i, amount } : i
      )
    );
  };

  const handleShowAddModal = () => {
    setAddModalInitialName(searchTerm);
    setShowAddModal(true);
    setShowDropdown(false);
  };

  const handleAddNewIngredient = async (
    ingredientData: { name: string; category: string; unit: string },
    password: string
  ) => {
    const response = await fetch('/api/ingredients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify(ingredientData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('비밀번호가 올바르지 않습니다');
      }
      throw new Error(data.error || '재료 추가에 실패했습니다');
    }

    // 새로 생성된 재료를 목록에 추가
    const newIngredient: Ingredient = data.data;
    setIngredients((prev) => [...prev, newIngredient].sort((a, b) => a.name.localeCompare(b.name)));

    // 바로 선택
    const newRecipeIngredient: RecipeIngredient = {
      ingredientId: newIngredient.id,
      name: newIngredient.name,
      amount: '',
      unit: newIngredient.unit,
    };
    onChange([...selectedIngredients, newRecipeIngredient]);

    // 검색어 초기화
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="text-gray-500 text-sm">재료 목록을 불러오는 중...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder="재료 검색..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Dropdown */}
        {showDropdown && (searchTerm || filteredIngredients.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredIngredients.length === 0 ? (
              <div className="px-4 py-2">
                <div className="text-gray-500 text-sm mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '모든 재료가 선택되었습니다'}
                </div>
                {searchTerm && (
                  <button
                    onClick={handleShowAddModal}
                    className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>&apos;{searchTerm}&apos; 새 재료로 추가</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredIngredients.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => handleSelect(ingredient)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center"
                  >
                    <span>{ingredient.name}</span>
                    <span className="text-gray-400 text-sm">
                      {ingredient.category && `${ingredient.category}`}
                      {ingredient.unit && ` · ${ingredient.unit}`}
                    </span>
                  </button>
                ))}
                {searchTerm && (
                  <button
                    onClick={handleShowAddModal}
                    className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 border-t border-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>&apos;{searchTerm}&apos; 새 재료로 추가</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 새 재료 추가 모달 */}
      <AddIngredientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddNewIngredient}
        initialName={addModalInitialName}
        existingCategories={existingCategories}
        existingUnits={existingUnits}
      />

      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <div className="space-y-2">
          {selectedIngredients.map((ingredient) => (
            <div
              key={ingredient.ingredientId}
              className="flex items-center gap-2 bg-gray-50 p-2 rounded-md"
            >
              <span className="flex-shrink-0 font-medium">{ingredient.name}</span>
              <input
                type="text"
                value={ingredient.amount}
                onChange={(e) =>
                  handleAmountChange(ingredient.ingredientId, e.target.value)
                }
                placeholder="양"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-500 text-sm">{ingredient.unit}</span>
              <button
                onClick={() => handleRemove(ingredient.ingredientId)}
                className="text-red-500 hover:text-red-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
