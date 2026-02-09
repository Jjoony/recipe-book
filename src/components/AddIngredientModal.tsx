'use client';

import { useState, useEffect, useRef } from 'react';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ingredient: {
    name: string;
    category: string;
    unit: string;
  }, password: string) => Promise<void>;
  initialName: string;
  existingCategories: string[];
  existingUnits: string[];
}

export default function AddIngredientModal({
  isOpen,
  onClose,
  onAdd,
  initialName,
  existingCategories,
  existingUnits,
}: AddIngredientModalProps) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setCategory('');
      setCustomCategory('');
      setUnit('');
      setCustomUnit('');
      setPassword('');
      setError('');
      setAdding(false);
      // 모달이 열리면 이름 입력에 포커스
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialName]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('재료 이름을 입력해주세요');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    const finalCategory = category === '__custom__' ? customCategory : category;
    const finalUnit = unit === '__custom__' ? customUnit : unit;

    setAdding(true);
    setError('');

    try {
      await onAdd(
        {
          name: name.trim(),
          category: finalCategory,
          unit: finalUnit,
        },
        password
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">새 재료 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* 재료 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              재료 이름 <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 소금"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택 안함</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__custom__">직접 입력...</option>
            </select>
            {category === '__custom__' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="새 카테고리 입력"
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
            )}
          </div>

          {/* 단위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              단위
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택 안함</option>
              {existingUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
              <option value="__custom__">직접 입력...</option>
            </select>
            {unit === '__custom__' && (
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="새 단위 입력 (예: g, ml, 개)"
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              관리자 비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (name.trim() && password) {
                    handleSubmit();
                  }
                }
              }}
            />
          </div>

          {/* 버튼들 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={adding}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={adding || !name.trim() || !password}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {adding ? '추가 중...' : '재료 추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
