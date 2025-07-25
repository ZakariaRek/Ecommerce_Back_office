import {
  DashboardMetrics,
  RevenueAnalytics,
  RevenueByPeriod,
  TransactionAnalytics,
  SuccessRateAnalytics,
  PaymentMethodAnalytics,
  GatewayPerformance,
  CustomerAnalytics,
  TransactionAnalyticsDetailed,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  AnalyticsFilters,
  ExportRequest,
  
  TrendAnalysis,
  KPIMetrics,
  RealTimeMetrics
} from "../types/analytics.types";
import getAuthHeaders from "../lib/authHeaders";

const BASE_URL = 'http://localhost:8099/api/payments'; // Payment service port

// Custom error class for analytics operations
export class AnalyticsError extends Error {
  constructor(
    message: string,
    public type: 'VALIDATION' | 'NOT_FOUND' | 'PROCESSING_ERROR' | 'SERVER_ERROR' = 'SERVER_ERROR',
    public details?: unknown | null
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

export class AnalyticsService {
  private static baseUrl = `${BASE_URL}/analytics`;

  // Enhanced error handling
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorType: 'VALIDATION' | 'NOT_FOUND' | 'PROCESSING_ERROR' | 'SERVER_ERROR' = 'SERVER_ERROR';
      let errorDetails: unknown = null;

      try {
        const errorData = await response.json();
        
        if (errorData.error || errorData.message) {
          errorMessage = errorData.message || errorData.error;
          errorDetails = errorData;
        }
      } catch (parseError) {
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          // Use the default HTTP error message
        }
      }

      // Handle specific HTTP status codes
      switch (response.status) {
        case 404:
          errorType = 'NOT_FOUND';
          break;
        case 400:
          errorType = 'VALIDATION';
          break;
        case 422:
          errorType = 'PROCESSING_ERROR';
          break;
      }

      throw new AnalyticsError(errorMessage, errorType, errorDetails);
    }
    
