import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { CouponService, CouponResponseDto, DiscountType, CouponPackageResponseDto } from "../../services/CrmCoupons.service";

interface CouponsListProps {
  userId?: string;
  showPurchaseSection?: boolean;
}

// Modern styles for the component
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #f59e0b, #d97706);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #d97706, #b45309);
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
  .coupon-gradient {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);
  }
  .loyalty-gradient {
    background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #3b82f6 100%);
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(3deg); }
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
  .pulse-ring {
    animation: pulse-ring 2s infinite;
  }
  @keyframes pulse-ring {
    0% {
      transform: scale(0.33);
    }
    40%, 50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: scale(1.33);
    }
  }
`;

export default function CouponsList({ userId, showPurchaseSection = false }: CouponsListProps) {
  const [coupons, setCoupons] = useState<CouponResponseDto[]>([]);
  const [packages, setPackages] = useState<CouponPackageResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [selectedType, setSelectedType] = useState<DiscountType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'expirationDate' | 'discountValue' | 'createdAt'>('expirationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [userIdInput, setUserIdInput] = useState(userId || "");
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Add the modern styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = modernStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const fetchCoupons = async (targetUserId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const [couponData, packageData] = await Promise.all([
        CouponService.getUserCoupons(targetUserId),
        showPurchaseSection ? CouponService.getAvailableCouponPackages(targetUserId) : Promise.resolve([])
      ]);
      
      setCoupons(couponData);
      setPackages(packageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCoupons(userId);
    } else {
      setLoading(false);
    }
  }, [userId, showPurchaseSection]);

  const handleUserSearch = () => {
    if (userIdInput.trim()) {
      fetchCoupons(userIdInput.trim());
    }
  };

  const handlePurchasePackage = async (packageName: string) => {
    if (!userId) return;
    
    try {
      setPurchasingPackage(packageName);
      await CouponService.purchaseCouponPackage(userId, packageName as any);
      
      await fetchCoupons(userId);
    } catch (err) {
      console.error('Error purchasing coupon package:', err);
    } finally {
      setPurchasingPackage(null);
    }
  };

  // Filter and sort coupons
  const filteredAndSortedCoupons = () => {
    let filtered = CouponService.searchCoupons(coupons, searchTerm);
    filtered = CouponService.filterCouponsByStatus(filtered, selectedStatus);
    filtered = CouponService.filterCouponsByDiscountType(filtered, selectedType);
    return CouponService.sortCoupons(filtered, sortBy, sortOrder);
  };

  const displayedCoupons = filteredAndSortedCoupons();
  const stats = CouponService.calculateCouponStats(coupons);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedStatus !== 'all' || selectedType !== 'all';

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedType('all');
    setShowAdvancedFilters(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="coupon-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Coupon Management</h1>
                <p className="text-xl text-white/80">Loading coupon data...</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Loading coupons...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 relative overflow-hidden">
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Error Loading Coupons</h1>
                <p className="text-xl text-white/80">Something went wrong while fetching data</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-6 text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Failed to Load Coupons</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
                </div>
                <button 
                  onClick={() => userId ? fetchCoupons(userId) : handleUserSearch()} 
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Main Container */}
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl animate-fade-in-up">
          
          {/* Header Section */}
          <div className="coupon-gradient text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '3s'}}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h1 className="text-4xl font-bold">Coupon Management</h1>
                  </div>
                  <p className="text-xl text-white/80">Manage loyalty coupons and rewards</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">{coupons.length} Coupons</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">{stats.active} Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Section */}
          {showPurchaseSection && packages.length > 0 && userId && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl m-6 p-6 border border-indigo-200 dark:border-indigo-800 animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200 flex items-center">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    Coupon Packages
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-300 mt-1">Purchase premium coupon packages with points</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🛍️</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div key={pkg.packageName} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">🎟️</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                          {CouponService.getPackageDisplayName(pkg.packageName as any)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                            <span className="text-orange-600 dark:text-orange-400 text-sm font-semibold">
                              {pkg.pointsCost} points
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      {pkg.description}
                    </p>
                    
                    <button
                      onClick={() => handlePurchasePackage(pkg.packageName)}
                      disabled={purchasingPackage === pkg.packageName}
                      className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-orange-300 disabled:to-red-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2 shadow-lg"
                    >
                      {purchasingPackage === pkg.packageName ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Purchasing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span>Purchase for {pkg.pointsCost} points</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {coupons.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-2xl">🎟️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Coupons</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-2xl">✅</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-2xl">💰</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Potential Savings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {CouponService.formatCurrency(stats.totalSavings)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-2xl">📊</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Used</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.used}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Section */}
          <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              {/* Main Filters Row */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search coupons by code or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="used">Used</option>
                    <option value="expired">Expired</option>
                  </select>
                  
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="all">All Types</option>
                    <option value={DiscountType.PERCENTAGE}>Percentage</option>
                    <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount</option>
                  </select>
                  
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
                  </button>
                  
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                      {displayedCoupons.length} of {coupons.length}
                    </span>
                    {hasActiveFilters && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Search (if not showing specific user) */}
              {!userId && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">User Lookup</h3>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter User ID to view coupons..."
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      className="flex-1 px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                    <button
                      onClick={handleUserSearch}
                      disabled={!userIdInput.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </button>
                  </div>
                </div>
              )}

              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
                  
                  {searchTerm && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      <span>Search: "{searchTerm}"</span>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {selectedStatus !== 'all' && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                      <span>Status: {selectedStatus}</span>
                      <button
                        onClick={() => setSelectedStatus('all')}
                        className="w-4 h-4 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center hover:bg-green-300 dark:hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {selectedType !== 'all' && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                      <span>Type: {selectedType.replace('_', ' ')}</span>
                      <button
                        onClick={() => setSelectedType('all')}
                        className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 animate-fade-in-up">
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    Advanced Coupon Filters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                        Sort By
                      </label>
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-');
                          setSortBy(field as any);
                          setSortOrder(order as 'asc' | 'desc');
                        }}
                        className="w-full px-4 py-3 border border-orange-300 dark:border-orange-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      >
                        <option value="expirationDate-asc">Expiring Soon</option>
                        <option value="expirationDate-desc">Expiring Later</option>
                        <option value="discountValue-desc">Highest Value</option>
                        <option value="discountValue-asc">Lowest Value</option>
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Main Table */}
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02]">
                <TableRow className="border-b border-gray-200/60 dark:border-white/[0.08]">
                  <TableCell
                    isHeader
                    className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
                  >
                    Coupon Details
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
                  >
                    Discount & Requirements
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
                  >
                    Status & Usage
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
                  >
                    Expiration
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-200/60 dark:divide-white/[0.08]">
                {displayedCoupons.map((coupon) => {
                  const statusColor = CouponService.getCouponStatusColor(coupon);
                  const statusText = CouponService.getCouponStatusText(coupon);
                  
                  return (
                    <TableRow 
                      key={coupon.id} 
                      className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg">🎟️</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                              {coupon.code}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {CouponService.generateCouponDescription(coupon)}
                            </div>
                            <Badge
                              size="sm"
                              color={
                                coupon.discountType === DiscountType.PERCENTAGE ? "info" : "success"
                              }
                            >
                              {CouponService.getDiscountTypeDisplayName(coupon.discountType)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {CouponService.formatCouponValue(coupon)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Min purchase: {CouponService.formatCurrency(coupon.minPurchaseAmount)}
                          </div>
                          {coupon.maxDiscountAmount && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Max discount: {CouponService.formatCurrency(coupon.maxDiscountAmount)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-5">
                        <div className="space-y-2">
                          <Badge
                            size="sm"
                            color={
                              statusColor === 'green' ? 'success' :
                              statusColor === 'orange' ? 'warning' :
                              statusColor === 'red' ? 'error' : 'gray'
                            }
                          >
                            {statusText}
                          </Badge>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Usage: {coupon.isUsed ? 'Used' : `0/${coupon.usageLimit}`}
                          </div>
                          {coupon.stackable && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Stackable
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-5">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {CouponService.formatDate(coupon.expirationDate)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Empty States */}
          {displayedCoupons.length === 0 && !loading && coupons.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">🎟️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {!userId ? "Enter a User ID to view coupons" : "No coupons found"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {!userId ? "Search for a user to see their available coupons" : "This user hasn't earned any coupons yet"}
                </p>
              </div>
            </div>
          )}

          {displayedCoupons.length === 0 && coupons.length > 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No coupons match your filters</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search criteria</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}