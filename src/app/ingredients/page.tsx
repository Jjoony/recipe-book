'use client';

import { useState, useEffect } from 'react';
import PasswordModal from '@/components/PasswordModal';
import type { Ingredient } from '@/types';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // New ingredient form
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    category: '',
    unit: '',
  });

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients');
      const data = await response.json();

      if (data.success) {
        setIngredients(data.data);
      } else {
        setError(data.error || 'Failed to fetch ingredients');
      }
    } catch (err) {
      setError('Failed to fetch ingredients');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleAdd = async (password: string) => {
    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(newIngredient),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert('비밀번호가 올바르지 않습니다');
          return;
        }
        throw new Error(data.error);
      }

      setIngredients([...ingredients, data.data]);
      setNewIngredient({ name: '', category: '', unit: '' });
      setShowAddModal(false);
    } catch (err) {
      alert('재료 추가에 실패했습니다');
      console.error('Error:', err);
    } finally {
      setShowPasswordModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name.trim()) {
      alert('재료 이름을 입력해주세요');
      return;
    }
    setShowPasswordModal(true);
  };

  // Group ingredients by category
  const groupedIngredients = ingredients.reduce((acc, ingredient) => {
    const category = ingredient.category || '기타';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ingredient);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">재료 관리</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          재료 추가
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchIngredients}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            다시 시도
          </button>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">등록된 재료가 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            첫 번째 재료를 추가해보세요!
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedIngredients).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                <h2 className="font-semibold text-gray-800">{category}</h2>
              </div>
              <ul className="divide-y">
                {items.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="px-4 py-3 flex justify-between items-center"
                  >
                    <span>{ingredient.name}</span>
                    <span className="text-gray-500 text-sm">{ingredient.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">새 재료 추가</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  재료 이름 *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <input
                  type="text"
                  id="category"
                  value={newIngredient.category}
                  onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}
                  placeholder="예: 채소, 양념, 육류 등"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  기본 단위
                </label>
                <input
                  type="text"
                  id="unit"
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                  placeholder="예: g, ml, 개, 큰술 등"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleAdd}
        title="재료 추가"
      />
    </div>
  );
}
