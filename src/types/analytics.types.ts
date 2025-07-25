// src/types/analytics.types.ts

// Dashboard metrics interfaces matching backend
export interface DashboardMetrics {
  revenue: {
    today: number;
    week: number;
    month: number;
    change: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  refunds: {
    count: number;
    amount: number;
    rate: number;
  };
  invoices: {
    generated: number;
    sent: number;
    paid: number;
  };
  alerts: Alert[];
}

export interface Alert {
  type: 'warning' | 'info' | 'error' | 'success';
  message: string;
  time: string;
}

// Revenue analytics
export interface RevenueAnalytics {
  period: string;
  groupBy: string;
  revenueData: Record<string, number>;
  totalRevenue: number;
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  count: number;
}

// Transaction analytics
export interface TransactionAnalytics {
  period: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  refundCount: number;
  avgAmount: number;
}

// Success rate analytics
export interface SuccessRateAnalytics {
  [paymentMethod: string]: {
    total: number;
    successful: number;
    successRate: number;
  };
}

// Payment method analytics
export interface PaymentMethodAnalytics {
  [paymentMethod: string]: {
    count: number;
    revenue: number;
  };
}

// Gateway performance
export interface GatewayPerformance {
  gateways: GatewayMetrics[];
  alerts: Alert[];
}

export interface GatewayMetrics {
  name: string;
  uptime: number;
  avgResponse: number; // milliseconds
  successRate: number;
  totalTx: number;
  failedTx: number;
  fees: number;
}

// Customer analytics
export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningRate: number;
  avgOrderValue: number;
  topSpenders: TopSpender[];
}

export interface TopSpender {
  customer: string;
  totalSpent: number;
  orders: number;
}

// Transaction analytics (specific to transactions table)
export interface TransactionAnalyticsDetailed {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  avgProcessingTime: number;
  gatewayBreakdown: GatewayBreakdown;
  statusBreakdown: StatusBreakdown;
  hourlyDistribution: HourlyDistribution;
  dailyTrends: DailyTrend[];
}

export interface GatewayBreakdown {
  [gateway: string]: {
    count: number;
    successRate: number;
    avgAmount: number;
    totalVolume: number;
  };
}

export interface StatusBreakdown {
  [status: string]: {
    count: number;
    percentage: number;
  };
}

export interface HourlyDistribution {
  [hour: string]: number;
}

export interface DailyTrend {
  date: string;
  transactions: number;
  volume: number;
  successRate: number;
}

// Report interfaces
export interface DailyReport {
  date: string;
  totalRevenue: number;
  totalCount: number;
  avgAmount: number;
  successRate?: number;
  topPaymentMethods?: PaymentMethodBreakdown[];
  hourlyBreakdown?: HourlyBreakdown[];
}

export interface WeeklyReport {
  week: string;
  totalRevenue: number;
  totalCount: number;
  avgAmount?: number;
  dailyBreakdown?: DailyBreakdown[];
  growthRate?: number;
}

export interface MonthlyReport {
  month: string;
  totalRevenue: number;
  totalCount: number;
  avgAmount?: number;
  weeklyBreakdown?: WeeklyBreakdown[];
  growthRate?: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface HourlyBreakdown {
  hour: number;
  count: number;
  revenue: number;
}

export interface DailyBreakdown {
  date: string;
  count: number;
  revenue: number;
}

export interface WeeklyBreakdown {
  week: string;
  count: number;
  revenue: number;
}

// Export formats
export interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf';
  dateFrom?: string;
  dateTo?: string;
  filters?: Record<string, any>;
}

// Filter types for analytics
export interface AnalyticsFilters {
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  gateway?: string;
  status?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

// Chart data interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

// Trend analysis
export interface TrendAnalysis {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  direction: 'up' | 'down' | 'stable';
  period: string;
}

// KPI (Key Performance Indicators)
export interface KPIMetrics {
  conversionRate: number;
  averageTransactionValue: number;
  customerLifetimeValue: number;
  churnRate: number;
  revenueGrowthRate: number;
  transactionVelocity: number;
  failureRate: number;
  refundRate: number;
}

// Real-time metrics
export interface RealTimeMetrics {
  currentTransactions: number;
  transactionsPerSecond: number;
  activeUsers: number;
  systemLoad: number;
  errorRate: number;
  lastUpdated: string;
}

// Forecasting data
export interface ForecastData {
  predicted: ChartDataPoint[];
  confidence: {
    upper: number[];
    lower: number[];
  };
  accuracy: number;
  period: string;
}

// Common utility types for analytics
export type Period = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
export type GroupBy = 'hour' | 'day' | 'week' | 'month';
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area';

// Analytics response wrapper
export interface AnalyticsResponse<T> {
  data: T;
  metadata: {
    generatedAt: string;
    period: string;
    filters: AnalyticsFilters;
    totalRecords?: number;
  };
}

// Utility functions for analytics
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const getTrendDirection = (change: number): 'up' | 'down' | 'stable' => {
  if (change > 0.1) return 'up';
  if (change < -0.1) return 'down';
  return 'stable';
};

export const getTrendColor = (direction: 'up' | 'down' | 'stable'): string => {
  switch (direction) {
    case 'up':
      return 'green';
    case 'down':
      return 'red';
    case 'stable':
      return 'gray';
  }
};