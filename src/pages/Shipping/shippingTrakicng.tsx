import React, { useState, useEffect } from 'react';
import { 
  TrackingService, 
  TrackingResponseDto, 
  TrackingHistoryResponse,
  CreateTrackingRequest,
  AddTrackingUpdateRequest,
  TrackingWithShippingResponse,
  TrackingStatus
} from '../../services/ShippingTracking.service';

// Modern tracking-themed styles with journey/timeline focus
const trackingStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #e0e7ff;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #8b5cf6, #7c3aed);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #7c3aed, #6d28d9);
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(139, 92, 246, 0.1);
  }
  .dark .glass-card {
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.2);
  }
  .tracking-gradient {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  }
  .timeline-card {
    background: linear-gradient(145deg, #ffffff, #faf5ff);
    border: 1px solid #e9d5ff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .dark .timeline-card {
    background: linear-gradient(145deg, #1f2937, #111827);
    border: 1px solid #374151;
  }
  .timeline-card:hover {
    transform: translateX(4px);
    box-shadow: 0 10px 25px -3px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05);
  }
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
  .animate-slideInUp {
    animation: slideInUp 0.5s ease-out;
  }
  .animate-slideInDown {
    animation: slideInDown 0.5s ease-out;
  }
  .animate-pulse-gentle {
    animation: pulseGentle 2s ease-in-out infinite;
  }
  .animate-ping-slow {
    animation: pingSlow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .animate-location-pin {
    animation: locationPin 2s ease-in-out infinite;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(-30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseGentle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  @keyframes pingSlow {
    75%, 100% { transform: scale(1.1); opacity: 0; }
  }
  @keyframes locationPin {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-8px) scale(1.05); }
  }
`;

// Modern input components with tracking theme
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
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200 ${className}`}
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
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200 ${className}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const TrackingManagement: React.FC = () => {
  const [trackingHistory, setTrackingHistory] = useState<TrackingResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedShippingId, setSelectedShippingId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<TrackingWithShippingResponse | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateTrackingRequest>({
    shipping_id: '',
    location: '',
    status: '',
    notes: ''
  });

  const [updateForm, setUpdateForm] = useState<AddTrackingUpdateRequest>({
    location: '',
    status: '',
    notes: ''
  });

  useEffect(() => {
    // Inject custom styles
    const styleElement = document.createElement('style');
    styleElement.textContent = trackingStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Load tracking history when shipping ID is selected
  useEffect(() => {
    if (selectedShippingId) {
      fetchTrackingHistory(selectedShippingId);
    }
  }, [selectedShippingId]);

  const fetchTrackingHistory = async (shippingId: string) => {
    try {
      setLoading(true);
      const result: TrackingHistoryResponse = await TrackingService.getTrackingHistory(shippingId);
      setTrackingHistory(result.tracking_history);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking history');
      setTrackingHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await TrackingService.createTracking(createForm);
      setShowCreateModal(false);
      setCreateForm({ shipping_id: '', location: '', status: '', notes: '' });
      if (selectedShippingId) {
        fetchTrackingHistory(selectedShippingId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tracking');
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShippingId) return;
    
    try {
      await TrackingService.addTrackingUpdate(selectedShippingId, updateForm);
      setShowUpdateModal(false);
      setUpdateForm({ location: '', status: '', notes: '' });
      fetchTrackingHistory(selectedShippingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tracking update');
    }
  };

  const handleViewDetails = async (trackingId: string) => {
    try {
      const details = await TrackingService.getTrackingWithShipping(trackingId);
      setSelectedTracking(details);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking details');
    }
  };

  const handleDeleteTracking = async (trackingId: string) => {
    if (!window.confirm('Are you sure you want to delete this tracking record?')) {
      return;
    }
    
    try {
      await TrackingService.deleteTracking(trackingId);
      if (selectedShippingId) {
        fetchTrackingHistory(selectedShippingId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tracking');
    }
  };

  // Filter and search logic
  const filteredTracking = React.useMemo(() => {
    let filtered = trackingHistory;
    
    if (searchTerm) {
      filtered = TrackingService.searchTrackingHistory(filtered, searchTerm);
    }
    
    if (statusFilter !== 'all') {
      filtered = TrackingService.filterTrackingByStatus(filtered, statusFilter);
    }
    
    if (locationFilter !== 'all') {
      filtered = TrackingService.filterTrackingByLocation(filtered, locationFilter);
    }
    
    return TrackingService.sortTracking(filtered, 'timestamp', 'desc');
  }, [trackingHistory, searchTerm, statusFilter, locationFilter]);

  // Get unique statuses and locations
  const uniqueStatuses = React.useMemo(() => {
    return [...new Set(trackingHistory.map(t => t.status))];
  }, [trackingHistory]);

  const uniqueLocations = React.useMemo(() => {
    return TrackingService.getCommonLocations(trackingHistory);
  }, [trackingHistory]);

  // Statistics
  const stats = React.useMemo(() => {
    return TrackingService.getTrackingStats(trackingHistory);
  }, [trackingHistory]);

  const renderTimelineItem = (record: TrackingResponseDto, index: number) => {
    const isLast = index === filteredTracking.length - 1;
    const animationClass = index % 2 === 0 ? 'animate-slideInUp' : 'animate-slideInDown';
    
    return (
      <div key={record.id} className={`relative ${animationClass}`} style={{animationDelay: `${index * 0.1}s`}}>
        {/* Timeline Line */}
        {!isLast && (
          <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-purple-400 to-purple-200 dark:from-purple-500 dark:to-purple-700"></div>
        )}
        
        {/* Timeline Node */}
        <div className="absolute left-4 top-6 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-4 border-white dark:border-gray-900 shadow-lg z-10 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse-gentle"></div>
          {/* Ping effect for latest record */}
          {index === 0 && (
            <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping-slow"></div>
          )}
        </div>
        
        {/* Timeline Content */}
        <div className="ml-20 mb-8">
          <div className="timeline-card rounded-xl p-6 transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
              <div className="flex-1 mb-4 lg:mb-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-lg animate-location-pin">📍</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {TrackingService.formatLocation(record.location)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${TrackingService.getStatusColor(record.status)}20`,
                          color: TrackingService.getStatusColor(record.status)
                        }}
                      >
                        <span>{TrackingService.getStatusIcon(record.status)}</span>
                        {TrackingService.getStatusDisplayName(record.status)}
                      </span>
                      {index === 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-gentle"></span>
                          Latest
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{TrackingService.formatDate(record.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-mono text-xs">ID: {record.id.slice(0, 8)}...</span>
                  </div>
                </div>
                
                {record.notes && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-3 mb-3">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-purple-700 dark:text-purple-300">Note:</span> {record.notes}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 lg:ml-4">
                <button 
                  onClick={() => handleViewDetails(record.id)}
                  className="px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200 flex items-center gap-1"
                >
                  <span className="text-sm">👁️</span>
                  Details
                </button>
                <button 
                  onClick={() => handleDeleteTracking(record.id)}
                  className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 flex items-center gap-1"
                >
                  <span className="text-sm">🗑️</span>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading tracking data...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Mapping the journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="tracking-gradient text-white p-8 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-6 lg:mb-0">
                    <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                      📍 Tracking Management
                    </h1>
                    <p className="text-lg text-purple-100 max-w-md">
                      Monitor package journeys with real-time location updates and status tracking
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                      <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse-gentle"></div>
                      <span className="text-sm font-medium text-purple-100">Live Tracking</span>
                    </div>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping ID Selector */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shipping ID
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <Input
                  type="text"
                  value={selectedShippingId}
                  onChange={(e) => setSelectedShippingId(e.target.value)}
                  placeholder="Enter shipping ID to view tracking history"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              {selectedShippingId && (
                <button 
                  onClick={() => fetchTrackingHistory(selectedShippingId)}
                  className="px-4 py-3 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              )}
              {selectedShippingId && (
                <button 
                  onClick={() => setShowUpdateModal(true)}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Update
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {trackingHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Records",
                value: stats.total.toLocaleString(),
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                color: "from-purple-400 to-purple-600",
                bgColor: "bg-purple-50 dark:bg-purple-900/20",
                emoji: "📊"
              },
              {
                title: "Unique Locations",
                value: Object.keys(stats.byLocation).length.toString(),
                icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
                color: "from-indigo-400 to-indigo-600",
                bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
                emoji: "📍"
              },
              {
                title: "Status Types",
                value: Object.keys(stats.byStatus).length.toString(),
                icon: "M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8v8m5-13H9m1.5-1.5L15 8m0 0l-5 5m5-5v6",
                color: "from-violet-400 to-violet-600",
                bgColor: "bg-violet-50 dark:bg-violet-900/20",
                emoji: "📋"
              },
              {
                title: "Days Tracked",
                value: stats.timeRange 
                  ? Math.ceil((new Date(stats.timeRange.latest).getTime() - new Date(stats.timeRange.earliest).getTime()) / (1000 * 60 * 60 * 24)).toString()
                  : "0",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                color: "from-pink-400 to-pink-600",
                bgColor: "bg-pink-50 dark:bg-pink-900/20",
                emoji: "⏱️"
              }
            ].map((stat, index) => (
              <div key={stat.title} className={`glass-card rounded-xl p-6 animate-fadeIn ${stat.bgColor} border-l-4 border-l-purple-500`} style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl">{stat.emoji}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {trackingHistory.length > 0 && (
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
                    placeholder="Search by location, status, or notes..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Select
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    ...uniqueStatuses.map(status => ({ value: status, label: status }))
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  className="min-w-[160px]"
                />
                
                <Select
                  options={[
                    { value: 'all', label: 'All Locations' },
                    ...uniqueLocations.slice(0, 10).map(location => ({ value: location, label: location }))
                  ]}
                  value={locationFilter}
                  onChange={(value) => setLocationFilter(value)}
                  className="min-w-[160px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="glass-card rounded-xl p-4 border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Empty States */}
        {!selectedShippingId && (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
              <span className="text-4xl animate-location-pin">📍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Track Package Journey</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Enter a shipping ID above to view the complete tracking timeline and location history
            </p>
          </div>
        )}

        {selectedShippingId && trackingHistory.length === 0 && !loading && (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
              <span className="text-4xl">📍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">No Tracking Records</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              No tracking records found for this shipping ID. Create the first tracking entry to start monitoring.
            </p>
          </div>
        )}

        {/* Timeline */}
        {!loading && filteredTracking.length > 0 && (
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    🗺️ Journey Timeline
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {filteredTracking.length} tracking updates for shipment {selectedShippingId.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-gentle"></div>
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Live Updates</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {filteredTracking.map((record, index) => renderTimelineItem(record, index))}
            </div>
          </div>
        )}
      </div>

      {/* Create Tracking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="tracking-gradient text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">📍</span>
                  Create Tracking Record
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
            
            <form onSubmit={handleCreateTracking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shipping ID
                </label>
                <Input
                  type="text"
                  value={createForm.shipping_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, shipping_id: e.target.value }))}
                  placeholder="Enter shipping ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <Input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <Select
                  options={[
                    { value: '', label: 'Select status' },
                    ...Object.values(TrackingStatus).map(status => ({ value: status, label: status })),
                    { value: 'Custom', label: 'Custom Status' }
                  ]}
                  value={createForm.status}
                  onChange={(value) => setCreateForm(prev => ({ ...prev, status: value }))}
                />
              </div>
              
              {createForm.status === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Status
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter custom status"
                    onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value }))}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes"
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200"
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
                >
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="tracking-gradient text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">📍</span>
                  Add Tracking Update
                </h2>
                <button 
                  onClick={() => setShowUpdateModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <Input
                  type="text"
                  value={updateForm.location}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <Select
                  options={[
                    { value: '', label: 'Select status' },
                    ...Object.values(TrackingStatus).map(status => ({ value: status, label: status }))
                  ]}
                  value={updateForm.status}
                  onChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes"
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
                >
                  Add Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTracking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn">
            <div className="tracking-gradient text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">📍</span>
                  Tracking Details
                </h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
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
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Shipping Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Shipping ID</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedTracking.shipping.id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Order ID</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedTracking.shipping.order_id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Carrier</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedTracking.shipping.carrier}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Tracking Number</span>
                      <p className="font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                        {selectedTracking.shipping.tracking_number}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tracking Record</h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-l-purple-500 p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
                        <p className="font-medium text-gray-900 dark:text-white">{TrackingService.formatLocation(selectedTracking.tracking.location)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                        <div className="mt-1">
                          <span 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${TrackingService.getStatusColor(selectedTracking.tracking.status)}20`,
                              color: TrackingService.getStatusColor(selectedTracking.tracking.status)
                            }}
                          >
                            <span>{TrackingService.getStatusIcon(selectedTracking.tracking.status)}</span>
                            {TrackingService.getStatusDisplayName(selectedTracking.tracking.status)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Timestamp</span>
                        <p className="font-medium text-gray-900 dark:text-white">{TrackingService.formatDate(selectedTracking.tracking.timestamp)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
                        <p className="font-medium text-gray-900 dark:text-white">{TrackingService.formatDate(selectedTracking.tracking.created_at)}</p>
                      </div>
                    </div>
                    
                    {selectedTracking.tracking.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Notes</span>
                        <p className="mt-1 text-gray-700 dark:text-gray-300">{selectedTracking.tracking.notes}</p>
                      </div>
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
};

export default TrackingManagement;