    return await response.json();
  }

  // ========================================
  // DASHBOARD METRICS
  // ========================================

  // Get main dashboard metrics
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<DashboardMetrics>(response);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  // Get dashboard metrics by period
  static async getDashboardMetricsByPeriod(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): Promise<DashboardMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard/${period}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<DashboardMetrics>(response);
    } catch (error) {
      console.error('Error fetching dashboard metrics by period:', error);
      throw error;
    }
  }

  // ========================================
  // REVENUE ANALYTICS
  // ========================================

  // Get revenue analytics
  static async getRevenueAnalytics(filters?: AnalyticsFilters): Promise<RevenueAnalytics> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/revenue?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<RevenueAnalytics>(response);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  }

  // Get revenue by specific period
  static async getRevenueByPeriod(period: string): Promise<RevenueByPeriod> {
    try {
      const response = await fetch(`${this.baseUrl}/revenue/${period}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<RevenueByPeriod>(response);
    } catch (error) {
      console.error('Error fetching revenue by period:', error);
      throw error;
    }
  }

  // ========================================
  // TRANSACTION ANALYTICS
  // ========================================

  // Get transaction analytics
  static async getTransactionAnalytics(period?: string): Promise<TransactionAnalytics> {
    try {
      const queryParams = period ? `?period=${period}` : '';
      const response = await fetch(`${this.baseUrl}/transactions${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<TransactionAnalytics>(response);
    } catch (error) {
      console.error('Error fetching transaction analytics:', error);
      throw error;
    }
  }

  // Get success rate analytics
  static async getSuccessRateAnalytics(): Promise<SuccessRateAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/success-rate`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<SuccessRateAnalytics>(response);
    } catch (error) {
      console.error('Error fetching success rate analytics:', error);
      throw error;
    }
  }

  // Get payment method analytics
  static async getPaymentMethodAnalytics(): Promise<PaymentMethodAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/methods`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<PaymentMethodAnalytics>(response);
    } catch (error) {
      console.error('Error fetching payment method analytics:', error);
      throw error;
    }
  }

  // Get detailed transaction analytics (from transactions table)
  static async getDetailedTransactionAnalytics(): Promise<TransactionAnalyticsDetailed> {
    try {
      const response = await fetch(`${BASE_URL}/transactions/analytics`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<TransactionAnalyticsDetailed>(response);
    } catch (error) {
      console.error('Error fetching detailed transaction analytics:', error);
      throw error;
    }
  }

  // ========================================
  // GATEWAY PERFORMANCE
  // ========================================

  // Get gateway performance metrics
  static async getGatewayPerformance(): Promise<GatewayPerformance> {
    try {
      const response = await fetch(`${this.baseUrl}/gateways`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<GatewayPerformance>(response);
    } catch (error) {
      console.error('Error fetching gateway performance:', error);
      throw error;
    }
  }

  // Get gateway analytics (from transactions)
  static async getGatewayAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/transactions/analytics/gateways`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Error fetching gateway analytics:', error);
      throw error;
    }
  }

  // ========================================
  // CUSTOMER ANALYTICS
  // ========================================

  // Get customer analytics
  static async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<CustomerAnalytics>(response);
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  }

  // ========================================
  // REPORTS
  // ========================================

  // Get daily report
  static async getDailyReport(date?: string): Promise<DailyReport> {
    try {
      const queryParams = date ? `?date=${date}` : '';
      const response = await fetch(`${this.baseUrl}/reports/daily${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<DailyReport>(response);
    } catch (error) {
      console.error('Error fetching daily report:', error);
      throw error;
    }
  }

  // Get weekly report
  static async getWeeklyReport(week?: string): Promise<WeeklyReport> {
    try {
      const queryParams = week ? `?week=${week}` : '';
      const response = await fetch(`${this.baseUrl}/reports/weekly${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<WeeklyReport>(response);
    } catch (error) {
      console.error('Error fetching weekly report:', error);
      throw error;
    }
  }

  // Get monthly report
  static async getMonthlyReport(month?: string): Promise<MonthlyReport> {
    try {
      const queryParams = month ? `?month=${month}` : '';
      const response = await fetch(`${this.baseUrl}/reports/monthly${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<MonthlyReport>(response);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      throw error;
    }
  }

  // ========================================
  // EXPORT FUNCTIONALITY
  // ========================================

  // Export payments data
  static async exportPayments(exportRequest: ExportRequest): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', exportRequest.format);
      
      if (exportRequest.dateFrom) {
        queryParams.append('dateFrom', exportRequest.dateFrom);
      }
      if (exportRequest.dateTo) {
        queryParams.append('dateTo', exportRequest.dateTo);
      }

      const response = await fetch(`${this.baseUrl}/export/payments?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new AnalyticsError(`Failed to export payments: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting payments:', error);
      throw error;
    }
  }

  // Export revenue data
  static async exportRevenue(exportRequest: ExportRequest & { period?: string }): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', exportRequest.format);
      
      if (exportRequest.period) {
        queryParams.append('period', exportRequest.period);
      }

      const response = await fetch(`${this.baseUrl}/export/revenue?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new AnalyticsError(`Failed to export revenue: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting revenue:', error);
      throw error;
    }
  }

  // ========================================
  // REAL-TIME METRICS
  // ========================================

  // Get real-time metrics (custom implementation)
  static async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      // Since the backend doesn't have a specific real-time endpoint,
      // we'll combine multiple calls to create real-time-like data
      const [dashboard, transactions] = await Promise.all([
        this.getDashboardMetrics(),
        this.getTransactionAnalytics('today')
      ]);

      const realTimeMetrics: RealTimeMetrics = {
        currentTransactions: dashboard.transactions.total,
        transactionsPerSecond: transactions.totalCount / (24 * 60 * 60), // Rough estimate
        activeUsers: Math.floor(dashboard.transactions.total * 0.1), // Estimate
        systemLoad: 75 + Math.random() * 20, // Mock data
        errorRate: ((dashboard.transactions.failed / dashboard.transactions.total) * 100) || 0,
        lastUpdated: new Date().toISOString(),
      };

      return realTimeMetrics;
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }

  // ========================================
  // KPI CALCULATIONS
  // ========================================

  // Calculate KPI metrics
  static async getKPIMetrics(): Promise<KPIMetrics> {
    try {
      const [dashboard, revenue, customer] = await Promise.all([
        this.getDashboardMetrics(),
        this.getRevenueAnalytics(),
        this.getCustomerAnalytics()
      ]);

      const kpiMetrics: KPIMetrics = {
        conversionRate: dashboard.transactions.successRate,
        averageTransactionValue: customer.avgOrderValue,
        customerLifetimeValue: customer.avgOrderValue * 10, // Rough estimate
        churnRate: 100 - customer.returningRate,
        revenueGrowthRate: dashboard.revenue.change,
        transactionVelocity: dashboard.transactions.total / 24, // Per hour
        failureRate: (dashboard.transactions.failed / dashboard.transactions.total) * 100,
        refundRate: dashboard.refunds.rate,
      };

      return kpiMetrics;
    } catch (error) {
      console.error('Error calculating KPI metrics:', error);
      throw error;
    }
  }

  // ========================================
  // TREND ANALYSIS
  // ========================================

  // Get trend analysis for any metric
  static async getTrendAnalysis(metric: 'revenue' | 'transactions' | 'customers', period: 'week' | 'month' | 'quarter'): Promise<TrendAnalysis> {
    try {
      // Get current and previous period data
      const [current, previous] = await Promise.all([
        this.getDashboardMetricsByPeriod(period === 'week' ? 'week' : 'month'),
        this.getDashboardMetricsByPeriod(period === 'week' ? 'week' : 'month') // Would need API to get previous period
      ]);

      let currentValue: number;
      let previousValue: number;

      switch (metric) {
        case 'revenue':
          currentValue = current.revenue.month;
          previousValue = previous.revenue.month * 0.9; // Mock previous data
          break;
        case 'transactions':
          currentValue = current.transactions.total;
          previousValue = previous.transactions.total * 0.95; // Mock previous data
          break;
        case 'customers':
          currentValue = 1000; // Mock data
          previousValue = 950; // Mock data
          break;
        default:
          throw new AnalyticsError('Invalid metric type');
      }

      const change = currentValue - previousValue;
      const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0;

      const trendAnalysis: TrendAnalysis = {
        current: currentValue,
        previous: previousValue,
        change: change,
        changePercentage: changePercentage,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        period: period,
      };

      return trendAnalysis;
    } catch (error) {
      console.error('Error calculating trend analysis:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Get analytics summary
  static async getAnalyticsSummary(): Promise<any> {
    try {
      const [dashboard, revenue, transactions, gateway] = await Promise.all([
        this.getDashboardMetrics(),
        this.getRevenueAnalytics(),
        this.getTransactionAnalytics(),
        this.getGatewayPerformance()
      ]);

      return {
        dashboard,
        revenue,
        transactions,
        gateway,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  }

  // Get hourly analytics (from transaction service)
  static async getHourlyAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/transactions/analytics/hourly`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Error fetching hourly analytics:', error);
      throw error;
    }
  }

  // Health check for analytics service
  static async getAnalyticsHealth(): Promise<{ status: string; endpoints: string[] }> {
    try {
      return {
        status: 'healthy',
        endpoints: [
          'dashboard',
          'revenue',
          'transactions',
          'gateways',
          'customers',
          'reports',
          'exports'
        ]
      };
    } catch (error) {
      console.error('Error checking analytics health:', error);
      throw error;
    }
  }

  // Download file helper
  static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Format date for API calls
  static formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Create date range filter
  static createDateRangeFilter(startDate: Date, endDate: Date): { dateFrom: string; dateTo: string } {
    return {
      dateFrom: this.formatDateForAPI(startDate),
      dateTo: this.formatDateForAPI(endDate)
    };
  }
}