// src/pages/Payment/PaymentManagement.tsx - SIMPLIFIED ADMIN VIEW
import React, { useState, useEffect } from 'react';
import {
    PaymentService,
    PaymentError
} from '../../services/payment.service';
import { AnalyticsService } from '../../services/analytics.service';
import {
    Payment,
    PaymentStatus,
    PaymentMethod,
    PaymentFilters
} from '../../types/payment.types';
import {
    DashboardMetrics,
    PaymentMethodAnalytics
} from '../../types/analytics.types';

// Payment management styles
const paymentStyles = `
  .payment-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
  }
  .dark .payment-card {
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid rgba(102, 126, 234, 0.2);
  }
  .payment-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px -5px rgba(102, 126, 234, 0.1);
  }
  .status-indicator {
    animation: pulse 2s ease-in-out infinite;
  }
  .slide-up {
    animation: slideUp 0.5s ease-out;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Payment Status Badge
const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return { color: 'green', bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', icon: '✅' };
      case PaymentStatus.PENDING:
        return { color: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', icon: '⏳' };
      case PaymentStatus.FAILED:
        return { color: 'red', bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', icon: '❌' };
      case PaymentStatus.REFUNDED:
        return { color: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: '↩️' };
      default:
        return { color: 'gray', bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', icon: '❓' };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span>{config.icon}</span>
      {status}
    </span>
  );
};

// Quick Analytics Summary
const QuickAnalyticsSummary: React.FC<{ 
  dashboardMetrics: DashboardMetrics | null;
  paymentMethods: PaymentMethodAnalytics | null;
}> = ({ dashboardMetrics, paymentMethods }) => {
  if (!dashboardMetrics) return null;

  const topMethod = paymentMethods ? 
    Object.entries(paymentMethods).reduce((a, b) => 
      paymentMethods[a[0]].count > paymentMethods[b[0]].count ? a : b
    )[0] : 'N/A';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div className="payment-card rounded-xl p-6 text-center">
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          ${dashboardMetrics.revenue.month.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monthly Revenue</div>
        <div className={`text-xs mt-2 ${dashboardMetrics.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {dashboardMetrics.revenue.change >= 0 ? '↗️' : '↘️'} {Math.abs(dashboardMetrics.revenue.change).toFixed(1)}%
        </div>
      </div>
      
      <div className="payment-card rounded-xl p-6 text-center">
        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
          {dashboardMetrics.transactions.total.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Transactions</div>
        <div className="text-xs mt-2 text-blue-600 dark:text-blue-400">
          {dashboardMetrics.transactions.successRate.toFixed(1)}% success rate
        </div>
      </div>
      
      <div className="payment-card rounded-xl p-6 text-center">
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {dashboardMetrics.refunds.count}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Refunds</div>
        <div className="text-xs mt-2 text-orange-600 dark:text-orange-400">
          ${dashboardMetrics.refunds.amount.toLocaleString()} total
        </div>
      </div>
      
      <div className="payment-card rounded-xl p-6 text-center">
        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {topMethod}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Top Method</div>
        <div className="text-xs mt-2 text-gray-500 dark:text-gray-400">
          Most popular
        </div>
      </div>
    </div>
  );
};

