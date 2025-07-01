import { useState, useEffect } from "react";
import { Product_Service_URL } from "../../../lib/apiEndPoints";

interface CreateCategoryProps {
  onCategoryCreated?: (category: any) => void;
  onCancel?: () => void;
  parentCategory?: { id: string; name: string } | null;
  categories?: any[];
}

// Modern styles inspired by supplier form
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
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-bounce-slow {
    animation: bounce-slow 3s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(3deg); }
  }
  @keyframes bounce-slow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out;
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
const Label = ({ htmlFor, className, children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={className}>{children}</label>
);

const Input = ({ type, id, value, onChange, placeholder, className, required }: {
  type: string;
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) => (
  <input
    type={type}
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${className}`}
    required={required}
  />
);

const TextArea = ({ rows, value, onChange, placeholder, className }: {
  rows: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <textarea
    rows={rows}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${className}`}
  />
);

const Select = ({ options, placeholder, onChange, className, required, value }: {
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  value?: string;
}) => (
  <select
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${className}`}
    required={required}
  >
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export default function CategoryCreateForm({ onCategoryCreated, onCancel, parentCategory, categories: propCategories = [] }: CreateCategoryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [categories, setCategories] = useState<any[]>(propCategories);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: parentCategory?.id || '',
    imageUrl: '',
    level: parentCategory ? 1 : 0
  });

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
    // Fetch categories if not provided as props
    if (propCategories.length === 0) {
      fetchCategories();
    }
  }, [propCategories]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const token = getAuthToken();
      
      const response = await fetch(`${Product_Service_URL}/categories`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Update level when parent changes
  useEffect(() => {
    if (formData.parentId) {
      const parent = categories.find(cat => cat.id === formData.parentId);
      if (parent) {
        setFormData(prev => ({ ...prev, level: (parent.level || 0) + 1 }));
      }
    } else {
      setFormData(prev => ({ ...prev, level: 0 }));
    }
  }, [formData.parentId, categories]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter categories to show only valid parents (prevent circular references)
  const getValidParentCategories = () => {
    return categories.filter(cat => {
      // Don't show the category itself as a potential parent
      return true; // For creation, all categories are valid parents
    });
  };

  // Build full path for a category
  const buildCategoryPath = (categoryId: string): string => {
    const buildPath = (id: string): string[] => {
      const category = categories.find(cat => cat.id === id);
      if (!category) return ['Unknown'];
      
      if (category.parentId) {
        return [...buildPath(category.parentId), category.name];
      }
      return [category.name];
    };
    
    return buildPath(categoryId).join(' > ');
  };

  // Create parent options with hierarchy and details
  const parentOptions = getValidParentCategories()
    .sort((a, b) => {
      // Sort by level first, then by name
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name);
    })
    .map(cat => {
      const path = buildCategoryPath(cat.id);
      const indent = '  '.repeat(cat.level || 0);
      const productInfo = cat.productCount > 0 ? ` (${cat.productCount} products)` : '';
      const subcategoryInfo = cat.subcategoryCount > 0 ? ` [${cat.subcategoryCount} subcategories]` : '';
      
      return {
        value: cat.id,
        label: `${indent}${cat.name} - Level ${cat.level}${productInfo}${subcategoryInfo}`,
        category: cat,
        path: path
      };
    });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: parentCategory?.id || '',
      imageUrl: '',
      level: parentCategory ? 1 : 0
    });
  };

  const handleSubmit = async () => {
    if (!showPreview) {
      setShowPreview(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare the request payload matching CategoryRequestDTO
      const categoryData = {
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId || null,
        imageUrl: formData.imageUrl,
        level: formData.level
      };

      const response = await fetch(`${Product_Service_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Category created:', responseData);
        
        setShowPreview(false);
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
          resetForm();
          if (onCategoryCreated) {
            onCategoryCreated(responseData);
          }
        }, 3000);
      } else {
        const errorData = await response.text();
        console.error('Failed to create category:', errorData);
        alert(`Failed to create category: ${errorData}`);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert(`Error creating category: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.name.trim().length >= 2;
  };

  const getBreadcrumbPath = () => {
    if (!formData.parentId) return ['Root'];
    
    const buildPath = (categoryId: string): string[] => {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) return ['Unknown'];
      
      if (category.parentId) {
        return [...buildPath(category.parentId), category.name];
      }
      return [category.name];
    };
    
    return [...buildPath(formData.parentId), formData.name || 'New Category'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="max-w-12xl mx-auto p-6">
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
          {/* Header Section */}
          <div className="category-gradient text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '3s'}}></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-bounce-slow"></div>
            <div className="relative text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-3">Create New Category</h1>
              <p className="text-xl text-white/80">
                {parentCategory ? `Adding subcategory under "${parentCategory.name}"` : 'Create a new product category'}
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 px-8 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Path:</span>
              {getBreadcrumbPath().map((segment, index, array) => (
                <div key={index} className="flex items-center">
                  <span className={`${index === array.length - 1 ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {segment}
                  </span>
                  {index < array.length - 1 && (
                    <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  Category Information
                </h3>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Category Name</Label>
                    <Input 
                      type="text" 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter category name"
                      className="mt-3 text-lg border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Must be at least 2 characters long and unique
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Description</Label>
                    <TextArea
                      rows={4}
                      value={formData.description}
                      onChange={(value) => handleInputChange('description', value)}
                      placeholder="Describe this category and what products it contains..."
                      className="mt-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageUrl" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Category Image URL</Label>
                    <Input 
                      type="url" 
                      id="imageUrl" 
                      value={formData.imageUrl}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      placeholder="https://example.com/category-image.jpg"
                      className="mt-3 text-lg border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {formData.imageUrl && (
                      <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                        <img 
                          src={formData.imageUrl} 
                          alt="Category preview" 
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {!parentCategory && (
                    <div className="space-y-4">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium text-lg">Parent Category</Label>
                      
                      {loadingCategories ? (
                        <div className="flex items-center justify-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3"></div>
                          <span className="text-gray-600 dark:text-gray-400">Loading categories...</span>
                        </div>
                      ) : (
                        <>
                          <Select
                            options={parentOptions}
                            placeholder="Select parent category (optional for root category)"
                            onChange={(value) => handleInputChange('parentId', value)}
                            value={formData.parentId}
                            className="mt-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                          
                          {/* Selected Parent Category Details */}
                          {formData.parentId && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                              {(() => {
                                const selectedParent = categories.find(cat => cat.id === formData.parentId);
                                if (!selectedParent) return null;
                                
                                const parentPath = buildCategoryPath(selectedParent.id);
                                
                                return (
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-purple-800 dark:text-purple-200">Selected Parent Category</h4>
                                        <p className="text-sm text-purple-600 dark:text-purple-400">Details about your chosen parent</p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium text-purple-700 dark:text-purple-300">Name:</span>
                                        <p className="text-purple-800 dark:text-purple-200">{selectedParent.name}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-purple-700 dark:text-purple-300">Level:</span>
                                        <p className="text-purple-800 dark:text-purple-200">{selectedParent.level}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-purple-700 dark:text-purple-300">Products:</span>
                                        <p className="text-purple-800 dark:text-purple-200">{selectedParent.productCount || 0}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-purple-700 dark:text-purple-300">Subcategories:</span>
                                        <p className="text-purple-800 dark:text-purple-200">{selectedParent.subcategoryCount || 0}</p>
                                      </div>
                                      <div className="md:col-span-2">
                                        <span className="font-medium text-purple-700 dark:text-purple-300">Full Path:</span>
                                        <p className="text-purple-800 dark:text-purple-200">{parentPath}</p>
                                      </div>
                                      {selectedParent.description && (
                                        <div className="md:col-span-2">
                                          <span className="font-medium text-purple-700 dark:text-purple-300">Description:</span>
                                          <p className="text-purple-800 dark:text-purple-200">{selectedParent.description}</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {selectedParent.imageUrl && (
                                      <div>
                                        <span className="font-medium text-purple-700 dark:text-purple-300 block mb-2">Category Image:</span>
                                        <img 
                                          src={selectedParent.imageUrl} 
                                          alt={selectedParent.name} 
                                          className="w-16 h-16 object-cover rounded-lg border border-purple-200 dark:border-purple-600"
                                        />
                                      </div>
                                    )}
                                    
                                    <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
                                      <p className="text-xs text-purple-600 dark:text-purple-400">
                                        Your new category will be created as a subcategory under "{selectedParent.name}" at Level {(selectedParent.level || 0) + 1}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </>
                      )}
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {categories.length === 0 
                          ? "No categories available. This will be a root category."
                          : "Leave empty to create a root category, or select a parent to create a subcategory"
                        }
                      </p>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-800 dark:text-purple-200">
                          Category Level: {formData.level}
                        </p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          {formData.level === 0 ? 'Root category' : `Level ${formData.level} subcategory`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Category Statistics */}
                    {categories.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-purple-200 dark:border-purple-700">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                            {categories.length}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Total Categories
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                            {Math.max(...categories.map(cat => cat.level || 0), 0)}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Max Depth
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                            {categories.filter(cat => cat.parentId === null).length}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Root Categories
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                            {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Total Products
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Review category details before submission</span>
                  </span>
                </div>
                <div className="flex space-x-4">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-8 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className={`px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center space-x-2 ${
                      !isFormValid() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!isFormValid() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create Category</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            {/* Preview Header */}
            <div className="category-gradient text-white p-8 text-center">
              <h3 className="text-3xl font-bold mb-2">Category Preview</h3>
              <p className="text-white/80">Review category details before submission</p>
            </div>
            
            {/* Preview Content */}
            <div className="p-8 space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                <h4 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4">Category Details</h4>
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold text-purple-700 dark:text-purple-300">Name:</span>
                    <p className="text-purple-800 dark:text-purple-200 mt-1 text-lg">{formData.name}</p>
                  </div>
                  {formData.description && (
                    <div>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">Description:</span>
                      <p className="text-purple-800 dark:text-purple-200 mt-1">{formData.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-purple-700 dark:text-purple-300">Level:</span>
                    <p className="text-purple-800 dark:text-purple-200 mt-1">{formData.level} ({formData.level === 0 ? 'Root category' : `Subcategory`})</p>
                  </div>
                  <div>
                    <span className="font-semibold text-purple-700 dark:text-purple-300">Path:</span>
                    <p className="text-purple-800 dark:text-purple-200 mt-1">{getBreadcrumbPath().join(' > ')}</p>
                  </div>
                  {formData.imageUrl && (
                    <div>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">Image:</span>
                      <img 
                        src={formData.imageUrl} 
                        alt="Category" 
                        className="mt-2 w-24 h-24 object-cover rounded-lg border border-purple-200 dark:border-purple-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-8 py-6 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-300"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Creating Category...</span>
                  </div>
                ) : (
                  'Confirm & Create Category'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-6 rounded-2xl shadow-2xl transform transition-all duration-500 animate-fade-in-up">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold">Category Created Successfully!</p>
                <p className="text-purple-100">Your category is now available in the system</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}