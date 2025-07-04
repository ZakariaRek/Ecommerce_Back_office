import { useState, useEffect } from "react";

const Product_Service_URL = "http://localhost:8099/api/products"; // Replace with your actual API URL

type FormStep = 'basic' | 'pricing' | 'images';

interface UploadedFile extends File {
  preview: string;
}

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

interface CreateProductProps {
  onProductCreated?: (product: any) => void;
  onCancel?: () => void;
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
    background: linear-gradient(180deg, #3b82f6, #1d4ed8);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #1d4ed8, #1e40af);
  }
  .floating-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
  }
  .dark .floating-card {
    background: linear-gradient(145deg, #1f2937, #111827);
    box-shadow: 20px 20px 60px #0f172a, -20px -20px 60px #374151;
  }
  .glass-effect {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .dark .glass-effect {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .step-line {
    background: linear-gradient(90deg, #e5e7eb, #d1d5db);
  }
  .dark .step-line {
    background: linear-gradient(90deg, #374151, #4b5563);
  }
  .step-line-active {
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  }
  .product-gradient {
    background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #8b5cf6 100%);
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
  .code-pattern {
    background-image: radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0),
                      radial-gradient(circle at 75px 75px, rgba(255,255,255,0.1) 2px, transparent 0);
    background-size: 100px 100px;
  }
  .category-tag {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    transition: all 0.2s ease;
  }
  .category-tag:hover {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    transform: scale(1.05);
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

// Simple components to match the pattern
const Label = ({ htmlFor, className, children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={className}>{children}</label>
);

const Input = ({ type, id, value, onChange, placeholder, className, required }: {
  type: string;
  id?: string;
  value: string | number;
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

const Select = ({ options, placeholder, onChange, className, required }: {
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}) => (
  <select
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

// Category Multi-Select Component
const CategoryMultiSelect = ({ categories, selectedCategories, onSelectionChange }: {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (categoryIds: string[]) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  const removeCategory = (categoryId: string) => {
    onSelectionChange(selectedCategories.filter(id => id !== categoryId));
  };

  return (
    <div className="relative">
      <div className="space-y-4">
        {/* Selected Categories Display */}
        {selectedCategories.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <h5 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3">
              Selected Categories ({selectedCategories.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(categoryId => {
                const category = categories.find(c => c.id === categoryId);
                if (!category) return null;
                return (
                  <div
                    key={categoryId}
                    className="category-tag text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2"
                  >
                    <span>{category.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCategory(categoryId)}
                      className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Selection Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 text-left flex items-center justify-between"
        >
          <span className="text-gray-500 dark:text-gray-400">
            {selectedCategories.length > 0 
              ? `${selectedCategories.length} categories selected`
              : 'Select categories'
            }
          </span>
          <svg 
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Category Dropdown */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Categories List */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredCategories.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No categories found
                </div>
              ) : (
                filteredCategories.map(category => (
                  <div
                    key={category.id}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {category.name}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                            Level {category.level}
                          </span>
                        </div>
                        {category.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {category.productCount} products
                          </span>
                          {category.subcategoryCount > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {category.subcategoryCount} subcategories
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Close Button */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Category Information Display Component
const SelectedCategoriesInfo = ({ categories, selectedCategories }: {
  categories: Category[];
  selectedCategories: string[];
}) => {
  const selectedCategoryObjects = categories.filter(cat => selectedCategories.includes(cat.id));

  if (selectedCategoryObjects.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
      <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        Selected Categories Information
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedCategoryObjects.map(category => (
          <div key={category.id} className="bg-white dark:bg-purple-800/20 rounded-xl p-4 border border-purple-100 dark:border-purple-700">
            <div className="flex items-start space-x-3">
              {category.imageUrl && (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h5 className="font-semibold text-purple-800 dark:text-purple-200 truncate">
                    {category.name}
                  </h5>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-700 text-purple-800 dark:text-purple-200">
                    L{category.level}
                  </span>
                </div>
                
                {category.description && (
                  <p className="text-sm text-purple-600 dark:text-purple-300 mb-3 leading-relaxed">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-purple-500 dark:text-purple-400">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>{category.productCount} products</span>
                  </div>
                  {category.subcategoryCount > 0 && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>{category.subcategoryCount} subcategories</span>
                    </div>
                  )}
                </div>
                
                {category.parentName && (
                  <div className="mt-2 flex items-center space-x-1 text-xs text-purple-500 dark:text-purple-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Parent: {category.parentName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple DropzoneComponent placeholder
const DropzoneComponent = ({ onUpload, uploadedFiles }: {
  onUpload: (files: UploadedFile[]) => void;
  uploadedFiles: UploadedFile[];
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const filesWithPreview = files.map(file => {
      const fileWithPreview = file as UploadedFile;
      fileWithPreview.preview = URL.createObjectURL(file);
      return fileWithPreview;
    });
    onUpload(filesWithPreview);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg font-medium">Drop files here or click to upload</p>
          <p className="text-sm">Support for image files</p>
        </div>
      </label>
    </div>
  );
};

export default function CreateProduct({ onProductCreated, onCancel }: CreateProductProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    weight: 0,
    dimensions: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED',
    categoryIds: [] as string[]
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

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
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
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
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (files: UploadedFile[]) => {
    console.log('Handling file upload:', files.length, 'files');
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      // Revoke the object URL to free memory
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "DISCONTINUED", label: "Discontinued" }
  ];

  const steps = [
    { key: 'basic', title: 'Basic Info', icon: 'document', color: 'from-blue-500 to-indigo-500' },
    { key: 'pricing', title: 'Pricing', icon: 'currency', color: 'from-green-500 to-emerald-500' },
    { key: 'images', title: 'Gallery', icon: 'photo', color: 'from-purple-500 to-pink-500' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.key === currentStep);

  const renderStepIcon = (icon: string) => {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case 'document':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'currency':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'photo':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return <div className={iconClass}></div>;
    }
  };

  const renderStep = () => {
    const currentStepData = steps.find(step => step.key === currentStep);
    
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className={`bg-gradient-to-r ${currentStepData?.color} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {renderStepIcon('document')}
                  </div>
                  <h3 className="text-2xl font-bold">Product Basics</h3>
                </div>
                <p className="text-white/80">Essential product information and details</p>
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Product Name</Label>
                  <Input 
                    type="text" 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your product name"
                    className="mt-3 text-lg border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Product Description</Label>
                  <TextArea
                    rows={8}
                    value={formData.description}
                    onChange={(value) => handleInputChange('description', value)}
                    placeholder="Describe your product's features, benefits, and what makes it unique..."
                    className="mt-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="sku" className="text-gray-700 dark:text-gray-300 font-medium text-lg">SKU (Stock Keeping Unit)</Label>
                  <Input 
                    type="text" 
                    id="sku" 
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="e.g., PROD-2024-001"
                    className="mt-3 text-lg border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'pricing':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className={`bg-gradient-to-r ${currentStepData?.color} rounded-2xl p-6 text-white relative overflow-hidden code-pattern`}>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 animate-bounce-slow"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {renderStepIcon('currency')}
                  </div>
                  <h3 className="text-2xl font-bold">Pricing & Specifications</h3>
                </div>
                <p className="text-white/80">Set pricing, specifications, and category assignments</p>
              </div>
            </div>

            {/* Category Selection Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                Product Categories
              </h4>
              <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Select Product Categories</Label>
              {categoriesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading categories...</span>
                </div>
              ) : (
                <CategoryMultiSelect
                  categories={categories}
                  selectedCategories={formData.categoryIds}
                  onSelectionChange={(categoryIds) => handleInputChange('categoryIds', categoryIds)}
                />
              )}
            </div>

            {/* Selected Categories Information */}
            {formData.categoryIds.length > 0 && (
              <SelectedCategoriesInfo
                categories={categories}
                selectedCategories={formData.categoryIds}
              />
            )}

            {/* Form Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pricing Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  Pricing Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Price (USD)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Stock Quantity</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Specifications Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  Product Specifications
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weight" className="text-gray-700 dark:text-gray-300 font-medium">Weight (kg)</Label>
                    <Input 
                      type="number" 
                      id="weight" 
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="mt-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dimensions" className="text-gray-700 dark:text-gray-300 font-medium">Dimensions</Label>
                    <Input 
                      type="text" 
                      id="dimensions" 
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange('dimensions', e.target.value)}
                      placeholder="e.g., 25 × 15 × 10 cm"
                      className="mt-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Product Status
              </h4>
              <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Select Product Status</Label>
              <Select
                options={statusOptions}
                placeholder="Choose product status"
                onChange={(value) => handleInputChange('status', value)}
                className="dark:bg-gray-700"
                required
              />
            </div>
          </div>
        );
      case 'images':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className={`bg-gradient-to-r ${currentStepData?.color} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '2s'}}></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {renderStepIcon('photo')}
                  </div>
                  <h3 className="text-2xl font-bold">Product Gallery</h3>
                </div>
                <p className="text-white/80">Showcase your product with compelling visuals</p>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                Upload Product Images
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add product photos that showcase your product from different angles.
              </p>
              <DropzoneComponent
                onUpload={handleFileUpload}
                uploadedFiles={uploadedFiles}
              />
            </div>
            
            {/* Image Gallery */}
            {uploadedFiles.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Product Gallery
                  </div>
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">
                    {uploadedFiles.length} image{uploadedFiles.length !== 1 ? 's' : ''}
                  </span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="group relative bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300">
                      <div className="relative">
                        <img 
                          src={file.preview} 
                          alt={file.name}
                          className="w-full h-40 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-3 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
              <h5 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Pro Tips for Product Images
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700 dark:text-amber-300">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use high-quality product photos</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Show different angles and details</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Include lifestyle or usage photos</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Maintain consistent lighting and style</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      sku: '',
      weight: 0,
      dimensions: '',
      status: 'ACTIVE',
      categoryIds: []
    });
    // Clean up object URLs
    uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setUploadedFiles([]);
    setCurrentStep('basic');
  };

  const handleSubmit = async () => {
    // Only submit on the final step
    if (currentStep !== 'images') {
      console.log('Not on final step, preventing submission');
      return;
    }

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

      // Create FormData for multipart request
      const formDataToSend = new FormData();

      // Create the product DTO matching the ProductRequestDTO structure
      const productDTO = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        sku: formData.sku,
        weight: formData.weight,
        dimensions: formData.dimensions,
        status: formData.status,
        images: [], // Will be handled separately as files
        categoryIds: formData.categoryIds, // Now dynamic based on selection
        supplierIds: [] // Optional - can be empty for now
      };

      // Add product data as JSON part
      formDataToSend.append('product', new Blob([JSON.stringify(productDTO)], {
        type: 'application/json'
      }));

      // Add image files
      uploadedFiles.forEach((file, index) => {
        formDataToSend.append('images', file);
      });

      // Choose endpoint based on whether there are images
      const endpoint = uploadedFiles.length > 0 
        ? `${Product_Service_URL}/products/with-images`
        : `${Product_Service_URL}/products`;

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };

      // For the regular endpoint, send JSON
      const requestConfig: RequestInit = uploadedFiles.length > 0 
        ? {
            method: 'POST',
            headers,
            body: formDataToSend
          }
        : {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(productDTO)
          };

      const response = await fetch(endpoint, requestConfig);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Product created:', responseData);
        
        setShowPreview(false);
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
          resetForm();
          if (onProductCreated) {
            // Extract product from response (might be nested in /with-images endpoint)
            const createdProduct = responseData.product || responseData;
            onProductCreated(createdProduct);
          }
        }, 3000);
      } else {
        const errorData = await response.text();
        console.error('Failed to create product:', errorData);
        alert(`Failed to create product: ${errorData}`);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert(`Error creating product: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'basic' && isStepValid()) {
      setCurrentStep('pricing');
    } else if (currentStep === 'pricing' && isStepValid()) {
      setCurrentStep('images');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'pricing') setCurrentStep('basic');
    else if (currentStep === 'images') setCurrentStep('pricing');
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name && formData.description && formData.sku;
      case 'pricing':
        return formData.price > 0 && formData.weight > 0 && formData.dimensions && formData.status;
      case 'images':
        return !isSubmitting; // Don't allow submit while processing
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="max-w-12xl mx-auto p-6">
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
          {/* Header Section */}
          <div className="product-gradient text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '3s'}}></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-bounce-slow"></div>
            <div className="relative text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-3">Create New Product</h1>
              <p className="text-xl text-white/80">Build your product catalog with detailed specifications</p>
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

          {/* Progress Indicator */}
          <div className="bg-white dark:bg-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted = index < getCurrentStepIndex();
                const isAccessible = index <= getCurrentStepIndex();
                
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <button
                        type="button"
                        className={`relative flex items-center justify-center w-12 h-12 rounded-2xl font-bold transition-all duration-300 ${
                          isActive
                            ? `bg-gradient-to-r ${step.color} text-white shadow-lg transform scale-110`
                            : isCompleted
                              ? 'bg-blue-500 text-white shadow-md'
                              : isAccessible
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (isAccessible) setCurrentStep(step.key as FormStep);
                        }}
                        disabled={!isAccessible}
                      >
                        {isCompleted ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          renderStepIcon(step.icon)
                        )}
                        {isActive && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-30 animate-pulse"></div>
                        )}
                      </button>
                      <span className={`mt-3 text-sm font-medium transition-colors duration-300 text-center ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : isCompleted
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-4 rounded-full transition-all duration-300 ${
                        index < getCurrentStepIndex()
                          ? 'step-line-active'
                          : 'step-line'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div>
              <div className="transition-all duration-500 transform">
                {renderStep()}
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {currentStep === 'images' && uploadedFiles.length > 0 && (
                    <span className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>{uploadedFiles.length} image(s) ready to upload</span>
                    </span>
                  )}
                  {currentStep === 'pricing' && formData.categoryIds.length > 0 && (
                    <span className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>{formData.categoryIds.length} categories selected</span>
                    </span>
                  )}
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                      currentStep === 'basic'
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                    onClick={handlePreviousStep}
                    disabled={currentStep === 'basic'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                  {currentStep === 'images' ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className={`px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center space-x-2 ${
                        !isStepValid() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!isStepValid() || isSubmitting}
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
                          <span>Create Product</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2 ${
                        !isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={handleNextStep}
                      disabled={!isStepValid()}
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            {/* Preview Header */}
            <div className="product-gradient text-white p-8 text-center">
              <h3 className="text-3xl font-bold mb-2">Product Preview</h3>
              <p className="text-white/80">Review your product details before submission</p>
            </div>
            
            {/* Preview Content */}
            <div className="p-8 space-y-8">
              {/* Basic Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">Product Name:</span>
                    <p className="text-blue-800 dark:text-blue-200 mt-1">{formData.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">SKU:</span>
                    <p className="text-blue-800 dark:text-blue-200 mt-1 font-mono">{formData.sku}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">Description:</span>
                    <p className="text-blue-800 dark:text-blue-200 mt-1 leading-relaxed">{formData.description}</p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              {formData.categoryIds.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    Selected Categories ({formData.categoryIds.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.categoryIds.map(categoryId => {
                      const category = categories.find(c => c.id === categoryId);
                      if (!category) return null;
                      return (
                        <div key={categoryId} className="category-tag text-white px-3 py-2 rounded-full text-sm font-medium">
                          {category.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pricing Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <h4 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  Pricing & Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-green-700 dark:text-green-300">Price:</span>
                    <p className="text-green-800 dark:text-green-200 mt-1">${formData.price}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-green-700 dark:text-green-300">Stock:</span>
                    <p className="text-green-800 dark:text-green-200 mt-1">{formData.stock} units</p>
                  </div>
                  <div>
                    <span className="font-semibold text-green-700 dark:text-green-300">Weight:</span>
                    <p className="text-green-800 dark:text-green-200 mt-1">{formData.weight} kg</p>
                  </div>
                  <div>
                    <span className="font-semibold text-green-700 dark:text-green-300">Status:</span>
                    <p className="text-green-800 dark:text-green-200 mt-1">{formData.status}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-green-700 dark:text-green-300">Dimensions:</span>
                    <p className="text-green-800 dark:text-green-200 mt-1">{formData.dimensions}</p>
                  </div>
                </div>
              </div>

              {/* Product Images */}
              {uploadedFiles.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Product Gallery ({uploadedFiles.length} images)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="bg-white dark:bg-purple-800/20 rounded-xl overflow-hidden shadow-md">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1 truncate">{file.name}</p>
                          <p className="text-xs text-purple-600 dark:text-purple-300">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                className={`px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Creating Product...</span>
                  </div>
                ) : (
                  'Confirm & Submit Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl transform transition-all duration-500 animate-fade-in-up">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold">Product Created Successfully!</p>
                <p className="text-green-100">Your product is now available in inventory</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}