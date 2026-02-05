'use client';

import { useState, useEffect, useCallback } from 'react';
import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';
import type { Recipe } from '@/types';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch metadata (categories and tags)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const response = await fetch('/api/recipes?meta=true');
        const data = await response.json();
        if (data.success) {
          setCategories(data.data.categories || []);
          setTags(data.data.tags || []);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };

    fetchMeta();
  }, []);

  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

      const response = await fetch(`/api/recipes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecipes(data.data);
      } else {
        setError(data.error || 'Failed to fetch recipes');
      }
    } catch (err) {
      setError('Failed to fetch recipes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedTags]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">레시피</h1>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="레시피 이름으로 검색..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Filters */}
        <aside className="lg:col-span-1">
          <FilterPanel
            categories={categories}
            tags={tags}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            onCategoryChange={setSelectedCategory}
            onTagsChange={setSelectedTags}
          />
        </aside>

        {/* Main Content - Recipe Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchRecipes}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                다시 시도
              </button>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">레시피가 없습니다.</p>
              <a
                href="/recipes/new"
                className="inline-block mt-4 text-blue-600 hover:text-blue-700"
              >
                첫 번째 레시피를 추가해보세요!
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
