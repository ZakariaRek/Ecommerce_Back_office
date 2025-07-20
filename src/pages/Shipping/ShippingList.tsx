import React, { useState, useEffect } from 'react';
import { 
  ShippingService, 
  ShippingResponseDto, 
  ShippingStatus, 
  CreateShippingRequest,
  PaginatedShippingResponse 
} from '../../services/Shipping.service';

// Modern shipping-themed styles with glassmorphism
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #fef3c7;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #f59e0b, #d97706);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #d97706, #b45309);
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(245, 158, 11, 0.1);
  }
  .dark .glass-card {
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }
  .shipping-gradient {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
  }
  .shipping-card {
    background: linear-gradient(145deg, #ffffff, #fef9e7);
    border: 1px solid #fde68a;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .dark .shipping-card {
    background: linear-gradient(145deg, #1f2937, #111827);
    border: 1px solid #374151;
  }
  .shipping-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -3px rgba(245, 158, 11, 0.1), 0 4px 6px -2px rgba(245, 158, 11, 0.05);
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
  .animate-pulse-gentle {
    animation: pulseGentle 2s ease-in-out infinite;
  }
  .animate-truck {
    animation: truck 3s ease-in-out infinite;
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
  @keyframes pulseGentle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  @keyframes truck {
    0%, 100% { transform: translateX(0px); }
    50% { transform: translateX(10px); }
  }
`;

// Modern input components with shipping theme
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
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white transition-all duration-200 ${className}`}
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
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white transition-all duration-200 ${className}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const ShippingManagement: React.FC = () => {
  const [shippings, setShippings] = useState<ShippingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShippingStatus | 'all'>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, total: 0 });
  const [selectedShipping, setSelectedShipping] = useState<ShippingResponseDto | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // Create shipping form state
  const [createForm, setCreateForm] = useState<CreateShippingRequest>({
    order_id: '',
    carrier: ''
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
    fetchShippings();
  }, [pagination.offset]);

  const fetchShippings = async () => {
    try {
      setLoading(true);
      const result: PaginatedShippingResponse = await ShippingService.getAllShippings(
        pagination.limit, 
        pagination.offset
      );
      setShippings(result.shippings);
      setPagination(prev => ({ ...prev, total: result.pagination.count }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shippings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ShippingService.createShipping(createForm);
      setShowCreateModal(false);
      setCreateForm({ order_id: '', carrier: '' });
      fetchShippings(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipping');
    }
  };

  const handleStatusUpdate = async (shippingId: string, status: ShippingStatus) => {
    try {
      await ShippingService.updateShippingStatus(shippingId, {
        status,
        location: "Updated via admin panel",
        notes: `Status changed to ${ShippingService.getStatusDisplayName(status)}`
      });
      fetchShippings(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleTrackOrder = async (shipping: ShippingResponseDto) => {
    try {
      const trackingData = await ShippingService.trackOrder(shipping.id);
      setSelectedShipping({ ...shipping, tracking_history: trackingData.tracking_history });
      setShowTrackingModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking data');
    }
  };

  // Filter and search logic
  const filteredShippings = React.useMemo(() => {
    let filtered = shippings;
    
    if (searchTerm) {
      filtered = ShippingService.searchShippings(filtered, searchTerm);
    }
    
    if (statusFilter !== 'all') {
      filtered = ShippingService.filterShippingsByStatus(filtered, statusFilter);
    }
    
    if (carrierFilter !== 'all') {
      filtered = ShippingService.filterShippingsByCarrier(filtered, carrierFilter);
    }
    
    return filtered;
  }, [shippings, searchTerm, statusFilter, carrierFilter]);

  // Get unique carriers
  const carriers = React.useMemo(() => {
    const uniqueCarriers = [...new Set(shippings.map(s => s.carrier))];
    return uniqueCarriers;
  }, [shippings]);

  // Statistics
  const stats = React.useMemo(() => {
    return ShippingService.getShippingStats(shippings);
  }, [shippings]);

  const nextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const prevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  const renderShippingCard = (shipping: ShippingResponseDto, index: number) => {
    const animationClass = index % 2 === 0 ? 'animate-slideInLeft' : 'animate-slideInRight';
    
    return (
      <div key={shipping.id} className={`shipping-card transition-all duration-300 rounded-xl p-6 ${animationClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6">
          {/* Left Section - Order Info */}
          <div className="flex items-center space-x-4 flex-1 mb-4 lg:mb-0">
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-4"
                style={{ 
                  backgroundColor: ShippingService.getStatusColor(shipping.status) + '20',
                  borderColor: ShippingService.getStatusColor(shipping.status) + '40'
                }}
              >
                <span className={shipping.status === ShippingStatus.IN_TRANSIT ? 'animate-truck' : ''}>
                  {ShippingService.getStatusIcon(shipping.status)}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1">
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${ShippingService.getStatusColor(shipping.status)}20`,
                    color: ShippingService.getStatusColor(shipping.status)
                  }}
                >
                  {ShippingService.getStatusDisplayName(shipping.status)}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Order #{shipping.order_id}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse-gentle"></div>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Active
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-mono text-xs">{shipping.tracking_number}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Created {ShippingService.formatDate(shipping.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Carrier & Status Details */}
          <div className="flex-1 space-y-4 mb-4 lg:mb-0">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Carrier
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {shipping.carrier}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-amber-200">
                  <span className="text-lg">🚛</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tracking Status</div>
                  <div className="font-medium text-gray-800 dark:text-white">
                    {ShippingService.getStatusDisplayName(shipping.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex flex-col space-y-3 lg:items-end">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleTrackOrder(shipping)}
                className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors duration-200 flex items-center gap-2"
              >
                <span className="text-base">📍</span>
                Track Order
              </button>
              
              {!ShippingService.isFinalStatus(shipping.status) && (
                <div className="relative group">
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-1">
                    Update
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-max">
                    {Object.values(ShippingStatus)
                      .filter(status => status !== shipping.status)
                      .map(status => (
                      <button 
                        key={status}
                        onClick={() => handleStatusUpdate(shipping.id, status)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl transition-colors duration-200 flex items-center gap-2"
                      >
                        <span>{ShippingService.getStatusIcon(status)}</span>
                        {ShippingService.getStatusDisplayName(status)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              ID: {shipping.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-amber-800"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading shipping data...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Tracking packages worldwide</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-orange-900/20 flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl max-w-md w-full shadow-2xl border border-red-200 dark:border-red-500/20">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error Loading Shipments</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-orange-900/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="shipping-gradient text-white p-8 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-6 lg:mb-0">
                    <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                      📦 Shipping Management
                    </h1>
                    <p className="text-lg text-amber-100 max-w-md">
                      Track and manage shipments across all carriers with real-time updates
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                      <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse-gentle"></div>
                      <span className="text-sm font-medium text-amber-100">Live Tracking</span>
                    </div>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Shipment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Shipments",
              value: stats.total.toLocaleString(),
              icon: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
              color: "from-blue-400 to-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              emoji: "📦"
            },
            {
              title: "In Transit",
              value: (stats.byStatus[ShippingStatus.IN_TRANSIT] || 0).toString(),
              icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              color: "from-orange-400 to-orange-600",
              bgColor: "bg-orange-50 dark:bg-orange-900/20",
              emoji: "🚛"
            },
            {
              title: "Delivered",
              value: (stats.byStatus[ShippingStatus.DELIVERED] || 0).toString(),
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              color: "from-green-400 to-green-600",
              bgColor: "bg-green-50 dark:bg-green-900/20",
              emoji: "✅"
            },
            {
              title: "Pending",
              value: (stats.byStatus[ShippingStatus.PENDING] || 0).toString(),
              icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              color: "from-yellow-400 to-yellow-600",
              bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
              emoji: "⏳"
            }
          ].map((stat, index) => (
            <div key={stat.title} className={`glass-card rounded-xl p-6 animate-fadeIn ${stat.bgColor} border-l-4 border-l-amber-500`} style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center shadow-lg relative`}>
                  <span className="text-2xl">{stat.emoji}</span>
                  {stat.emoji === "🚛" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl animate-truck">{stat.emoji}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

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
                  placeholder="Search by Order ID, Tracking Number, or Carrier..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Select
                options={[
                  { value: 'all', label: 'All Statuses' },
                  ...Object.values(ShippingStatus).map(status => ({
                    value: status,
                    label: ShippingService.getStatusDisplayName(status)
                  }))
                ]}
                value={statusFilter as string}
                onChange={(value) => setStatusFilter(value as ShippingStatus | 'all')}
                className="min-w-[160px]"
              />
              
              <Select
                options={[
                  { value: 'all', label: 'All Carriers' },
                  ...carriers.map(carrier => ({ value: carrier, label: carrier }))
                ]}
                value={carrierFilter}
                onChange={(value) => setCarrierFilter(value)}
                className="min-w-[160px]"
              />
            </div>
          </div>
        </div>

        {/* Shipments List */}
        <div className="space-y-4">
          {filteredShippings.length === 0 && !loading ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">No Shipments Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' || carrierFilter !== 'all'
                  ? 'No shipments match your current search criteria. Try adjusting your filters.' 
                  : 'No shipments have been created yet. Create your first shipment to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShippings.map((shipping, index) => renderShippingCard(shipping, index))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredShippings.length > 0 && (
          <div className="glass-card rounded-xl p-4 flex items-center justify-between">
            <button 
              onClick={prevPage} 
              disabled={pagination.offset === 0}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Showing <span className="font-semibold text-amber-600 dark:text-amber-400">{filteredShippings.length}</span> of{' '}
                <span className="font-semibold">{pagination.total}</span> shipments
              </p>
            </div>
            
            <button 
              onClick={nextPage} 
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Create Shipping Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="shipping-gradient text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Create New Shipment
                </h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateShipping} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order ID
                </label>
                <Input
                  type="text"
                  value={createForm.order_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, order_id: e.target.value }))}
                  placeholder="Enter order ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Carrier
                </label>
                <Select
                  options={[
                    { value: '', label: 'Select a carrier' },
                    { value: 'FedEx', label: 'FedEx' },
                    { value: 'UPS', label: 'UPS' },
                    { value: 'DHL', label: 'DHL' },
                    { value: 'USPS', label: 'USPS' }
                  ]}
                  value={createForm.carrier}
                  onChange={(value) => setCreateForm(prev => ({ ...prev, carrier: value }))}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && selectedShipping && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn">
            <div className="shipping-gradient text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">📍</span>
                  Tracking Details
                </h2>
                <button 
                  onClick={() => setShowTrackingModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Shipment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Order ID</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedShipping.order_id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Tracking Number</span>
                      <p className="font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                        {selectedShipping.tracking_number}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Carrier</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedShipping.carrier}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                      <div className="mt-1">
                        <span 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${ShippingService.getStatusColor(selectedShipping.status)}20`,
                            color: ShippingService.getStatusColor(selectedShipping.status)
                          }}
                        >
                          <span>{ShippingService.getStatusIcon(selectedShipping.status)}</span>
                          {ShippingService.getStatusDisplayName(selectedShipping.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tracking History</h3>
                  {selectedShipping.tracking_history && selectedShipping.tracking_history.length > 0 ? (
                    <div className="space-y-4">
                      {selectedShipping.tracking_history.map((record, index) => (
                        <div key={record.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm"></div>
                            {index < selectedShipping.tracking_history!.length - 1 && (
                              <div className="w-0.5 h-16 bg-gradient-to-b from-amber-500 to-amber-200 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-l-amber-500 p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">{record.location}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {ShippingService.formatDate(record.timestamp)}
                                </span>
                              </div>
                              <div className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">
                                {record.status}
                              </div>
                              {record.notes && (
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {record.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📍</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No tracking history available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingManagement;