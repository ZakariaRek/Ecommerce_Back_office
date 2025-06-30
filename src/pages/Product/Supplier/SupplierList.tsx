import { useState, useEffect } from "react";
import { Product_Service_URL } from "../../../lib/apiEndPoints";

interface Supplier {
  id: string;
  name: string;
  contactInfo: string;
  address: string;
  rating: number;
  createdAt: string;
  totalProducts: number;
}

interface SupplierStats {
  totalSuppliers: number;
  averageRating: number;
  totalProducts: number;
  averageProductsPerSupplier: number;
  topRatedSupplier: string;
}

interface SupplierListProps {
  onCreateSupplier?: () => void;
  onEditSupplier?: (supplier: Supplier) => void;
  refreshTrigger?: number;
}

// Modern green-themed styles
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f0fdf4;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #22c55e, #16a34a);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #16a34a, #15803d);
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(34, 197, 94, 0.1);
  }
  .dark .glass-card {
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  .green-gradient {
    background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  }
  .supplier-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .dark .supplier-card {
    background: linear-gradient(145deg, #1f2937, #111827);
    border: 1px solid #374151;
  }
  .supplier-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05);
  }
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
  .animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out;
  }
  .animate-slideInRight {
    animation: slideInRight 0.5s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
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

// Simple components with green theme
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
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:text-white transition-all duration-200 ${className}`}
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
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:text-white transition-all duration-200 ${className}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export default function SupplierList({ onCreateSupplier, onEditSupplier, refreshTrigger }: SupplierListProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('name');
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
    fetchSuppliers();
    fetchStats();
  }, [refreshTrigger]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(`${Product_Service_URL}/suppliers`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
        setError('');
      } else {
        setError('Failed to fetch suppliers');
      }
    } catch (err) {
      setError('Error fetching suppliers');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${Product_Service_URL}/suppliers/stats`, {
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

  const deleteSupplier = async (id: string) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${Product_Service_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        await fetchSuppliers();
        await fetchStats();
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.text();
        alert(`Failed to delete supplier: ${errorData}`);
      }
    } catch (err) {
      alert(`Error deleting supplier: ${err}`);
    }
  };

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.contactInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = filterRating === 'all' || 
                           (filterRating === 'high' && supplier.rating >= 4.0) ||
                           (filterRating === 'medium' && supplier.rating >= 2.5 && supplier.rating < 4.0) ||
                           (filterRating === 'low' && supplier.rating < 2.5);
      
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'products':
          return b.totalProducts - a.totalProducts;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const getRatingOptions = () => [
    { value: 'all', label: 'All Ratings' },
    { value: 'high', label: 'Excellent (4.0+)' },
    { value: 'medium', label: 'Good (2.5-3.9)' },
    { value: 'low', label: 'Needs Improvement (<2.5)' }
  ];

  const getSortOptions = () => [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'products', label: 'Most Products' },
    { value: 'newest', label: 'Recently Added' }
  ];

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2v15.27z"/>
        </svg>
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      );
    }
    
    return <div className="flex items-center space-x-1">{stars}</div>;
  };

  const renderSupplierCard = (supplier: Supplier, index: number) => {
    const animationClass = index % 2 === 0 ? 'animate-slideInLeft' : 'animate-slideInRight';
    
    return (
      <div key={supplier.id} className={`supplier-card transition-all duration-300 rounded-xl p-6 ${animationClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6">
          {/* Left Section - Company Info */}
          <div className="flex items-center space-x-4 flex-1 mb-4 lg:mb-0">
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{supplier.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  supplier.rating >= 4.0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : supplier.rating >= 2.5
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {supplier.rating >= 4.0 ? 'Excellent' : supplier.rating >= 2.5 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              
              <div className="flex items-center space-x-3 mb-2">
                {renderStarRating(supplier.rating)}
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {supplier.rating.toFixed(1)} rating
                </span>
              </div>
            </div>
          </div>

          {/* Center Section - Contact Details */}
          <div className="flex-1 space-y-2 mb-4 lg:mb-0">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">{supplier.contactInfo}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">{supplier.address}</span>
            </div>
          </div>

          {/* Right Section - Stats & Actions */}
          <div className="flex items-center justify-between lg:flex-col lg:items-end lg:space-y-3">
            <div className="flex items-center space-x-6 lg:flex-col lg:space-x-0 lg:space-y-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{supplier.totalProducts}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Products</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(supplier.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Added</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEditSupplier?.(supplier)}
                className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                title="Edit supplier"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(supplier.id)}
                className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                title="Delete supplier"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-teal-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-teal-900/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="green-gradient text-white p-8 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-6 lg:mb-0">
                    <h1 className="text-4xl font-bold mb-3">Supplier Network</h1>
                    <p className="text-lg text-green-100 max-w-md">
                      Manage and monitor your trusted supplier partnerships
                    </p>
                  </div>
                  <button
                    onClick={onCreateSupplier}
                    className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm flex items-center space-x-3 border border-white/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add New Supplier</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Suppliers",
                value: stats.totalSuppliers,
                icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
                color: "from-green-400 to-green-600",
                bgColor: "bg-green-50 dark:bg-green-900/20"
              },
              {
                title: "Average Rating",
                value: stats.averageRating?.toFixed(1) || '0.0',
                icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
                color: "from-yellow-400 to-yellow-600",
                bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
              },
              {
                title: "Total Products",
                value: stats.totalProducts,
                icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
                color: "from-blue-400 to-blue-600",
                bgColor: "bg-blue-50 dark:bg-blue-900/20"
              },
              {
                title: "Avg Products/Supplier",
                value: stats.averageProductsPerSupplier?.toFixed(1) || '0.0',
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                color: "from-emerald-400 to-emerald-600",
                bgColor: "bg-emerald-50 dark:bg-emerald-900/20"
              }
            ].map((stat, index) => (
              <div key={stat.title} className={`glass-card rounded-xl p-6 animate-fadeIn ${stat.bgColor} border-l-4 border-l-green-500`} style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls Section */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search suppliers by name, contact, or address..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Select
                options={getRatingOptions()}
                value={filterRating}
                onChange={setFilterRating}
                className="min-w-[200px]"
              />
              
              <Select
                options={getSortOptions()}
                value={sortBy}
                onChange={setSortBy}
                className="min-w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}

          {filteredAndSortedSuppliers.length === 0 && !loading ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">No Suppliers Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchTerm || filterRating !== 'all' 
                  ? 'No suppliers match your current search criteria. Try adjusting your filters.' 
                  : 'Start building your supplier network by adding your first trusted partner.'}
              </p>
              <button
                onClick={onCreateSupplier}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Add Your First Supplier
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedSuppliers.map((supplier, index) => renderSupplierCard(supplier, index))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Remove Supplier</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                Are you sure you want to remove this supplier from your network? This may affect associated products and order history.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-300"
                >
                  Keep Supplier
                </button>
                <button
                  onClick={() => deleteSupplier(showDeleteConfirm)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}