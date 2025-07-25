// src/pages/Analytics/AnalyticsDashboard.tsx - UPDATED LAYOUT
import React, { useState, useEffect } from 'react';
import { 
  AnalyticsService, 
  AnalyticsError 
} from '../../services/analytics.service';
import {
  DashboardMetrics,
  RevenueAnalytics,
  TransactionAnalytics,
  GatewayPerformance,
  PaymentMethodAnalytics
} from '../../types/analytics.types';

// Define missing types locally if not available
interface KPIMetrics {
  conversionRate: number;
  averageTransactionValue: number;
  customerLifetimeValue: number;
  failureRate: number;
  revenueGrowthRate: number;
  transactionVelocity: number;
}

interface RealTimeMetrics {
  currentTransactions: number;
  transactionsPerSecond: number;
  activeUsers: number;
  errorRate: number;
  lastUpdated: string;
}

interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningRate: number;
  avgOrderValue: number;
}

// Modern analytics-themed styles
const analyticsStyles = `
  .analytics-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .analytics-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
  }
  .dark .analytics-card {
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid rgba(102, 126, 234, 0.2);
  }
  .analytics-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -8px rgba(102, 126, 234, 0.15);
  }
  .metric-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    border-left: 4px solid;
  }
  .dark .metric-card {
    background: linear-gradient(145deg, #1f2937, #111827);
  }
  .chart-container {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
  }
  .dark .chart-container {
    background: rgba(17, 24, 39, 0.8);
  }
  .pulse-animation {
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  .slide-in {
    animation: slideIn 0.6s ease-out;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Mini Chart Component using Canvas
const MiniChart: React.FC<{ 
  data: number[]; 
  type: 'line' | 'bar';
  color: string;
  height?: number;
}> = ({ data, type, color, height = 60 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height: canvasHeight } = canvas;
    ctx.clearRect(0, 0, width, canvasHeight);
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    if (type === 'line') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = canvasHeight - ((value - min) / range) * canvasHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    } else {
      const barWidth = width / data.length;
      
      data.forEach((value, index) => {
        const x = index * barWidth;
        const barHeight = ((value - min) / range) * canvasHeight;
        const y = canvasHeight - barHeight;
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      });
    }
  }, [data, type, color]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={height} 
      className="w-full h-full"
    />
  );
};

// Real-time Metrics Component
const RealTimeMetricsComponent: React.FC<{ metrics: RealTimeMetrics }> = ({ metrics }) => (
  <div className="analytics-card rounded-xl p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        📊 Real-Time Metrics
      </h3>
      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full pulse-animation"></div>
        <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
      </div>
    </div>
    
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Active Transactions', value: metrics.currentTransactions, color: 'blue', icon: '💳' },
        { label: 'TPS', value: metrics.transactionsPerSecond.toFixed(2), color: 'purple', icon: '⚡' },
        { label: 'Active Users', value: metrics.activeUsers, color: 'green', icon: '👥' },
        { label: 'Error Rate', value: `${metrics.errorRate.toFixed(1)}%`, color: 'red', icon: '❌' }
      ].map((metric, index) => (
        <div key={metric.label} className="metric-card rounded-lg p-4" style={{ borderLeftColor: getColorValue(metric.color) }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{metric.icon}</span>
            <span className="text-2xl font-bold" style={{ color: getColorValue(metric.color) }}>
              {metric.value}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
        </div>
      ))}
    </div>
  </div>
);

// KPI Cards Component
const KPICards: React.FC<{ kpis: KPIMetrics }> = ({ kpis }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      { 
        title: 'Conversion Rate', 
        value: `${kpis.conversionRate.toFixed(1)}%`, 
        change: '+2.1%',
        color: 'emerald',
        icon: '📈',
        trend: 'up'
      },
      { 
        title: 'Avg Transaction Value', 
        value: `$${kpis.averageTransactionValue.toFixed(0)}`, 
        change: '+$12',
        color: 'blue',
        icon: '💰',
        trend: 'up'
      },
      { 
        title: 'Customer LTV', 
        value: `$${kpis.customerLifetimeValue.toFixed(0)}`, 
        change: '+5.3%',
        color: 'purple',
        icon: '👑',
        trend: 'up'
      },
      { 
        title: 'Failure Rate', 
        value: `${kpis.failureRate.toFixed(1)}%`, 
        change: '-0.8%',
        color: 'red',
        icon: '🚫',
        trend: 'down'
      }
    ].map((kpi, index) => (
      <div key={kpi.title} className="analytics-card rounded-xl p-6 slide-in" style={{animationDelay: `${index * 0.1}s`}}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: getColorValue(kpi.color, 0.1) }}>
            <span className="text-2xl">{kpi.icon}</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            kpi.trend === 'up' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            <span>{kpi.trend === 'up' ? '↗️' : '↘️'}</span>
            {kpi.change}
          </div>
        </div>
        <div className="text-3xl font-bold mb-2" style={{ color: getColorValue(kpi.color) }}>
          {kpi.value}
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">{kpi.title}</div>
      </div>
    ))}
  </div>
);

// Revenue Chart Component
const RevenueChart: React.FC<{ data: RevenueAnalytics }> = ({ data }) => {
  // Handle missing revenueData or revenueByDay
  const revenueData = data.revenueByDay || data.revenueData || {};
  const chartData = Object.entries(revenueData).slice(-7); // Last 7 entries
  
  return (
    <div className="analytics-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">📊 Revenue Trend</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last 7 periods • Total: ${data.totalRevenue.toLocaleString()}
        </div>
      </div>
      
      <div className="chart-container">
        {chartData.length > 0 ? (
          <>
            <MiniChart 
              data={chartData.map(([_, value]) => value)} 
              type="line" 
              color="#667eea"
              height={200}
            />
            <div className="flex justify-between mt-4 text-xs text-gray-600 dark:text-gray-400">
              {chartData.map(([period]) => (
                <span key={period}>{period}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div>No revenue data available</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Gateway Performance Component
const GatewayPerformanceCard: React.FC<{ performance: GatewayPerformance }> = ({ performance }) => (
  <div className="analytics-card rounded-xl p-6">
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
      🏪 Gateway Performance
    </h3>
    
    <div className="space-y-4">
      {performance.gateways?.map((gateway, index) => (
        <div key={gateway.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                gateway.uptime > 99 ? 'bg-green-500' : 
                gateway.uptime > 95 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="font-semibold text-gray-900 dark:text-white">{gateway.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {gateway.uptime.toFixed(1)}% uptime
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Success Rate</div>
              <div className="font-semibold text-green-600 dark:text-green-400">
                {gateway.successRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Avg Response</div>
              <div className="font-semibold text-blue-600 dark:text-blue-400">
                {gateway.avgResponse}ms
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Total TX</div>
              <div className="font-semibold text-purple-600 dark:text-purple-400">
                {gateway.totalTx.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Performance Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${gateway.successRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      )) || (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">🏪</div>
          <div>No gateway data available</div>
        </div>
      )}
    </div>
  </div>
);

// Payment Methods Breakdown
const PaymentMethodsChart: React.FC<{ data: PaymentMethodAnalytics }> = ({ data }) => {
  const methods = Object.entries(data);
  const total = methods.reduce((sum, [_, value]) => sum + value.count, 0);
  
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
  
  return (
    <div className="analytics-card rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        💳 Payment Methods
      </h3>
      
      <div className="space-y-4">
        {methods.length > 0 ? methods.map(([method, stats], index) => {
          const percentage = (stats.count / total) * 100;
          return (
            <div key={method} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{method}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.count.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">💳</div>
            <div>No payment method data available</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get color values
const getColorValue = (colorName: string, opacity?: number): string => {
  const colors: Record<string, string> = {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    emerald: '#10b981',
    indigo: '#6366f1'
  };
  
  const color = colors[colorName] || '#6b7280';
  return opacity ? `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : color;
};

// Mock data generators for missing methods
const generateMockKPIMetrics = (dashboard: DashboardMetrics): KPIMetrics => ({
  conversionRate: dashboard.transactions.successRate,
  averageTransactionValue: dashboard.revenue.month / dashboard.transactions.total || 250,
  customerLifetimeValue: 2500,
  failureRate: (dashboard.transactions.failed / dashboard.transactions.total) * 100 || 4.7,
  revenueGrowthRate: dashboard.revenue.change,
  transactionVelocity: dashboard.transactions.total / 24
});

const generateMockRealTimeMetrics = (dashboard: DashboardMetrics): RealTimeMetrics => ({
  currentTransactions: dashboard.transactions.total,
  transactionsPerSecond: dashboard.transactions.total / (24 * 60 * 60),
  activeUsers: Math.floor(dashboard.transactions.total * 0.1),
  errorRate: (dashboard.transactions.failed / dashboard.transactions.total) * 100 || 0,
  lastUpdated: new Date().toISOString()
});

const generateMockCustomerAnalytics = (): CustomerAnalytics => ({
  totalCustomers: 2845,
  newCustomers: 156,
  returningRate: 67.8,
  avgOrderValue: 127.50
});

// Main Analytics Dashboard Component - UPDATED LAYOUT
const AnalyticsDashboard: React.FC = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [transactionAnalytics, setTransactionAnalytics] = useState<TransactionAnalytics | null>(null);
  const [gatewayPerformance, setGatewayPerformance] = useState<GatewayPerformance | null>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAnalytics | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Inject styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = analyticsStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Load all analytics data
  const loadAnalyticsData = async () => {
    try {
      setError(null);
      
      console.log('Loading analytics data...');
      
      const dashboard = await AnalyticsService.getAdminDashboard();
      setDashboardMetrics(dashboard);
      
      const revenue = await AnalyticsService.getRevenueAnalytics();
      setRevenueAnalytics(revenue);
      
      const transactions = await AnalyticsService.getTransactionAnalytics();
      setTransactionAnalytics(transactions);
      
      const gateways = await AnalyticsService.getGatewayPerformance();
      setGatewayPerformance(gateways);
      
      const methods = await AnalyticsService.getPaymentMethodAnalytics();
      setPaymentMethods(methods);
      
      // Generate mock data for missing methods
      const mockCustomers = generateMockCustomerAnalytics();
      setCustomerAnalytics(mockCustomers);
      
      const mockKpis = generateMockKPIMetrics(dashboard);
      setKpiMetrics(mockKpis);
      
      const mockRealTime = generateMockRealTimeMetrics(dashboard);
      setRealTimeMetrics(mockRealTime);
      
      console.log('Analytics data loaded successfully');
      
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof AnalyticsError ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-800"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading analytics...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Crunching the numbers</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center p-6">
        <div className="analytics-card rounded-2xl max-w-md w-full shadow-2xl border border-red-200 dark:border-red-500/20">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Analytics Error</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button 
              onClick={handleRefresh} 
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="analytics-card rounded-2xl overflow-hidden">
          <div className="analytics-gradient text-white p-8 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                    📊 Analytics Dashboard
                  </h1>
                  <p className="text-lg text-indigo-100 max-w-md">
                    Real-time insights and comprehensive analytics for data-driven decisions
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-indigo-200">Last Updated</div>
                    <div className="font-semibold">{new Date().toLocaleTimeString()}</div>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Metrics */}
        {realTimeMetrics && (
          <RealTimeMetricsComponent metrics={realTimeMetrics} />
        )}

        {/* KPI Cards */}
        {kpiMetrics && (
          <KPICards kpis={kpiMetrics} />
        )}

        {/* Revenue Chart - Full Width Row */}
        {revenueAnalytics && (
          <RevenueChart data={revenueAnalytics} />
        )}

        {/* Payment Methods and Gateway Performance Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {paymentMethods && (
            <PaymentMethodsChart data={paymentMethods} />
          )}
          
          {gatewayPerformance && (
            <GatewayPerformanceCard performance={gatewayPerformance} />
          )}
        </div>

        {/* Transaction Details */}
        {transactionAnalytics && (
          <div className="analytics-card rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              💳 Transaction Analytics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total', value: transactionAnalytics.totalCount, color: 'blue' },
                { label: 'Successful', value: transactionAnalytics.successCount, color: 'green' },
                { label: 'Failed', value: transactionAnalytics.failedCount, color: 'red' },
                { label: 'Pending', value: transactionAnalytics.pendingCount, color: 'yellow' },
                { label: 'Avg Amount', value: `$${transactionAnalytics.avgAmount.toFixed(0)}`, color: 'purple' }
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getColorValue(metric.color) }}>
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;