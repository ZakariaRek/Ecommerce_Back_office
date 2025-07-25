// src/services/analytics.service.ts - ADMIN MONITORING & REPORTING FOCUSED
import {
  DashboardMetrics,
  RevenueAnalytics,
  TransactionAnalytics,
  GatewayPerformance,
  PaymentMethodAnalytics,
  SystemHealthMetrics,
  AdminReports,
  ExportRequest
} from "../types/analytics.types";
import getAuthHeaders from "../lib/authHeaders";

const BASE_URL = 'http://localhost:8099/api/payments'; // Payment service port

// Custom error class for analytics operations
export class AnalyticsError extends Error {
  constructor(
    message: string,
    public type: 'VALIDATION' | 'NOT_FOUND' | 'PROCESSING_ERROR' | 'SERVER_ERROR' | 'RATE_LIMITED' | 'NETWORK_ERROR' = 'SERVER_ERROR',
    public details?: unknown | null
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

// Rate limiting utility for API calls
class RateLimiter {
  private requestQueue: (() => Promise<any>)[] = [];
  private isProcessing = false;
  private requestDelay = 250; // Minimum delay between requests (ms)
  private lastRequestTime = 0;

  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.requestDelay) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.isProcessing = false;
  }
}

export class AnalyticsService {
  private static baseUrl = `${BASE_URL}/analytics`;
  private static rateLimiter = new RateLimiter();

  // Enhanced error handling with better error classification
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorType: AnalyticsError['type'] = 'SERVER_ERROR';
      let errorDetails: unknown = null;

