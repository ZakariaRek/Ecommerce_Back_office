import { useState, useEffect } from 'react';

// Service icons mapping
const getServiceIcon = (serviceName) => {
  const iconMap = {
    'user-service': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'product-service': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    'order-service': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m4 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3m0 2v2m0 0V9m2 3h4m0 0V9m0 3v3" />
      </svg>
    ),
    'payment-service': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    'cart-service': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H2m3 10l4 4L20 8" />
      </svg>
    ),
    'loyalty-service': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    'notification-service': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
    'shipping-service': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    )
  };

  return iconMap[serviceName] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
};

// Modern styles similar to ProductList
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
  .monitoring-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  }
  .health-gradient {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  .error-gradient {
    background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
  }
  .circuit-breaker-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  @keyframes pulse-green {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  }
  .animate-pulse-green {
    animation: pulse-green 2s infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
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

// Modal component for detailed circuit breaker view
const CircuitBreakerModal = ({ isOpen, onClose, circuitBreaker, onReset }) => {
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen || !circuitBreaker) return null;

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onReset(circuitBreaker.name);
    } finally {
      setIsResetting(false);
    }
  };

  const getStateColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'closed': return 'success';
      case 'open': return 'error';
      case 'half_open': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="circuit-breaker-gradient text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Circuit Breaker Details</h2>
              <p className="text-white/80">{circuitBreaker.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Current State</h3>
              <div className="flex items-center justify-center mb-4">
                <Badge variant={getStateColor(circuitBreaker.state)} size="md">
                  {circuitBreaker.state}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {circuitBreaker.state === 'CLOSED' && 'Circuit is healthy and allowing requests'}
                  {circuitBreaker.state === 'OPEN' && 'Circuit is open, blocking requests'}
                  {circuitBreaker.state === 'HALF_OPEN' && 'Circuit is testing with limited requests'}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">Success Rate</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
                  {(100 - circuitBreaker.failureRate).toFixed(1)}%
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {circuitBreaker.successfulCalls} successful calls
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {circuitBreaker.bufferedCalls}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Buffered Calls</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {circuitBreaker.failedCalls}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed Calls</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {circuitBreaker.failureRate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failure Rate</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {circuitBreaker.slidingWindowSize}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Window Size</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 mb-6">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-700 dark:text-yellow-300">Failure Rate Threshold:</span>
                <span className="font-medium text-yellow-900 dark:text-yellow-100">{circuitBreaker.failureRateThreshold}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700 dark:text-yellow-300">Sliding Window Size:</span>
                <span className="font-medium text-yellow-900 dark:text-yellow-100">{circuitBreaker.slidingWindowSize}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleReset}
              disabled={isResetting || circuitBreaker.state === 'CLOSED'}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                circuitBreaker.state === 'CLOSED'
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : isResetting
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transform hover:scale-105'
              }`}
            >
              {isResetting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {isResetting ? 'Resetting...' : 'Reset Circuit Breaker'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MonitoringDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [circuitBreakersData, setCircuitBreakersData] = useState(null);
  const [gatewayHealthData, setGatewayHealthData] = useState(null);
  const [selectedCircuitBreaker, setSelectedCircuitBreaker] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);

  // Your services data from the provided endpoint
  const services = [
    {
      name: "user-service",
      description: "User Management Service",
      path: "/api/users/**",
      uri: "lb://user-service"
    },
    {
      name: "product-service", 
      description: "Product Catalog Service",
      path: "/api/products/**",
      uri: "lb://product-service"
    },
    {
      name: "order-service",
      description: "Order Management Service", 
      path: "/api/orders/**",
      uri: "lb://ORDER-SERVICE"
    },
    {
      name: "payment-service",
      description: "Payment Processing Service",
      path: "/api/payments/**", 
      uri: "lb://PAYMENT-SERVICE"
    },
    {
      name: "cart-service",
      description: "Shopping Cart Service",
      path: "/api/cart/**",
      uri: "lb://CART-SERVICE"
    },
    {
      name: "loyalty-service",
      description: "Loyalty Program Service",
      path: "/api/loyalty/**",
      uri: "lb://LOYALTY-SERVICE"
    },
    {
      name: "notification-service",
      description: "Notification Service",
      path: "/api/notifications/**",
      uri: "lb://NOTIFICATION-SERVICE"
    },
    {
      name: "shipping-service",
      description: "Shipping Service",
      path: "/api/shipping/**",
      uri: "lb://SHIPPING-SERVICE"
    }
  ];

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
    fetchAllData();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const fetchAllData = async () => {
    try {
      setError(null);
      
      // Fetch health data
      const healthResponse = await fetch('http://localhost:8099/actuator/health');
      if (!healthResponse.ok) {
        throw new Error(`Health endpoint error! status: ${healthResponse.status}`);
      }
      const healthData = await healthResponse.json();
      setHealthData(healthData);

      // Fetch circuit breakers data
      try {
        const cbResponse = await fetch('http://localhost:8099/api/gateway/circuit-breakers');
        if (cbResponse.ok) {
          const cbData = await cbResponse.json();
          setCircuitBreakersData(cbData);
        }
      } catch (cbError) {
        console.warn('Circuit breakers endpoint not available:', cbError.message);
      }

      // Fetch gateway health data
      try {
        const gwHealthResponse = await fetch('http://localhost:8099/api/gateway/health');
        if (gwHealthResponse.ok) {
          const gwHealthData = await gwHealthResponse.json();
          setGatewayHealthData(gwHealthData);
        }
      } catch (gwError) {
        console.warn('Gateway health endpoint not available:', gwError.message);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCircuitBreakerDetails = async (name) => {
    try {
      const response = await fetch(`http://localhost:8099/api/gateway/circuit-breakers/${name}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCircuitBreaker(data);
        setIsModalOpen(true);
      } else {
        addNotification(`Failed to fetch details for ${name}`, 'error');
      }
    } catch (error) {
      addNotification(`Error fetching circuit breaker details: ${error.message}`, 'error');
    }
  };

  const resetCircuitBreaker = async (name) => {
    try {
      const response = await fetch(`http://localhost:8099/api/gateway/circuit-breakers/${name}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        addNotification(`Circuit breaker '${name}' has been reset successfully`, 'success');
        setIsModalOpen(false);
        fetchAllData(); // Refresh data
      } else {
        addNotification(`Failed to reset circuit breaker '${name}'`, 'error');
      }
    } catch (error) {
      addNotification(`Error resetting circuit breaker: ${error.message}`, 'error');
    }
  };

  const getOverallStatus = () => {
    if (!healthData) return 'UNKNOWN';
    return healthData.status;
  };

  const getServiceHealthStatus = (serviceName) => {
    // Check if service is registered in service discovery (Eureka)
    const discoveredServices = healthData?.components?.discoveryComposite?.components?.discoveryClient?.details?.services || [];
    const eurekaApps = healthData?.components?.discoveryComposite?.components?.eureka?.details?.applications || {};
    
    // Check if service is in discovered services list
    const isInDiscovery = discoveredServices.includes(serviceName);
    
    // Check if service is in Eureka applications (case-insensitive)
    const serviceNameUpper = serviceName.toUpperCase().replace('-', '-');
    const isInEureka = Object.keys(eurekaApps).some(app => 
      app.toLowerCase().replace('_', '-') === serviceName.toLowerCase()
    );
    
    // Service is UP if it's registered in service discovery
    if (isInDiscovery || isInEureka) {
      return 'UP';
    }
    
    // If not in service discovery, it's considered DOWN
    return 'DOWN';
  };

  const getCircuitBreakerDetails = (serviceName) => {
    if (!healthData?.components?.circuitBreakers?.details) return null;
    
    const serviceToCircuitBreaker = {
      'user-service': 'user-mgmt-cb',
      'product-service': 'product-read-cb',
      'order-service': 'order-cb',
      'payment-service': 'payment-cb',
      'cart-service': 'cart-cb',
      'loyalty-service': 'loyalty-cb',
      'notification-service': 'notification-cb',
      'shipping-service': 'shipping-cb'
    };
    
    const cbName = serviceToCircuitBreaker[serviceName];
    return healthData.components.circuitBreakers.details[cbName]?.details;
  };

  const getServiceDiscoveryInfo = (serviceName) => {
    const discoveredServices = healthData?.components?.discoveryComposite?.components?.discoveryClient?.details?.services || [];
    const eurekaApps = healthData?.components?.discoveryComposite?.components?.eureka?.details?.applications || {};
    
    const isInDiscovery = discoveredServices.includes(serviceName);
    
    // Find matching Eureka application
    const eurekaKey = Object.keys(eurekaApps).find(app => 
      app.toLowerCase().replace('_', '-') === serviceName.toLowerCase()
    );
    
    return {
      isRegistered: isInDiscovery || !!eurekaKey,
      discoveryStatus: isInDiscovery ? 'Discovered' : 'Not Discovered',
      eurekaInstances: eurekaKey ? eurekaApps[eurekaKey] : 0,
      eurekaName: eurekaKey || 'Not Registered'
    };
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'up': 
      case 'closed':
      case 'healthy': return 'success';
      case 'down': 
      case 'open': return 'error';
      case 'unknown': 
      case 'half_open':
      case 'degraded':
      case 'recovering': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'up':
      case 'closed':
      case 'healthy':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-green"></div>
        );
      case 'down':
      case 'open':
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        );
      default:
        return (
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="monitoring-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">System Monitoring</h1>
                <p className="text-xl text-white/80">Loading health status...</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Fetching system health...</p>
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
            <div className="error-gradient text-white p-8 relative overflow-hidden">
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">System Monitoring</h1>
                <p className="text-xl text-white/80">Failed to connect to health endpoint</p>
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
                  <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Connection Failed</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
                </div>
                <button 
                  onClick={fetchAllData} 
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

  const overallStatus = gatewayHealthData?.status || getOverallStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white animate-fade-in-up ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl animate-fade-in-up">
          {/* Header Section */}
          <div className={`${overallStatus === 'UP' || overallStatus === 'HEALTHY' ? 'health-gradient' : 'error-gradient'} text-white p-8 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '3s'}}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h1 className="text-4xl font-bold">System Health Monitor</h1>
                  </div>
                  <p className="text-xl text-white/80">Real-time microservices monitoring dashboard</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    {getStatusIcon(overallStatus)}
                    <span className="text-sm font-medium text-white">System {overallStatus}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">{services.length} Services</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">
                      {services.filter(service => getServiceHealthStatus(service.name) === 'UP').length} Active
                    </span>
                  </div>
                  {circuitBreakersData && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-white">
                        {circuitBreakersData.totalCircuitBreakers} CBs
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls and Tabs Section */}
          <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchAllData}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
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
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-refresh (30s)</span>
                  </label>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {formatTimestamp(lastUpdate)}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeTab === 'services'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setActiveTab('circuit-breakers')}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeTab === 'circuit-breakers'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Circuit Breakers
              </button>
              <button
                onClick={() => setActiveTab('components')}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeTab === 'components'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                System Components
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <Badge variant="info" size="sm">Active</Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                      {services.filter(service => getServiceHealthStatus(service.name) === 'UP').length}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 text-sm">Active Services</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <Badge variant="success" size="sm">Healthy</Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                      {circuitBreakersData ? circuitBreakersData.circuitBreakers.filter(cb => cb.state === 'CLOSED').length : 'N/A'}
                    </h3>
                    <p className="text-green-600 dark:text-green-400 text-sm">Closed CBs</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <Badge variant="info" size="sm">Total</Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                      {services.length}
                    </h3>
                    <p className="text-purple-600 dark:text-purple-400 text-sm">Total Services</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <Badge variant={circuitBreakersData && circuitBreakersData.circuitBreakers.some(cb => cb.state === 'OPEN') ? 'error' : 'success'} size="sm">
                        {circuitBreakersData && circuitBreakersData.circuitBreakers.some(cb => cb.state === 'OPEN') ? 'Issues' : 'Good'}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-1">
                      {circuitBreakersData ? circuitBreakersData.circuitBreakers.filter(cb => cb.state === 'OPEN').length : 'N/A'}
                    </h3>
                    <p className="text-orange-600 dark:text-orange-400 text-sm">Open CBs</p>
                  </div>
                </div>

                {/* Gateway Health Summary */}
                {gatewayHealthData && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="circuit-breaker-gradient text-white p-6">
                      <h2 className="text-2xl font-bold mb-2 flex items-center">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        Gateway Health Status
                      </h2>
                      <p className="text-white/80">Overall system health and circuit breaker metrics</p>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                            {gatewayHealthData.status}
                          </div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Overall Status</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                            {gatewayHealthData.circuitBreakers.closed}
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-400">Closed CBs</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                            {gatewayHealthData.circuitBreakers.halfOpen}
                          </div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">Half-Open CBs</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <div className="text-2xl font-bold text-red-900 dark:text-red-100 mb-1">
                            {gatewayHealthData.circuitBreakers.open}
                          </div>
                          <p className="text-sm text-red-600 dark:text-red-400">Open CBs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {services.map((service) => {
                  const healthStatus = getServiceHealthStatus(service.name);
                  const cbDetails = getCircuitBreakerDetails(service.name);
                  const discoveryInfo = getServiceDiscoveryInfo(service.name);
                  
                  return (
                    <div 
                      key={service.name}
                      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {/* Service Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                            healthStatus === 'UP' 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                              : 'bg-gradient-to-br from-red-500 to-red-600'
                          }`}>
                            {getServiceIcon(service.name)}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(healthStatus)}
                            <Badge variant={getStatusColor(healthStatus)} size="sm">
                              {healthStatus}
                            </Badge>
                          </div>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 capitalize">
                          {service.name.replace('-', ' ')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                          {service.description}
                        </p>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Path:</span>
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                              {service.path}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">URI:</span>
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-purple-600 dark:text-purple-400">
                              {service.uri}
                            </code>
                          </div>
                        </div>
                      </div>

                      {/* Service Discovery Status */}
                      <div className="px-6 pb-4">
                        <div className={`rounded-xl p-4 border ${
                          discoveryInfo.isRegistered 
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                            : 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800'
                        }`}>
                          <h4 className={`text-sm font-semibold mb-3 flex items-center ${
                            discoveryInfo.isRegistered 
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}>
                            <div className={`w-4 h-4 rounded mr-2 ${
                              discoveryInfo.isRegistered ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            Service Discovery
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className={`${
                                discoveryInfo.isRegistered 
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>Status:</span>
                              <div className="mt-1">
                                <Badge 
                                  variant={discoveryInfo.isRegistered ? 'success' : 'error'} 
                                  size="sm"
                                >
                                  {discoveryInfo.isRegistered ? 'Registered' : 'Not Registered'}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className={`${
                                discoveryInfo.isRegistered 
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>Instances:</span>
                              <p className={`font-medium mt-1 ${
                                discoveryInfo.isRegistered 
                                  ? 'text-green-800 dark:text-green-200'
                                  : 'text-red-800 dark:text-red-200'
                              }`}>
                                {discoveryInfo.eurekaInstances}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Circuit Breaker Details */}
                      {cbDetails && (
                        <div className="px-6 pb-6">
                          <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                              Circuit Breaker
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">State:</span>
                                <div className="mt-1">
                                  <Badge 
                                    variant={cbDetails.state === 'CLOSED' ? 'success' : cbDetails.state === 'OPEN' ? 'error' : 'warning'} 
                                    size="sm"
                                  >
                                    {cbDetails.state}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Calls:</span>
                                <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                                  {cbDetails.bufferedCalls || 0}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Failure Rate:</span>
                                <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                                  {cbDetails.failureRate}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Failed:</span>
                                <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                                  {cbDetails.failedCalls || 0}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* No Circuit Breaker Available */}
                      {!cbDetails && (
                        <div className="px-6 pb-6">
                          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                            <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2 flex items-center">
                              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                              Circuit Breaker
                            </h4>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                              No circuit breaker configured for this service
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Circuit Breakers Tab */}
            {activeTab === 'circuit-breakers' && (
              <div>
                {circuitBreakersData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {circuitBreakersData.circuitBreakers.map((cb) => (
                        <div 
                          key={cb.name}
                          className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className={`p-6 ${
                            cb.state === 'CLOSED' 
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
                              : cb.state === 'OPEN'
                              ? 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'
                              : 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                {cb.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(cb.state)}
                                <Badge variant={getStatusColor(cb.state)} size="sm">
                                  {cb.state}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Success Rate</span>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {(100 - cb.failureRate).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Buffered Calls</span>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {cb.bufferedCalls}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Successful:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">{cb.successfulCalls}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Failed:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">{cb.failedCalls}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Failure Rate:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{cb.failureRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Threshold:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{cb.failureRateThreshold}%</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => fetchCircuitBreakerDetails(cb.name)}
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => resetCircuitBreaker(cb.name)}
                                disabled={cb.state === 'CLOSED'}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm ${
                                  cb.state === 'CLOSED'
                                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                                }`}
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Circuit Breaker Data</h3>
                    <p className="text-gray-500 dark:text-gray-400">Circuit breaker endpoints are not available or not configured.</p>
                  </div>
                )}
              </div>
            )}

            {/* System Components Tab */}
            {activeTab === 'components' && healthData?.components && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(healthData.components).map(([key, component]) => {
                  if (key === 'circuitBreakers') return null; // Skip circuit breakers as they're shown above
                  
                  return (
                    <div key={key} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(component.status)}
                            <Badge variant={getStatusColor(component.status)} size="sm">
                              {component.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        {component.details && typeof component.details === 'object' && (
                          <div className="space-y-3 text-sm">
                            {/* Special handling for diskSpace component */}
                            {key === 'diskSpace' && component.details.total && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">Total:</span>
                                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                                    {formatBytes(component.details.total)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">Free:</span>
                                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                                    {formatBytes(component.details.free)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">Used:</span>
                                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                                    {Math.round(((component.details.total - component.details.free) / component.details.total) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{
                                      width: `${Math.round(((component.details.total - component.details.free) / component.details.total) * 100)}%`
                                    }}
                                  ></div>
                                </div>
                              </>
                            )}
                            
                            {/* Special handling for redis component */}
                            {key === 'redis' && component.details.version && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Version:</span>
                                <span className="text-gray-800 dark:text-gray-200 font-medium">
                                  {component.details.version}
                                </span>
                              </div>
                            )}
                            
                            {/* Special handling for eureka component */}
                            {key === 'discoveryComposite' && component.components?.eureka?.details?.applications && (
                              <>
                                <div className="text-gray-500 dark:text-gray-400 font-medium mb-2">Registered Apps:</div>
                                {Object.entries(component.components.eureka.details.applications).map(([app, count]) => (
                                  <div key={app} className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">{app}:</span>
                                    <span className="text-gray-800 dark:text-gray-200 font-medium">{count}</span>
                                  </div>
                                ))}
                              </>
                            )}
                            
                            {/* Generic handling for other components */}
                            {key !== 'diskSpace' && key !== 'redis' && key !== 'discoveryComposite' && 
                             Object.entries(component.details).slice(0, 4).map(([detailKey, detailValue]) => (
                              <div key={detailKey} className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 capitalize">
                                  {detailKey.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-gray-800 dark:text-gray-200 font-medium">
                                  {Array.isArray(detailValue) 
                                    ? `${detailValue.length} items`
                                    : typeof detailValue === 'object'
                                    ? Object.keys(detailValue).length + ' items'
                                    : String(detailValue).slice(0, 20)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Circuit Breaker Modal */}
      <CircuitBreakerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        circuitBreaker={selectedCircuitBreaker}
        onReset={resetCircuitBreaker}
      />
    </div>
  );
}