// Payment Search & Filter
const PaymentSearchFilter: React.FC<{ 
  onFiltersChange: (filters: PaymentFilters) => void;
  onSearch: () => void;
  loading: boolean;
}> = ({ onFiltersChange, onSearch, loading }) => {
  const [filters, setFilters] = useState<PaymentFilters>({});

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <div className="payment-card rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🔍 Search & Filter Payments
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full status-indicator"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Payment System Active</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Order ID</label>
          <input
            type="text"
            value={filters.orderID || ''}
            onChange={(e) => handleFilterChange('orderID', e.target.value)}
            placeholder="Search by order ID"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200"
          >
            <option value="">All Statuses</option>
            {Object.values(PaymentStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Method</label>
          <select
            value={filters.method || ''}
            onChange={(e) => handleFilterChange('method', e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200"
          >
            <option value="">All Methods</option>
            {Object.values(PaymentMethod).map(method => (
              <option key={method} value={method}>{method.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Email</label>
          <input
            type="email"
            value={filters.customerEmail || ''}
            onChange={(e) => handleFilterChange('customerEmail', e.target.value)}
            placeholder="customer@example.com"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date From</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date To</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onSearch}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Searching...
            </>
          ) : (
            <>
              <span>🔍</span>
              Search Payments
            </>
          )}
        </button>
        
        <button
          onClick={clearFilters}
          className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          <span>🗑️</span>
          Clear Filters
        </button>
      </div>
    </div>
  );
};

// Payment Results Table
const PaymentResultsTable: React.FC<{ 
  payments: Payment[];
  onPaymentAction: (paymentId: string, action: 'process' | 'refund' | 'view') => void;
  loading: boolean;
}> = ({ payments, onPaymentAction, loading }) => {
  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="payment-card rounded-xl p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-card rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          📊 Payment Results ({payments.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {payment.orderID}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {payment.id.slice(0, 8)}...
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount, payment.currency)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <PaymentStatusBadge status={payment.status} />
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                    {payment.method.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900 dark:text-white">
                    {payment.customerEmail}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600 dark:text-gray-400">
                    {formatDate(payment.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPaymentAction(payment.id, 'view')}
                      className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors font-medium"
                    >
                      View
                    </button>
                    {payment.status === PaymentStatus.PENDING && (
                      <button
                        onClick={() => onPaymentAction(payment.id, 'process')}
                        className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors font-medium"
                      >
                        Process
                      </button>
                    )}
                    {payment.status === PaymentStatus.COMPLETED && (
                      <button
                        onClick={() => onPaymentAction(payment.id, 'refund')}
                        className="px-3 py-1 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors font-medium"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {payments.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💳</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No payments found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your search filters or search for payments</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Payment Management Component
const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Inject styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = paymentStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Load initial analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [dashboard, methods] = await Promise.all([
          AnalyticsService.getAdminDashboard(),
          AnalyticsService.getPaymentMethodAnalytics()
        ]);
        
        setDashboardMetrics(dashboard);
        setPaymentMethods(methods);
      } catch (err) {
        console.error('Error loading analytics:', err);
      }
    };
    
    loadAnalytics();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await PaymentService.getAllPayments(1, 50, filters);
      setPayments(result.payments);
    } catch (err) {
      console.error('Error searching payments:', err);
      setError(err instanceof PaymentError ? err.message : 'Failed to search payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (paymentId: string, action: 'process' | 'refund' | 'view') => {
    try {
      switch (action) {
        case 'process':
          await PaymentService.processPayment(paymentId);
          await handleSearch(); // Refresh the list
          break;
        case 'refund':
          await PaymentService.refundPayment(paymentId);
          await handleSearch(); // Refresh the list
          break;
        case 'view':
          // eslint-disable-next-line no-case-declarations
          const payment = await PaymentService.getPaymentById(paymentId);
          setSelectedPayment(payment);
          setShowPaymentModal(true);
          break;
      }
    } catch (err) {
      console.error('Error handling payment action:', err);
      setError(err instanceof PaymentError ? err.message : 'Failed to perform action');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            💳 Payment Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor, search, and manage payment transactions
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="payment-card rounded-xl p-4 border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 text-lg">❌</span>
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

        {/* Quick Analytics */}
        <QuickAnalyticsSummary 
          dashboardMetrics={dashboardMetrics}
          paymentMethods={paymentMethods}
        />

        {/* Search & Filter */}
        <PaymentSearchFilter 
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          loading={loading}
        />

        {/* Results Table */}
        <PaymentResultsTable 
          payments={payments}
          onPaymentAction={handlePaymentAction}
          loading={loading}
        />

        {/* Payment Details Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="payment-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-2xl">💳</span>
                    Payment Details
                  </h2>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Payment ID</label>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Order ID</label>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedPayment.orderID}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Amount</label>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedPayment.currency || 'USD' }).format(selectedPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status</label>
                    <div className="mt-1">
                      <PaymentStatusBadge status={selectedPayment.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Payment Method</label>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedPayment.method.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Customer Email</label>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedPayment.customerEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Description</label>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedPayment.description || 'No description'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Created At</label>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">
                      {new Date(selectedPayment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Updated At</label>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">
                      {new Date(selectedPayment.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;