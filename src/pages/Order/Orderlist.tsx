import { useState, useEffect } from "react";
import { 
  OrderService, 
  Order,
  OrderStatus,
  EnrichedOrderResponse,
  BatchOrderResponse,
  OrderItem,
  EnrichedOrderItem,
  UpdateOrderStatusRequest,
  Invoice,
  UserOrdersParams
} from "../../services/order.service";

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
  .order-gradient {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  }
  .status-gradient {
    background: linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%);
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
`;

// Badge component
const Badge = ({ 
  children, 
  variant = 'default',
  size = 'sm' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: OrderStatus): 'success' | 'warning' | 'error' | 'info' | 'purple' => {
  switch (status) {
    case OrderStatus.DELIVERED:
      return 'success';
    case OrderStatus.PENDING:
    case OrderStatus.CONFIRMED:
      return 'warning';
    case OrderStatus.CANCELED:
    case OrderStatus.REFUNDED:
      return 'error';
    case OrderStatus.SHIPPED:
      return 'info';
    case OrderStatus.PROCESSING:
    case OrderStatus.RETURNED:
      return 'purple';
    default:
      return 'info';
  }
};

export default function OrderList() {
  const [orders, setOrders] = useState<EnrichedOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<EnrichedOrderResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'totalAmount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For demo purposes, we'll get all orders. In a real app, you'd filter by user
      const data = await OrderService.getAllOrders();
      
      // Convert to enriched orders by getting enriched data for each order
      const enrichedOrders = await Promise.all(
        data.map(async (order) => {
          try {
            return await OrderService.getEnrichedOrder(order.id, true);
          } catch (error) {
            console.error(`Failed to enrich order ${order.id}:`, error);
            // Return a basic enriched order structure
            return {
              ...order,
              items: order.items?.map(item => ({
                ...item,
                product: undefined,
                productName: undefined,
                productImage: undefined
              })) || []
            } as EnrichedOrderResponse;
          }
        })
      );
      
      setOrders(enrichedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setShowAdvancedFilters(false);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || 
                          startDate || endDate || minAmount || maxAmount;

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => 
                           item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Date filtering
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    let matchesDate = true;
    
    if (dateFilter !== 'all') {
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= monthAgo;
          break;
        case 'custom':
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          matchesDate = orderDate >= start && orderDate <= end;
          break;
      }
    }
    
    // Amount filtering
    const minVal = parseFloat(minAmount) || 0;
    const maxVal = parseFloat(maxAmount) || Infinity;
    const matchesAmount = order.totalAmount >= minVal && order.totalAmount <= maxVal;
    
    return matchesSearch && matchesStatus && matchesDate && matchesAmount;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      case 'totalAmount':
        aValue = a.totalAmount;
        bValue = b.totalAmount;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Order actions
  const handleOrderClick = (order: EnrichedOrderResponse) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = (e: React.MouseEvent, order: EnrichedOrderResponse) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setSelectedStatus(order.status as OrderStatus);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    // Validate status transition
    const validation = OrderService.validateStatusTransition(
      selectedOrder.status as OrderStatus, 
      selectedStatus
    );
    
    if (!validation.valid) {
      alert(`Status Update Error: ${validation.error}`);
      return;
    }

    setIsUpdatingStatus(true);

    try {
      await OrderService.updateOrderStatus(selectedOrder.id, { status: selectedStatus });
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, status: selectedStatus } : o
      ));
      
      setShowStatusModal(false);
      setSelectedOrder(null);
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async (e: React.MouseEvent, order: EnrichedOrderResponse) => {
    e.stopPropagation();
    
    if (!OrderService.canCancelOrder(order as Order)) {
      alert('This order cannot be cancelled in its current status.');
      return;
    }

    if (!confirm(`Are you sure you want to cancel order #${order.id.slice(0, 8)}?`)) {
      return;
    }

    setIsCanceling(order.id);
    
    try {
      await OrderService.cancelOrder(order.id);
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status: OrderStatus.CANCELED } : o
      ));
      
      alert('Order cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCanceling(null);
    }
  };

  const handleGenerateInvoice = async (e: React.MouseEvent, order: EnrichedOrderResponse) => {
    e.stopPropagation();
    setIsGeneratingInvoice(order.id);
    
    try {
      const invoice = await OrderService.generateInvoice(order.id);
      
      // Open invoice in new tab
      if (invoice.downloadUrl) {
        window.open(invoice.downloadUrl, '_blank');
      } else {
        alert('Invoice generated successfully!');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert(`Failed to generate invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingInvoice(null);
    }
  };

  // Modal close handlers
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="order-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Order Management</h1>
                <p className="text-xl text-white/80">Loading your orders...</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Loading orders...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 relative overflow-hidden">
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Error Loading Orders</h1>
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
                  <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Failed to Load Orders</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl animate-fade-in-up">
          {/* Header Section */}
          <div className="order-gradient text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '3s'}}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h1 className="text-4xl font-bold">Order Management</h1>
                  </div>
                  <p className="text-xl text-white/80">Track and manage customer orders</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">{orders.length} Orders</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">
                      {OrderService.formatCurrency(OrderService.calculateTotalValue(orders as Order[]))} Total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                      placeholder="Search orders by ID, user, or products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value={OrderStatus.PENDING}>Pending</option>
                    <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                    <option value={OrderStatus.PROCESSING}>Processing</option>
                    <option value={OrderStatus.SHIPPED}>Shipped</option>
                    <option value={OrderStatus.DELIVERED}>Delivered</option>
                    <option value={OrderStatus.CANCELED}>Canceled</option>
                    <option value={OrderStatus.RETURNED}>Returned</option>
                    <option value={OrderStatus.REFUNDED}>Refunded</option>
                  </select>
                  
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field as 'createdAt' | 'updatedAt' | 'totalAmount');
                      setSortOrder(order as 'asc' | 'desc');
                    }}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="updatedAt-desc">Recently Updated</option>
                    <option value="totalAmount-desc">Highest Amount</option>
                    <option value="totalAmount-asc">Lowest Amount</option>
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
                  
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                      {sortedOrders.length} of {orders.length}
                    </span>
                    {hasActiveFilters && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 animate-fade-in-up">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    Advanced Filters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Custom Date Range */}
                    {dateFilter === 'custom' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          />
                        </div>
                      </>
                    )}
                    
                    {/* Amount Range */}
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                        Min Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                        Max Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="No limit"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  {/* Quick Filter Buttons */}
                  <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-3">Quick Filters:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setStatusFilter(OrderStatus.PENDING);
                          setDateFilter('today');
                        }}
                        className="px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Today's Pending
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter(OrderStatus.SHIPPED);
                          setDateFilter('week');
                        }}
                        className="px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Recently Shipped
                      </button>
                      <button
                        onClick={() => {
                          setMinAmount('100');
                          setMaxAmount('');
                        }}
                        className="px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        High Value ($100+)
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter(OrderStatus.DELIVERED);
                          setDateFilter('month');
                        }}
                        className="px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Recently Delivered
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Orders Grid */}
          <div className="p-6">
            {sortedOrders.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    {hasActiveFilters ? (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {hasActiveFilters ? 'No orders match your filters' : 'No orders found'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {hasActiveFilters 
                      ? 'Try adjusting your search criteria or clearing some filters' 
                      : 'Orders will appear here when customers start placing them'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                    onClick={() => handleOrderClick(order)}
                  >
                    {/* Order Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 animate-float"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</h3>
                          <Badge
                            variant={getStatusBadgeVariant(order.status as OrderStatus)}
                            size="sm"
                          >
                            {OrderService.formatOrderStatus(order.status as OrderStatus)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-white/80">
                          <span>User: {order.userId.slice(0, 8)}...</span>
                          <span>{OrderService.formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Content */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {/* Total Amount */}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {OrderService.formatCurrency(order.totalAmount)}
                          </span>
                        </div>

                        {/* Order Items Preview */}
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Items ({order.items.length}):
                          </span>
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400 truncate">
                                  {item.productName || item.product?.name || `Product ${item.productId.slice(0, 8)}...`}
                                </span>
                                <span className="text-gray-500 dark:text-gray-500">
                                  ×{item.quantity}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                +{order.items.length - 2} more items
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Tax:</span> {OrderService.formatCurrency(order.tax)}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Shipping:</span> {OrderService.formatCurrency(order.shippingCost)}
                          </div>
                          {order.discount > 0 && (
                            <div className="text-green-600 dark:text-green-400 col-span-2">
                              <span className="font-medium">Discount:</span> -{OrderService.formatCurrency(order.discount)}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => handleUpdateStatus(e, order)}
                            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 text-sm flex items-center justify-center gap-1"
                            title="Update status"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Status
                          </button>
                          <button
                            onClick={(e) => handleGenerateInvoice(e, order)}
                            disabled={isGeneratingInvoice === order.id}
                            className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors duration-200 text-sm flex items-center justify-center gap-1"
                            title="Generate invoice"
                          >
                            {isGeneratingInvoice === order.id ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            Invoice
                          </button>
                          {OrderService.canCancelOrder(order as Order) && (
                            <button
                              onClick={(e) => handleCancelOrder(e, order)}
                              disabled={isCanceling === order.id}
                              className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors duration-200 text-sm flex items-center justify-center"
                              title="Cancel order"
                            >
                              {isCanceling === order.id ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Updated Date */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Updated: {OrderService.formatDate(order.updatedAt)}</span>
                            <span>
                              {OrderService.daysSinceCreated(order as Order)} days ago
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-md w-full shadow-2xl">
            <div className="status-gradient text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Update Status</h2>
                    <p className="text-white/80">Order #{selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <button
                    onClick={closeStatusModal}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Status
                  </label>
                  <Badge
                    variant={getStatusBadgeVariant(selectedOrder.status as OrderStatus)}
                    size="md"
                  >
                    {OrderService.formatOrderStatus(selectedOrder.status as OrderStatus)}
                  </Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value={OrderStatus.PENDING}>Pending</option>
                    <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                    <option value={OrderStatus.PROCESSING}>Processing</option>
                    <option value={OrderStatus.SHIPPED}>Shipped</option>
                    <option value={OrderStatus.DELIVERED}>Delivered</option>
                    <option value={OrderStatus.CANCELED}>Canceled</option>
                    <option value={OrderStatus.RETURNED}>Returned</option>
                    <option value={OrderStatus.REFUNDED}>Refunded</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeStatusModal}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus || selectedStatus === selectedOrder.status}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-purple-300 disabled:to-pink-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="order-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Order Details</h2>
                    <p className="text-white/80">Order #{selectedOrder.id}</p>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Order Information */}
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      Order Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-purple-700 dark:text-purple-300">Status:</span>
                        <Badge
                          variant={getStatusBadgeVariant(selectedOrder.status as OrderStatus)}
                          size="md"
                        >
                          {OrderService.formatOrderStatus(selectedOrder.status as OrderStatus)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-purple-700 dark:text-purple-300">Total Amount:</span>
                        <span className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                          {OrderService.formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-purple-700 dark:text-purple-300">Created:</span>
                        <span className="text-purple-800 dark:text-purple-200">
                          {OrderService.formatDate(selectedOrder.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-purple-700 dark:text-purple-300">Updated:</span>
                        <span className="text-purple-800 dark:text-purple-200">
                          {OrderService.formatDate(selectedOrder.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-blue-700 dark:text-blue-300">User ID:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1 font-mono">{selectedOrder.userId}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700 dark:text-blue-300">Billing Address ID:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1 font-mono text-sm">{selectedOrder.billingAddressId}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700 dark:text-blue-300">Shipping Address ID:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1 font-mono text-sm">{selectedOrder.shippingAddressId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      Pricing Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-green-700 dark:text-green-300">Subtotal:</span>
                        <span className="text-green-800 dark:text-green-200">
                          {OrderService.formatCurrency(OrderService.calculateSubtotalFromItems(selectedOrder.items))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-green-700 dark:text-green-300">Tax:</span>
                        <span className="text-green-800 dark:text-green-200">
                          {OrderService.formatCurrency(selectedOrder.tax)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-green-700 dark:text-green-300">Shipping:</span>
                        <span className="text-green-800 dark:text-green-200">
                          {OrderService.formatCurrency(selectedOrder.shippingCost)}
                        </span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="font-medium text-green-700 dark:text-green-300">Discount:</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            -{OrderService.formatCurrency(selectedOrder.discount)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-green-200 dark:border-green-700 pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-bold text-green-700 dark:text-green-300">Total:</span>
                          <span className="text-2xl font-bold text-green-800 dark:text-green-200">
                            {OrderService.formatCurrency(selectedOrder.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Order Items */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                    <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      Order Items ({selectedOrder.items.length})
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-orange-800 dark:text-orange-200">
                                {item.productName || item.product?.name || `Product ID: ${item.productId.slice(0, 8)}...`}
                              </h4>
                              <p className="text-sm text-orange-600 dark:text-orange-400">
                                Product ID: {item.productId}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-800 dark:text-orange-200">
                                {OrderService.formatCurrency(item.total)}
                              </p>
                              <p className="text-sm text-orange-600 dark:text-orange-400">
                                {OrderService.formatCurrency(item.priceAtPurchase)} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-orange-700 dark:text-orange-300">Quantity:</span>
                              <p className="text-orange-800 dark:text-orange-200">{item.quantity}</p>
                            </div>
                            <div>
                              <span className="font-medium text-orange-700 dark:text-orange-300">Unit Price:</span>
                              <p className="text-orange-800 dark:text-orange-200">{OrderService.formatCurrency(item.priceAtPurchase)}</p>
                            </div>
                            {item.discount > 0 && (
                              <div className="col-span-2">
                                <span className="font-medium text-orange-700 dark:text-orange-300">Item Discount:</span>
                                <p className="text-red-600 dark:text-red-400">{OrderService.formatCurrency(item.discount)}</p>
                              </div>
                            )}
                          </div>
                          {item.product && (
                            <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
                              <div className="grid grid-cols-2 gap-2 text-xs text-orange-600 dark:text-orange-400">
                                <div>
                                  <span className="font-medium">Status:</span> {item.product.status}
                                </div>
                                <div>
                                  <span className="font-medium">Stock:</span> {item.product.availableQuantity}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDetailModal();
                        handleUpdateStatus(e, selectedOrder);
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Update Status
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDetailModal();
                        handleGenerateInvoice(e, selectedOrder);
                      }}
                      disabled={isGeneratingInvoice === selectedOrder.id}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      {isGeneratingInvoice === selectedOrder.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Generate Invoice
                        </>
                      )}
                    </button>
                    {OrderService.canCancelOrder(selectedOrder as Order) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeDetailModal();
                          handleCancelOrder(e, selectedOrder);
                        }}
                        disabled={isCanceling === selectedOrder.id}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        {isCanceling === selectedOrder.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Canceling...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Order
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}