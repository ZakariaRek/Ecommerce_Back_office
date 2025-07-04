import { useState, useEffect } from 'react';

// Modern styles matching your ProductList component
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
  .rate-limit-gradient {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);
  }
  .security-gradient {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
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
  @keyframes pulse-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  }
  .animate-pulse-red {
    animation: pulse-red 2s infinite;
  }
`;

// Badge component
const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
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

export default function RateLimitingDashboard() {
  const [rateLimitData, setRateLimitData] = useState(null);
  const [rateLimitStats, setRateLimitStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Modal and form states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showBulkResetModal, setShowBulkResetModal] = useState(false);
  const [rateLimitIdentifier, setRateLimitIdentifier] = useState('');
  const [rateLimitKeyType, setRateLimitKeyType] = useState('IP');
  const [userRateLimitStatus, setUserRateLimitStatus] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

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
    fetchRateLimitData();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchRateLimitData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchRateLimitData = async () => {
    try {
      setError(null);
      
      const [configResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:8099/api/gateway/rate-limiting/config'),
        fetch('http://localhost:8099/api/gateway/rate-limiting/stats')
      ]);

      if (!configResponse.ok || !statsResponse.ok) {
        throw new Error('Rate limiting endpoints are not available');
      }

      const [configData, statsData] = await Promise.all([
        configResponse.json(),
        statsResponse.json()
      ]);

      setRateLimitData(configData);
      setRateLimitStats(statsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching rate limiting data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRateLimitStatus = async (keyType, identifier) => {
    try {
      const response = await fetch(`http://localhost:8099/api/gateway/rate-limiting/status/${keyType}/${identifier}`);
      if (response.ok) {
        const data = await response.json();
        setUserRateLimitStatus(data);
      } else {
        setUserRateLimitStatus(null);
        alert('No rate limit data found for this identifier');
      }
    } catch (error) {
      console.error('Error fetching rate limit status:', error);
      alert('Failed to fetch rate limit status');
    }
  };

  const resetUserRateLimit = async (keyType, identifier) => {
    if (!confirm(`Are you sure you want to reset all rate limits for ${keyType}: ${identifier}?`)) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(`http://localhost:8099/api/gateway/rate-limiting/reset/${keyType}/${identifier}`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        alert(`✅ Rate limits reset successfully!\n${data.endpointsReset} endpoints reset for ${identifier}`);
        // Refresh the status
        fetchUserRateLimitStatus(keyType, identifier);
        // Refresh overall stats
        fetchRateLimitData();
      } else {
        alert('❌ Failed to reset rate limits');
      }
    } catch (error) {
      console.error('Error resetting rate limits:', error);
      alert('❌ Failed to reset rate limits');
    } finally {
      setIsResetting(false);
    }
  };

  const handleStatusLookup = () => {
    if (!rateLimitIdentifier.trim()) {
      alert('Please enter an identifier');
      return;
    }
    fetchUserRateLimitStatus(rateLimitKeyType, rateLimitIdentifier);
  };

  const getRateLimitSeverity = (currentCount, limit) => {
    const percentage = (currentCount / limit) * 100;
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const getEndpointIcon = (endpointName) => {
    const iconMap = {
      'auth': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      'payment': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      'admin': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      'public-read': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      'cart': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H2m3 10l4 4L20 8" />
        </svg>
      ),
      'order': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m4 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3m0 2v2m0 0V9m2 3h4m0 0V9m0 3v3" />
        </svg>
      )
    };

    return iconMap[endpointName] || (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  };

  const formatTimestamp = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="rate-limit-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Rate Limiting Management</h1>
                <p className="text-xl text-white/80">Loading rate limiting configuration...</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Loading rate limits...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="security-gradient text-white p-8 relative overflow-hidden">
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Rate Limiting Management</h1>
                <p className="text-xl text-white/80">Failed to connect to rate limiting service</p>
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
                  <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Service Unavailable</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
                </div>
                <button 
                  onClick={fetchRateLimitData} 
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl animate-fade-in-up">
          {/* Header Section */}
          <div className="rate-limit-gradient text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '3s'}}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h1 className="text-4xl font-bold">Rate Limiting Management</h1>
                  </div>
                  <p className="text-xl text-white/80">API rate limiting configuration and monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">
                      {rateLimitData?.totalEndpoints || 0} Endpoints
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse-red"></div>
                    <span className="text-sm font-medium text-white">
                      {rateLimitStats?.totalActiveRateLimits || 0} Active Limits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchRateLimitData}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-refresh (30s)</span>
                </label>

                <button
                  onClick={() => setShowStatusModal(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Check Status
                </button>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {formatTimestamp(lastUpdate)}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Endpoint Configuration */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Endpoint Configuration
                </h2>
                
                <div className="space-y-4">
                  {rateLimitData?.endpoints?.map((endpoint) => (
                    <div key={endpoint.name} className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                            endpoint.name === 'auth' || endpoint.name === 'payment' 
                              ? 'bg-gradient-to-br from-red-500 to-red-600' 
                              : endpoint.name === 'admin'
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                              : 'bg-gradient-to-br from-blue-500 to-blue-600'
                          }`}>
                            {getEndpointIcon(endpoint.name)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg capitalize">
                              {endpoint.name.replace('-', ' ')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              {endpoint.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="info" size="sm">{endpoint.keyType}</Badge>
                            <Badge 
                              variant={endpoint.limit <= 5 ? 'error' : endpoint.limit <= 30 ? 'warning' : 'success'} 
                              size="sm"
                            >
                              {endpoint.limit}/{endpoint.windowSeconds}s
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                        <code className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                          {endpoint.path}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics and Management */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Live Statistics
                </h2>

                {rateLimitStats && (
                  <div className="space-y-6">
                    {/* Overall Stats */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded mr-3"></div>
                        Overall Statistics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {rateLimitStats.totalActiveRateLimits}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Active Limits</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {new Date(rateLimitStats.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Last Updated</div>
                        </div>
                      </div>
                    </div>

                    {/* Endpoint Breakdown */}
                    {Object.keys(rateLimitStats.endpointBreakdown || {}).length > 0 && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
                          <div className="w-6 h-6 bg-green-500 rounded mr-3"></div>
                          Endpoint Activity
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(rateLimitStats.endpointBreakdown).map(([endpoint, count]) => (
                            <div key={endpoint} className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                              <span className="text-green-600 dark:text-green-400 capitalize text-sm font-medium">
                                {endpoint.replace('-', ' ')}
                              </span>
                              <Badge variant="success" size="sm">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Type Breakdown */}
                    {Object.keys(rateLimitStats.keyTypeBreakdown || {}).length > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                        <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                          <div className="w-6 h-6 bg-purple-500 rounded mr-3"></div>
                          Key Type Distribution
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(rateLimitStats.keyTypeBreakdown).map(([keyType, count]) => (
                            <div key={keyType} className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                                  keyType.toLowerCase() === 'ip' ? 'bg-blue-500' : 'bg-green-500'
                                }`}>
                                  {keyType.toLowerCase() === 'ip' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-purple-600 dark:text-purple-400 font-medium">{keyType}</span>
                              </div>
                              <Badge variant="info" size="md">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limit Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="rate-limit-gradient text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Rate Limit Status Checker</h2>
                  <p className="text-white/80">Check and manage rate limits for specific users or IP addresses</p>
                </div>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setUserRateLimitStatus(null);
                    setRateLimitIdentifier('');
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Lookup Form */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lookup Rate Limit Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Key Type
                    </label>
                    <select
                      value={rateLimitKeyType}
                      onChange={(e) => setRateLimitKeyType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    >
                      <option value="IP">IP Address</option>
                      <option value="USER">User ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Identifier
                    </label>
                    <input
                      type="text"
                      value={rateLimitIdentifier}
                      onChange={(e) => setRateLimitIdentifier(e.target.value)}
                      placeholder={rateLimitKeyType === 'IP' ? 'e.g. 192.168.1.1' : 'e.g. user123'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleStatusLookup}
                      className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      Check Status
                    </button>
                  </div>
                </div>
              </div>

              {/* Rate Limit Status Results */}
              {userRateLimitStatus && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Status for {userRateLimitStatus.keyType}: <span className="text-orange-600 dark:text-orange-400">{userRateLimitStatus.identifier}</span>
                    </h3>
                    <button
                      onClick={() => resetUserRateLimit(userRateLimitStatus.keyType, userRateLimitStatus.identifier)}
                      disabled={isResetting}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      {isResetting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Resetting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset All Limits
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(userRateLimitStatus.endpointStatuses || {}).map(([endpoint, status]) => (
                      <div key={endpoint} className={`rounded-xl p-6 border shadow-lg transition-all duration-300 hover:shadow-xl ${
                        status.isLimited 
                          ? 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800'
                          : getRateLimitSeverity(status.currentCount, status.limit) === 'warning'
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                              status.isLimited 
                                ? 'bg-red-500'
                                : getRateLimitSeverity(status.currentCount, status.limit) === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}>
                              {getEndpointIcon(endpoint)}
                            </div>
                            <h4 className={`font-bold capitalize ${
                              status.isLimited 
                                ? 'text-red-800 dark:text-red-200'
                                : getRateLimitSeverity(status.currentCount, status.limit) === 'warning'
                                ? 'text-yellow-800 dark:text-yellow-200'
                                : 'text-green-800 dark:text-green-200'
                            }`}>
                              {endpoint.replace('-', ' ')}
                            </h4>
                          </div>
                          <Badge 
                            variant={status.isLimited ? 'error' : getRateLimitSeverity(status.currentCount, status.limit)} 
                            size="md"
                          >
                            {status.isLimited ? 'LIMITED' : 'OK'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-medium ${
                              status.isLimited ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              Usage:
                            </span>
                            <span className={`font-bold ${
                              status.isLimited 
                                ? 'text-red-800 dark:text-red-200'
                                : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {status.currentCount} / {status.limit}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-medium ${
                              status.isLimited ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              Reset in:
                            </span>
                            <span className={`font-bold ${
                              status.isLimited 
                                ? 'text-red-800 dark:text-red-200'
                                : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {status.remainingTtl}s
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="space-y-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  status.isLimited 
                                    ? 'bg-red-500'
                                    : getRateLimitSeverity(status.currentCount, status.limit) === 'warning'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, (status.currentCount / status.limit) * 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                              {Math.round((status.currentCount / status.limit) * 100)}% used
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userRateLimitStatus && Object.keys(userRateLimitStatus.endpointStatuses || {}).length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Rate Limits</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    This {userRateLimitStatus.keyType.toLowerCase()} has no active rate limits at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}