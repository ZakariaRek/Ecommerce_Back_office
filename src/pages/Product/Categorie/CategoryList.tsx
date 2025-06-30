import { useState, useEffect } from "react";
import { Product_Service_URL } from "../../../lib/apiEndPoints";

interface Category {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  parentName?: string;
  imageUrl: string;
  level: number;
  createdAt: string;
  productCount: number;
  subcategoryCount: number;
}

interface CategoryStats {
  totalCategories: number;
  rootCategories: number;
  maxDepth: number;
  totalProducts: number;
  averageProductsPerCategory: number;
  mostPopularCategory: string;
}

interface CategoryListProps {
  onCreateCategory?: () => void;
  onEditCategory?: (category: Category) => void;
  refreshTrigger?: number;
}

// Modern styles
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #8b5cf6, #7c3aed);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #7c3aed, #6d28d9);
  }
  .floating-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
  }
  .dark .floating-card {
    background: linear-gradient(145deg, #1f2937, #111827);
    box-shadow: 20px 20px 60px #0f172a, -20px -20px 60px #374151;
  }
  .category-gradient {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

// Helper function to get cookie value
const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue.join('=') || null;
    }
  }
  return null;
};

// Token management
const getAuthToken = (): string | null => {
  let tokenFromCookie = getCookie('token') || getCookie('auth-token') || getCookie('userservice');
  
  if (tokenFromCookie) {
    tokenFromCookie = decodeURIComponent(tokenFromCookie);
    if (tokenFromCookie.startsWith('"') && tokenFromCookie.endsWith('"')) {
      tokenFromCookie = tokenFromCookie.slice(1, -1);
    }
    return tokenFromCookie;
  }
  
  try {
    const tokenFromStorage = localStorage.getItem('auth-token');
    return tokenFromStorage;
  } catch {
    return null;
  }
};

// Simple components
const Input = ({ type, value, onChange, placeholder, className }: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${className}`}
  />
);

const Select = ({ options, value, onChange, className }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${className}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export default function CategoryList({ onCreateCategory, onEditCategory, refreshTrigger }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Inject custom styles
    const styleElement = document.createElement('style');
    styleElement.textContent = modernStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [refreshTrigger]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(`${Product_Service_URL}/categories`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setError('');
      } else {
        setError('Failed to fetch categories');
      }
    } catch (err) {
      setError('Error fetching categories');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${Product_Service_URL}/categories/stats`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${Product_Service_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        await fetchCategories();
        await fetchStats();
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.text();
        alert(`Failed to delete category: ${errorData}`);
      }
    } catch (err) {
      alert(`Error deleting category: ${err}`);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter categories based on search and level
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || category.level.toString() === filterLevel;
    return matchesSearch && matchesLevel;
  });

  // Build tree structure for tree view
  const buildCategoryTree = (categories: Category[], parentId: string | null = null): Category[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id)
      }));
  };

  const getLevelOptions = () => {
    const levels = Array.from(new Set(categories.map(cat => cat.level))).sort();
    return [
      { value: 'all', label: 'All Levels' },
      ...levels.map(level => ({ 
        value: level.toString(), 
        label: `Level ${level} ${level === 0 ? '(Root)' : ''}` 
      }))
    ];
  };

  const renderCategoryCard = (category: Category, depth = 0) => {
    const hasChildren = categories.some(cat => cat.parentId === category.id);
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="animate-slide-up">
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${depth > 0 ? 'ml-8 mt-4' : 'mb-4'}`}>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* Category Image */}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl flex items-center justify-center overflow-hidden">
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                </div>

                {/* Category Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{category.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      category.level === 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      Level {category.level}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">{category.description}</p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>{category.productCount} products</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>{category.subcategoryCount} subcategories</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date(category.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {viewMode === 'tree' && hasChildren && (
                  <button
                    onClick={() => toggleExpanded(category.id)}
                    className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => onCreateCategory?.()}
                  className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  title="Add subcategory"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onEditCategory?.(category)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Edit category"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(category.id)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete category"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {viewMode === 'tree' && hasChildren && isExpanded && (
          <div className="ml-4">
            {categories
              .filter(cat => cat.parentId === category.id)
              .map(child => renderCategoryCard(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl mb-8">
          <div className="category-gradient text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Category Management</h1>
                <p className="text-xl text-white/80">Organize and manage your product categories</p>
              </div>
              <button
                onClick={onCreateCategory}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Category</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalCategories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Root Categories</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.rootCategories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Max Depth</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.maxDepth}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Select
                options={getLevelOptions()}
                value={filterLevel}
                onChange={setFilterLevel}
                className="border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
              />
              
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    viewMode === 'tree'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                >
                  Tree View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                >
                  List View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Display */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {filteredCategories.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center">
                <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Categories Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filterLevel !== 'all' 
                  ? 'No categories match your current filters.' 
                  : 'Get started by creating your first category.'}
              </p>
              <button
                onClick={onCreateCategory}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Create First Category
              </button>
            </div>
          ) : viewMode === 'tree' ? (
            // Tree View
            <div>
              {buildCategoryTree(filteredCategories).map(category => renderCategoryCard(category))}
            </div>
          ) : (
            // List View
            <div>
              {filteredCategories.map(category => renderCategoryCard(category))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden max-w-md w-full mx-4 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Delete Category</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete this category? This will also remove all subcategories and may affect associated products.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCategory(showDeleteConfirm)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}