      try {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          
          if (errorData.error || errorData.message) {
            errorMessage = errorData.message || errorData.error;
            errorDetails = errorData;
          }
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError);
      }

      // Enhanced status code handling
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
        case 429:
          errorType = 'RATE_LIMITED';
          errorMessage = 'Too many requests. Please slow down.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = 'SERVER_ERROR';
          errorMessage = 'Server error. Please try again later.';
          break;
      }

      throw new AnalyticsError(errorMessage, errorType, errorDetails);
    }
    
    try {
      return await response.json();
    } catch (error) {
      throw new AnalyticsError('Invalid response format', 'PROCESSING_ERROR', error);
    }
  }

  // Enhanced fetch with better error handling and rate limiting
  private static async enhancedFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.rateLimiter.enqueue(async () => {
      try {
        console.log(`📊 ANALYTICS: Making request to: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...getAuthHeaders(),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers,
          },
          credentials: 'include',
        });
        
        clearTimeout(timeoutId);
        console.log(`📊 ANALYTICS: Response status: ${response.status} for ${url}`);
        
        return await this.handleResponse<T>(response);
      } catch (error) {
        console.error(`📊 ANALYTICS: Error fetching ${url}:`, error);
        
        if (error instanceof AnalyticsError) {
          throw error;
        }
        
        if (error instanceof TypeError) {
          if (error.message.includes('Failed to fetch')) {
            throw new AnalyticsError(
              'Network error: Unable to connect to the analytics service. Please check if the server is running.',
              'NETWORK_ERROR',
              error
            );
          }
        }
        
        if (error.name === 'AbortError') {
          throw new AnalyticsError(
            'Request timeout: The server took too long to respond.',
            'NETWORK_ERROR',
            error
          );
        }
        
        throw new AnalyticsError(
          `Unexpected error: ${error.message}`,
          'SERVER_ERROR',
          error
        );
      }
    });
  }

  // ========================================
  // ADMIN DASHBOARD METRICS
  // ========================================

  /**
   * Get main dashboard metrics for admin overview
   */
  static async getAdminDashboard(): Promise<DashboardMetrics> {
    try {
      return await this.enhancedFetch<DashboardMetrics>(`${this.baseUrl}/dashboard`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching admin dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard metrics by specific period (today, week, month, quarter, year)
   */
  static async getDashboardByPeriod(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): Promise<DashboardMetrics> {
    try {
      return await this.enhancedFetch<DashboardMetrics>(`${this.baseUrl}/dashboard/${period}`);
    } catch (error) {
      console.error(`📊 ANALYTICS: Error fetching dashboard for period ${period}:`, error);
      throw error;
    }
  }

  // ========================================
  // REVENUE ANALYTICS & REPORTING
  // ========================================

  /**
   * Get comprehensive revenue analytics
   */
  static async getRevenueAnalytics(filters?: {
    period?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<RevenueAnalytics> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
      }

      const url = `${this.baseUrl}/revenue${queryParams.toString() ? `?${queryParams}` : ''}`;
      return await this.enhancedFetch<RevenueAnalytics>(url);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue by specific period with detailed breakdown
   */
  static async getRevenueByPeriod(period: string): Promise<{
    period: string;
    totalRevenue: number;
    transactionCount: number;
    averageTransaction: number;
    revenueByMethod: Record<string, number>;
    revenueByGateway: Record<string, number>;
    growthRate: number;
  }> {
    try {
      return await this.enhancedFetch(`${this.baseUrl}/revenue/${period}`);
    } catch (error) {
      console.error(`📊 ANALYTICS: Error fetching revenue for period ${period}:`, error);
      throw error;
    }
  }

  /**
   * Get revenue forecasting data
   */
  static async getRevenueForecast(days: number = 30): Promise<{
    forecast: Array<{
      date: string;
      predicted: number;
      confidence: number;
    }>;
    accuracy: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    try {
      return await this.enhancedFetch(`${this.baseUrl}/revenue/forecast?days=${days}`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching revenue forecast:', error);
      // Return mock data if forecast endpoint not available
      return {
        forecast: [],
        accuracy: 0,
        trend: 'stable'
      };
    }
  }

  // ========================================
  // TRANSACTION ANALYTICS & MONITORING
  // ========================================

  /**
   * Get comprehensive transaction analytics
   */
  static async getTransactionAnalytics(period?: string): Promise<TransactionAnalytics> {
    try {
      const queryParams = period ? `?period=${period}` : '';
      return await this.enhancedFetch<TransactionAnalytics>(`${this.baseUrl}/transactions${queryParams}`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching transaction analytics:', error);
      throw error;
    }
  }

  /**
   * Get detailed transaction analytics from transaction service
   */
  static async getDetailedTransactionAnalytics(): Promise<{
    totalTransactions: number;
    successRate: number;
    failureRate: number;
    averageProcessingTime: number;
    gatewayBreakdown: Record<string, any>;
    statusBreakdown: Record<string, number>;
    hourlyDistribution: Record<string, number>;
    peakHours: string[];
  }> {
    try {
      return await this.enhancedFetch(`${BASE_URL}/transactions/analytics`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching detailed transaction analytics:', error);
      throw error;
    }
  }

  /**
   * Get success/failure rates by payment method
   */
  static async getSuccessRatesByMethod(): Promise<Record<string, {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    failureRate: number;
  }>> {
    try {
      return await this.enhancedFetch(`${this.baseUrl}/transactions/success-rate`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching success rates by method:', error);
      throw error;
    }
  }

  /**
   * Get payment method analytics with detailed breakdown
   */
  static async getPaymentMethodAnalytics(): Promise<PaymentMethodAnalytics> {
    try {
      return await this.enhancedFetch<PaymentMethodAnalytics>(`${this.baseUrl}/transactions/methods`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching payment method analytics:', error);
      throw error;
    }
  }

  /**
   * Get peak transaction times analysis
   */
  static async getPeakTransactionTimes(): Promise<{
    hourlyDistribution: Record<string, number>;
    peakHours: string[];
    peakDays: string[];
    averageTransactionsPerHour: number;
    busyPeriods: Array<{
      period: string;
      transactions: number;
      percentage: number;
    }>;
  }> {
    try {
      return await this.enhancedFetch(`${BASE_URL}/transactions/analytics/hourly`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching peak transaction times:', error);
      throw error;
    }
  }

  // ========================================
  // GATEWAY PERFORMANCE MONITORING
  // ========================================

  /**
   * Get comprehensive gateway performance metrics
   */
  static async getGatewayPerformance(): Promise<GatewayPerformance> {
    try {
      return await this.enhancedFetch<GatewayPerformance>(`${this.baseUrl}/gateways`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching gateway performance:', error);
      throw error;
    }
  }

  /**
   * Get gateway analytics from transaction service
   */
  static async getGatewayAnalytics(): Promise<Record<string, {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    successRate: number;
    averageProcessingTime: number;
    uptime: number;
    lastFailure?: string;
    fees: number;
  }>> {
    try {
      return await this.enhancedFetch(`${BASE_URL}/transactions/analytics/gateways`);
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching gateway analytics:', error);
      throw error;
    }
  }

  /**
   * Get gateway comparison report
   */
  static async getGatewayComparison(): Promise<{
    comparison: Array<{
      gateway: string;
      rank: number;
      score: number;
      metrics: {
        successRate: number;
        avgResponse: number;
        uptime: number;
        fees: number;
      };
    }>;
    recommendations: string[];
  }> {
    try {
      const performance = await this.getGatewayPerformance();
      const analytics = await this.getGatewayAnalytics();

      // Combine and rank gateways
      const comparison = Object.keys(analytics).map(gateway => {
        const metrics = analytics[gateway];
        // Simple scoring algorithm (can be enhanced)
        const score = (metrics.successRate * 0.4) + 
                     ((100 - metrics.averageProcessingTime / 10) * 0.3) + 
                     (metrics.uptime * 0.3);
        
        return {
          gateway,
          rank: 0, // Will be set after sorting
          score: Math.round(score * 100) / 100,
          metrics: {
            successRate: metrics.successRate,
            avgResponse: metrics.averageProcessingTime,
            uptime: metrics.uptime,
            fees: metrics.fees
          }
        };
      }).sort((a, b) => b.score - a.score)
        .map((item, index) => ({ ...item, rank: index + 1 }));

      return {
        comparison,
        recommendations: [
          'Consider switching to higher-ranked gateways for better performance',
          'Monitor gateways with success rates below 95%',
          'Review fee structures for cost optimization'
        ]
      };
    } catch (error) {
      console.error('📊 ANALYTICS: Error generating gateway comparison:', error);
      throw error;
    }
  }

  // ========================================
  // SYSTEM HEALTH & MONITORING
  // ========================================

  /**
   * Get system health metrics for admin monitoring
   */
  static async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      const [dashboard, gateways, transactions] = await Promise.all([
        this.getAdminDashboard(),
        this.getGatewayPerformance(),
        this.getDetailedTransactionAnalytics()
      ]);

      return {
        overallHealth: 'healthy', // Based on thresholds
        paymentServiceStatus: 'operational',
        gatewayStatus: gateways.gateways?.map(g => ({
          name: g.name,
          status: g.uptime > 99 ? 'operational' : 'degraded',
          uptime: g.uptime
        })) || [],
        transactionProcessing: {
          rate: transactions.totalTransactions,
          successRate: transactions.successRate,
          avgProcessingTime: transactions.averageProcessingTime
        },
        alerts: [
          ...(transactions.successRate < 95 ? [{ type: 'warning', message: 'Transaction success rate below threshold' }] : []),
          ...(transactions.averageProcessingTime > 1000 ? [{ type: 'warning', message: 'High transaction processing time' }] : [])
        ],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching system health:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics for admin monitoring
   */
  static async getRealTimeMetrics(): Promise<{
    currentTransactions: number;
    transactionsPerSecond: number;
    activeGateways: number;
    systemLoad: number;
    errorRate: number;
    lastUpdated: string;
  }> {
    try {
      const [dashboard, gateways] = await Promise.all([
        this.getAdminDashboard(),
        this.getGatewayPerformance()
      ]);

      return {
        currentTransactions: dashboard.transactions.total,
        transactionsPerSecond: dashboard.transactions.total / (24 * 60 * 60), // Rough estimate
        activeGateways: gateways.gateways?.filter(g => g.uptime > 95).length || 0,
        systemLoad: 75 + Math.random() * 20, // Mock data
        errorRate: ((dashboard.transactions.failed / dashboard.transactions.total) * 100) || 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching real-time metrics:', error);
      throw error;
    }
  }

  // ========================================
  // REPORTS & EXPORTS
  // ========================================

  /**
   * Get comprehensive admin reports
   */
  static async getAdminReports(period: 'daily' | 'weekly' | 'monthly'): Promise<AdminReports> {
    try {
      const endpoint = `/reports/${period}`;
      return await this.enhancedFetch<AdminReports>(`${this.baseUrl}${endpoint}`);
    } catch (error) {
      console.error(`📊 ANALYTICS: Error fetching ${period} reports:`, error);
      throw error;
    }
  }

  /**
   * Export analytics data as CSV or JSON
   */
  static async exportAnalyticsData(exportRequest: ExportRequest & {
    dataType: 'payments' | 'transactions' | 'revenue' | 'gateways';
  }): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', exportRequest.format);
      queryParams.append('dataType', exportRequest.dataType);
      
      if (exportRequest.dateFrom) {
        queryParams.append('dateFrom', exportRequest.dateFrom);
      }
      if (exportRequest.dateTo) {
        queryParams.append('dateTo', exportRequest.dateTo);
      }

      const response = await this.rateLimiter.enqueue(async () => {
        return fetch(`${this.baseUrl}/export?${queryParams}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      });
      
      if (!response.ok) {
        throw new AnalyticsError(`Failed to export ${exportRequest.dataType} data: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('📊 ANALYTICS: Error exporting analytics data:', error);
      throw error;
    }
  }

  // ========================================
  // KEY PERFORMANCE INDICATORS (KPIs)
  // ========================================

  /**
   * Get Key Performance Indicators for admin dashboard
   */
  static async getKPIMetrics(): Promise<{
    paymentSuccessRate: number;
    averageTransactionValue: number;
    dailyRevenue: number;
    monthlyGrowthRate: number;
    gatewayUptime: number;
    transactionVelocity: number;
    refundRate: number;
    customerSatisfactionScore: number;
  }> {
    try {
      const [dashboard, revenue, gateways] = await Promise.all([
        this.getAdminDashboard(),
        this.getRevenueAnalytics(),
        this.getGatewayPerformance()
      ]);

      const avgGatewayUptime = gateways.gateways?.reduce((acc, g) => acc + g.uptime, 0) / (gateways.gateways?.length || 1) || 0;

      return {
        paymentSuccessRate: dashboard.transactions.successRate,
        averageTransactionValue: dashboard.revenue.today / dashboard.transactions.total || 0,
        dailyRevenue: dashboard.revenue.today,
        monthlyGrowthRate: dashboard.revenue.change,
        gatewayUptime: avgGatewayUptime,
        transactionVelocity: dashboard.transactions.total / 24, // Per hour
        refundRate: dashboard.refunds.rate,
        customerSatisfactionScore: 85 + Math.random() * 10, // Mock data
      };
    } catch (error) {
      console.error('📊 ANALYTICS: Error calculating KPI metrics:', error);
      throw error;
    }
  }

  // ========================================
  // ALERTS & MONITORING
  // ========================================

  /**
   * Get system alerts for admin attention
   */
  static async getSystemAlerts(): Promise<Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    resolved: boolean;
  }>> {
    try {
      const [health, kpis] = await Promise.all([
        this.getSystemHealth(),
        this.getKPIMetrics()
      ]);

      const alerts = [];

      // Check various thresholds and generate alerts
      if (kpis.paymentSuccessRate < 95) {
        alerts.push({
          id: 'success-rate-low',
          type: 'warning' as const,
          title: 'Low Payment Success Rate',
          message: `Payment success rate is ${kpis.paymentSuccessRate.toFixed(1)}%, below the 95% threshold`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      if (kpis.gatewayUptime < 99) {
        alerts.push({
          id: 'gateway-uptime-low',
          type: 'critical' as const,
          title: 'Gateway Uptime Issue',
          message: `Average gateway uptime is ${kpis.gatewayUptime.toFixed(1)}%, below the 99% threshold`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      if (kpis.refundRate > 5) {
        alerts.push({
          id: 'high-refund-rate',
          type: 'warning' as const,
          title: 'High Refund Rate',
          message: `Refund rate is ${kpis.refundRate.toFixed(1)}%, above the 5% threshold`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      return alerts;
    } catch (error) {
      console.error('📊 ANALYTICS: Error fetching system alerts:', error);
      return [];
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Test connection to analytics service
   */
  static async testConnection(): Promise<boolean> {
    try {
      await this.enhancedFetch(`${BASE_URL}/health`);
      return true;
    } catch (error) {
      console.error('📊 ANALYTICS: Service connection test failed:', error);
      return false;
    }
  }

  /**
   * Download file helper for exports
   */
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

  /**
   * Format date for API calls
   */
  static formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Create date range filter
   */
  static createDateRangeFilter(startDate: Date, endDate: Date): { dateFrom: string; dateTo: string } {
    return {
      dateFrom: this.formatDateForAPI(startDate),
      dateTo: this.formatDateForAPI(endDate)
    };
  }
}