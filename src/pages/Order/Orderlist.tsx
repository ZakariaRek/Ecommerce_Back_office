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

// Modern styles with enhanced animations and effects
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #6366f1, #8b5cf6);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #4f46e5, #7c3aed);
  }
  
  .neo-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    box-shadow: 
      0 10px 30px -10px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .neo-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .dark .neo-card {
    background: linear-gradient(145deg, #1e293b, #0f172a);
    box-shadow: 
      0 10px 30px -10px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }
  
  .dark .neo-card:hover {
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  
  .glass-morphism {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }
  
  .dark .glass-morphism {
    background: rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .order-hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;
  }
  
  .order-hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    animation: shimmer 8s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  .status-timeline {
    position: relative;
    padding-left: 24px;
  }
  
  .status-timeline::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, #e5e7eb, #d1d5db);
  }
  
  .status-dot {
    position: absolute;
    left: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px;
  }
  
  .status-dot.active {
    animation: pulse-ring 2s infinite;
  }
  
  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 2px currentColor, 0 0 0 4px rgba(99, 102, 241, 0.3); }
    50% { box-shadow: 0 0 0 2px currentColor, 0 0 0 8px rgba(99, 102, 241, 0.1); }
    100% { box-shadow: 0 0 0 2px currentColor, 0 0 0 4px rgba(99, 102, 241, 0.3); }
  }
  
  .order-amount {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 800;
    font-size: 1.5rem;
  }
  
  .micro-interaction {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .micro-interaction:hover {
    transform: translateY(-2px);
  }
  
  .micro-interaction:active {
    transform: translateY(0);
  }
  
  .floating-orb {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    animation: float-orb 6s ease-in-out infinite;
  }
  
  @keyframes float-orb {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(120deg); }
    66% { transform: translateY(10px) rotate(240deg); }
  }
  
  .view-toggle {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 4px;
  }
  
  .view-toggle button {
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .view-toggle button.active {
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .list-view-item {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .list-view-item:hover {
    transform: translateX(8px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    border-color: rgba(99, 102, 241, 0.3);
  }
  
  .dark .list-view-item {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-color: rgba(51, 65, 85, 0.8);
  }
  
  .dark .list-view-item:hover {
    border-color: rgba(139, 92, 246, 0.3);
  }
  
  .order-stats {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 16px;
  }
  
  .animate-count-up {
    animation: countUp 0.8s ease-out;
  }
  
  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .status-progress {
    height: 4px;
    background: linear-gradient(90deg, #e5e7eb, #d1d5db);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }
  
  .status-progress::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399);
    border-radius: 2px;
    transition: width 0.5s ease;
  }
  
  .status-progress.pending::after { width: 12.5%; }
  .status-progress.confirmed::after { width: 25%; }
  .status-progress.processing::after { width: 50%; }
  .status-progress.shipped::after { width: 75%; }
  .status-progress.delivered::after { width: 100%; }
  .status-progress.canceled::after { width: 0%; background: linear-gradient(90deg, #ef4444, #f87171); }
  .status-progress.returned::after { width: 85%; background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .status-progress.refunded::after { width: 90%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
`;

// Enhanced Badge component
const Badge = ({ 
  children, 
  variant = 'default',
  size = 'sm',
  pulse = false
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'premium';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    premium: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${pulse ? 'animate-pulse' : ''}`}>
      {children}
    </span>
  );
};

// Status configuration
const statusConfig = {
  [OrderStatus.PENDING]: { color: 'warning', progress: 12.5, icon: '⏳' },
  [OrderStatus.CONFIRMED]: { color: 'info', progress: 25, icon: '✅' },
  [OrderStatus.PROCESSING]: { color: 'purple', progress: 50, icon: '⚙️' },
  [OrderStatus.SHIPPED]: { color: 'info', progress: 75, icon: '🚚' },
  [OrderStatus.DELIVERED]: { color: 'success', progress: 100, icon: '📦' },
  [OrderStatus.CANCELED]: { color: 'error', progress: 0, icon: '❌' },
  [OrderStatus.RETURNED]: { color: 'warning', progress: 85, icon: '↩️' },
  [OrderStatus.REFUNDED]: { color: 'purple', progress: 90, icon: '💰' }
};

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: OrderStatus): 'success' | 'warning' | 'error' | 'info' | 'purple' => {
  return statusConfig[status]?.color as 'success' | 'warning' | 'error' | 'info' | 'purple' || 'info';
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
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

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
      
      const data = await OrderService.getAllOrders();
      
      const enrichedOrders = await Promise.all(
        data.map(async (order) => {
          try {
            return await OrderService.getEnrichedOrder(order.id, true);
          } catch (error) {
            console.error(`Failed to enrich order ${order.id}:`, error);
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

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
    processing: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
    shipped: orders.filter(o => o.status === OrderStatus.SHIPPED).length,
    delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
    totalValue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    avgOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => 
                           item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
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

  // Render order card
  const renderOrderCard = (order: EnrichedOrderResponse) => (
    <div 
      key={order.id} 
      className="neo-card cursor-pointer group overflow-hidden"
      onClick={() => handleOrderClick(order)}
    >
      {/* Order Header with Status Progress */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
              #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {OrderService.formatDate(order.createdAt)}
            </p>
          </div>
          <Badge
            variant={getStatusBadgeVariant(order.status as OrderStatus)}
            size="md"
            pulse={order.status === OrderStatus.PROCESSING}
          >
            {statusConfig[order.status as OrderStatus]?.icon} {OrderService.formatOrderStatus(order.status as OrderStatus)}
          </Badge>
        </div>

        {/* Status Progress Bar */}
        <div className={`status-progress ${order.status.toLowerCase()}`}></div>
      </div>

      {/* Order Content */}
      <div className="px-6 pb-6">
        <div className="space-y-4">
          {/* Amount and Customer */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
              <p className="order-amount">
                {OrderService.formatCurrency(order.totalAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Customer</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {order.userId.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Items Preview */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Items</h4>
              <Badge variant="default" size="xs">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="space-y-2">
              {order.items.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                    {item.productName || item.product?.name || `Product ${item.productId.slice(0, 8)}...`}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">
                    ×{item.quantity}
                  </span>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{order.items.length - 2} more items
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tax</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {OrderService.formatCurrency(order.tax)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shipping</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {OrderService.formatCurrency(order.shippingCost)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Days Ago</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {OrderService.daysSinceCreated(order as Order)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => handleUpdateStatus(e, order)}
              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 text-sm flex items-center justify-center gap-1 micro-interaction"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status
            </button>
            <button
              onClick={(e) => handleGenerateInvoice(e, order)}
              disabled={isGeneratingInvoice === order.id}
              className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-colors duration-200 text-sm flex items-center justify-center gap-1 micro-interaction"
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
                className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors duration-200 text-sm flex items-center justify-center micro-interaction"
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
        </div>
      </div>
    </div>
  );

  // Render order list item
  const renderOrderListItem = (order: EnrichedOrderResponse) => (
    <div 
      key={order.id} 
      className="list-view-item cursor-pointer group p-6"
      onClick={() => handleOrderClick(order)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {statusConfig[order.status as OrderStatus]?.icon}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                #{order.id.slice(0, 8)}
              </h3>
              <Badge
                variant={getStatusBadgeVariant(order.status as OrderStatus)}
                size="sm"
              >
                {OrderService.formatOrderStatus(order.status as OrderStatus)}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customer: {order.userId.slice(0, 8)}...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {OrderService.formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {OrderService.formatCurrency(order.totalAmount)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {OrderService.daysSinceCreated(order as Order)} days ago
            </p>
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => handleUpdateStatus(e, order)}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 micro-interaction"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={(e) => handleGenerateInvoice(e, order)}
              disabled={isGeneratingInvoice === order.id}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg transition-colors duration-200 micro-interaction"
            >
              {isGeneratingInvoice === order.id ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </button>
            {OrderService.canCancelOrder(order as Order) && (
              <button
                onClick={(e) => handleCancelOrder(e, order)}
                disabled={isCanceling === order.id}
                className="p-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors duration-200 micro-interaction"
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
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="neo-card">
            <div className="order-hero text-white p-8 relative">
              <div className="floating-orb w-32 h-32 top-0 right-0 -mr-16 -mt-16"></div>
              <div className="floating-orb w-20 h-20 bottom-0 left-0 -ml-10 -mb-10" style={{animationDelay: '2s'}}></div>
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Order Management</h1>
                <p className="text-xl text-white/80">Loading your orders...</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-pink-500 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDelay: '0.5s'}}></div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Loading orders...</p>
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
          <div className="neo-card">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-8 relative">
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
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
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
        <div className="neo-card">
          {/* Enhanced Header Section */}
          <div className="order-hero text-white p-8 relative">
            <div className="floating-orb w-40 h-40 top-0 right-0 -mr-20 -mt-20"></div>
            <div className="floating-orb w-32 h-32 bottom-0 left-0 -ml-16 -mb-16" style={{animationDelay: '3s'}}></div>
            <div className="floating-orb w-24 h-24 top-1/2 left-1/4 -mt-12 -ml-12" style={{animationDelay: '1.5s'}}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-16 h-16 glass-morphism rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-5xl font-bold mb-2">Order Management</h1>
                      <p className="text-xl text-white/80">Advanced order tracking and management</p>
                    </div>
                  </div>
                </div>
                <div className="view-toggle flex items-center">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`p-3 text-white transition-all duration-200 ${viewMode === 'card' ? 'active' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 text-white transition-all duration-200 ${viewMode === 'list' ? 'active' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="order-stats">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Total Orders</span>
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white animate-count-up">{stats.total}</p>
                </div>
                <div className="order-stats">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Pending</span>
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white animate-count-up">{stats.pending}</p>
                </div>
                <div className="order-stats">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Delivered</span>
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white animate-count-up">{stats.delivered}</p>
                </div>
                <div className="order-stats">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Total Value</span>
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white animate-count-up">
                    {OrderService.formatCurrency(stats.totalValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter Section */}
          <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search orders by ID, customer, or products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
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
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
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
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="updatedAt-desc">Recently Updated</option>
                    <option value="totalAmount-desc">Highest Amount</option>
                    <option value="totalAmount-asc">Lowest Amount</option>
                  </select>
                  
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-4 py-3 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    {showAdvancedFilters ? 'Hide' : 'More'}
                  </button>
                  
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  )}
                  
                  <Badge variant="premium" size="md">
                    {sortedOrders.length} / {orders.length}
                  </Badge>
                </div>
              </div>
              
              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                </div>
              )}
            </div>
          </div>

          {/* Orders Display */}
          <div className="p-6">
            {sortedOrders.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
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
              <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {sortedOrders.map((order) => 
                  viewMode === 'card' ? renderOrderCard(order) : renderOrderListItem(order)
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="neo-card max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 relative">
              <div className="floating-orb w-16 h-16 top-0 right-0 -mr-8 -mt-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Update Status</h2>
                    <p className="text-white/80">Order #{selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <button
                    onClick={closeStatusModal}
                    className="w-8 h-8 glass-morphism rounded-full flex items-center justify-center transition-colors duration-200"
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
                    {statusConfig[selectedOrder.status as OrderStatus]?.icon} {OrderService.formatOrderStatus(selectedOrder.status as OrderStatus)}
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
                    {Object.values(OrderStatus).map(status => (
                      <option key={status} value={status}>
                        {statusConfig[status]?.icon} {OrderService.formatOrderStatus(status)}
                      </option>
                    ))}
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
          <div className="neo-card max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="order-hero text-white p-8 relative">
              <div className="floating-orb w-32 h-32 top-0 right-0 -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Order Details</h2>
                    <p className="text-white/80">Order #{selectedOrder.id}</p>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="w-10 h-10 glass-morphism rounded-full flex items-center justify-center transition-colors duration-200"
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
                          {statusConfig[selectedOrder.status as OrderStatus]?.icon} {OrderService.formatOrderStatus(selectedOrder.status as OrderStatus)}
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
                    {/* Status Progress */}
                    <div className="mt-4">
                      <div className={`status-progress ${selectedOrder.status.toLowerCase()}`}></div>
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
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      Pricing Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">Subtotal:</span>
                        <span className="text-emerald-800 dark:text-emerald-200">
                          {OrderService.formatCurrency(OrderService.calculateSubtotalFromItems(selectedOrder.items))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">Tax:</span>
                        <span className="text-emerald-800 dark:text-emerald-200">
                          {OrderService.formatCurrency(selectedOrder.tax)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">Shipping:</span>
                        <span className="text-emerald-800 dark:text-emerald-200">
                          {OrderService.formatCurrency(selectedOrder.shippingCost)}
                        </span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">Discount:</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            -{OrderService.formatCurrency(selectedOrder.discount)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-emerald-200 dark:border-emerald-700 pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Total:</span>
                          <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
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
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-emerald-300 disabled:to-teal-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
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
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-red-300 disabled:to-pink-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
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