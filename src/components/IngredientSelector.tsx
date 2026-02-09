'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Ingredient, RecipeIngredient } from '@/types';

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

  // 새 재료 추가 관련 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIngredientUnit, setNewIngredientUnit] = useState('');
  const [newIngredientCategory, setNewIngredientCategory] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

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

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setShowDropdown(false);
    setNewIngredientUnit('');
    setNewIngredientCategory('');
    setAddPassword('');
    setAddError('');
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setSearchTerm('');
    setAddError('');
  };

  const handleAddNewIngredient = async () => {
    if (!searchTerm.trim()) return;

    setAdding(true);
    setAddError('');

    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${addPassword}`,
        },
        body: JSON.stringify({
          name: searchTerm.trim(),
          unit: newIngredientUnit || '',
          category: newIngredientCategory || '',
        }),
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

      // 폼 초기화
      setShowAddForm(false);
      setSearchTerm('');
      setAddPassword('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setAdding(false);
    }
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
        {showDropdown && !showAddForm && (searchTerm || filteredIngredients.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredIngredients.length === 0 ? (
              <div className="px-4 py-2">
                <div className="text-gray-500 text-sm mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '모든 재료가 선택되었습니다'}
                </div>
                {searchTerm && (
                  <button
                    onClick={handleShowAddForm}
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
                    onClick={handleShowAddForm}
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

      {/* 새 재료 추가 폼 */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
          <div className="font-medium text-blue-800">
            새 재료 추가: {searchTerm}
          </div>

          {addError && (
            <div className="text-red-600 text-sm">{addError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">카테고리</label>
              <select
                value={newIngredientCategory}
                onChange={(e) => setNewIngredientCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">선택 안함</option>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">단위</label>
              <select
                value={newIngredientUnit}
                onChange={(e) => setNewIngredientUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">선택 안함</option>
                {existingUnits.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">관리자 비밀번호</label>
            <input
              type="password"
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewIngredient();
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelAdd}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
              disabled={adding}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleAddNewIngredient}
              disabled={adding || !addPassword}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {adding ? '추가 중...' : '재료 추가'}
            </button>
          </div>
        </div>
      )}

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
