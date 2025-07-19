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
  userId?: string; // If provided, show coupons for specific user
  showPurchaseSection?: boolean; // Whether to show coupon purchase options
}

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
      
      // Refresh coupons and packages
      await fetchCoupons(userId);
    } catch (err) {
      console.error('Error purchasing coupon package:', err);
      // Handle error (could show toast notification)
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

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm dark:border-white/[0.08] dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading coupons...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-200/60 bg-white shadow-sm dark:border-red-500/20 dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-red-600 dark:text-red-400 font-medium">Error loading coupons</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={() => userId ? fetchCoupons(userId) : handleUserSearch()} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Purchase Section */}
      {showPurchaseSection && packages.length > 0 && userId && (
        <div className="bg-white dark:bg-gray-900/40 rounded-xl p-6 border border-gray-200/60 dark:border-white/[0.08]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase Coupon Packages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.packageName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 text-lg">🎟️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {CouponService.getPackageDisplayName(pkg.packageName as any)}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pkg.pointsCost} points
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                  {pkg.description}
                </p>
                <button
                  onClick={() => handlePurchasePackage(pkg.packageName)}
                  disabled={purchasingPackage === pkg.packageName}
                  className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {purchasingPackage === pkg.packageName ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Purchasing...
                    </div>
                  ) : (
                    `Purchase for ${pkg.pointsCost} points`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {coupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-lg">🎟️</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Coupons</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-lg">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Potential Savings</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {CouponService.formatCurrency(stats.totalSavings)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-400 text-lg">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Used</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.used}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-gray-900/40">
        <div className="px-6 py-5 border-b border-gray-200/60 dark:border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Coupons</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {displayedCoupons.length} of {coupons.length} coupons shown
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Coupon System</span>
              </div>
            </div>
          </div>

          {/* User Search (if not showing specific user) */}
          {!userId && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter User ID to view coupons..."
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleUserSearch}
                  disabled={!userIdInput.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value={DiscountType.PERCENTAGE}>Percentage</option>
              <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                          <span className="text-orange-600 dark:text-orange-400 text-lg">🎟️</span>
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

        {displayedCoupons.length === 0 && !loading && coupons.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                {!userId ? "Enter a User ID to view coupons" : "No coupons found"}
              </p>
            </div>
          </div>
        )}

        {displayedCoupons.length === 0 && coupons.length > 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No coupons match your filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}