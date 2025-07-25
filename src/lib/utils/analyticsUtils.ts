// src/utils/analyticsUtils.ts
import { 
  DashboardMetrics, 
  PaymentMethodAnalytics, 
  TransactionAnalytics,
  ChartDataPoint 
} from '../../types/analytics.types';
import { Payment, PaymentStatus, PaymentMethod } from '../../types/payment.types';

// Data Export Utilities
export class DataExportUtils {
  // Export data to CSV
  static exportToCSV(data: any[], filename: string, headers?: string[]): void {
    const csvHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);
    const csvRows = [
      csvHeaders.join(','),
      ...data.map(row => 
        csvHeaders.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  // Export data to JSON
  static exportToJSON(data: any, filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }

  // Generate PDF report (basic implementation)
  static async exportToPDF(reportData: ReportData, filename: string): Promise<void> {
    // This would typically use a library like jsPDF
    // For now, we'll create a simple HTML-to-PDF approach
    const htmlContent = this.generateReportHTML(reportData);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  // Helper method to download files
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Generate HTML for PDF reports
  private static generateReportHTML(reportData: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; }
            .chart-placeholder { height: 200px; border: 1px solid #ccc; margin: 20px 0; text-align: center; line-height: 200px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportData.title}</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics">
            ${reportData.metrics.map(metric => `
              <div class="metric">
                <h3>${metric.title}</h3>
                <p><strong>${metric.value}</strong></p>
                ${metric.change ? `<p>Change: ${metric.change}%</p>` : ''}
              </div>
            `).join('')}
          </div>

          ${reportData.tables.map(table => `
            <h2>${table.title}</h2>
            <table>
              <thead>
                <tr>${table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${table.rows.map(row => `
                  <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                `).join('')}
              </tbody>
            </table>
          `).join('')}
        </body>
      </html>
    `;
  }
}

// Analytics Data Processing
export class AnalyticsProcessor {
  // Calculate period-over-period growth
  static calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Calculate moving average
  static calculateMovingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    for (let i = windowSize - 1; i < data.length; i++) {
      const slice = data.slice(i - windowSize + 1, i + 1);
      const average = slice.reduce((sum, val) => sum + val, 0) / windowSize;
      result.push(average);
    }
    return result;
  }

  // Forecast future values using linear regression
  static forecastLinear(data: number[], periods: number): number[] {
    if (data.length < 2) return [];

    // Calculate linear regression
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast: number[] = [];
    for (let i = 0; i < periods; i++) {
      const futureX = n + i;
      const futureY = slope * futureX + intercept;
      forecast.push(Math.max(0, futureY)); // Ensure non-negative values
    }

    return forecast;
  }

  // Detect anomalies in data
  static detectAnomalies(data: number[], threshold: number = 2): boolean[] {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const standardDeviation = Math.sqrt(variance);

    return data.map(value => Math.abs(value - mean) > threshold * standardDeviation);
  }

  // Calculate correlation between two datasets
  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Convert payment data to chart format
  static paymentsToChartData(payments: Payment[]): {
    dailyRevenue: ChartDataPoint[];
    methodBreakdown: ChartDataPoint[];
    statusBreakdown: ChartDataPoint[];
  } {
    // Group by date
    const dailyGroups = payments.reduce((groups, payment) => {
      const date = new Date(payment.createdAt).toISOString().split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(payment);
      return groups;
    }, {} as Record<string, Payment[]>);

    const dailyRevenue = Object.entries(dailyGroups).map(([date, dayPayments]) => ({
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: dayPayments
        .filter(p => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + p.amount, 0)
    }));

    // Group by payment method
    const methodGroups = payments.reduce((groups, payment) => {
      const method = payment.method;
      groups[method] = (groups[method] || 0) + payment.amount;
      return groups;
    }, {} as Record<string, number>);

    const methodBreakdown = Object.entries(methodGroups).map(([method, amount]) => ({
      label: method.replace('_', ' '),
      value: amount
    }));

    // Group by status
    const statusGroups = payments.reduce((groups, payment) => {
      const status = payment.status;
      groups[status] = (groups[status] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    const statusBreakdown = Object.entries(statusGroups).map(([status, count]) => ({
      label: status,
      value: count
    }));

    return { dailyRevenue, methodBreakdown, statusBreakdown };
  }
}

// Report Generator
export class ReportGenerator {
  static async generateExecutiveSummary(
    dashboardMetrics: DashboardMetrics,
    paymentMethods: PaymentMethodAnalytics,
    transactions: TransactionAnalytics
  ): Promise<ReportData> {
    const reportData: ReportData = {
      title: 'Executive Summary - Payment Analytics',
      generatedAt: new Date().toISOString(),
      metrics: [
        {
          title: 'Monthly Revenue',
          value: `$${dashboardMetrics.revenue.month.toLocaleString()}`,
          change: dashboardMetrics.revenue.change
        },
        {
          title: 'Total Transactions',
          value: dashboardMetrics.transactions.total.toLocaleString(),
        },
        {
          title: 'Success Rate',
          value: `${dashboardMetrics.transactions.successRate.toFixed(1)}%`,
        },
        {
          title: 'Refund Rate',
          value: `${dashboardMetrics.refunds.rate.toFixed(1)}%`,
        }
      ],
      tables: [
        {
          title: 'Payment Methods Performance',
          headers: ['Method', 'Count', 'Revenue', 'Avg Amount'],
          rows: Object.entries(paymentMethods).map(([method, stats]) => [
            method.replace('_', ' '),
            stats.count.toLocaleString(),
            `$${stats.revenue.toLocaleString()}`,
            `$${(stats.revenue / stats.count).toFixed(0)}`
          ])
        },
        {
          title: 'Transaction Summary',
          headers: ['Metric', 'Value'],
          rows: [
            ['Total Count', transactions.totalCount.toLocaleString()],
            ['Successful', transactions.successCount.toLocaleString()],
            ['Failed', transactions.failedCount.toLocaleString()],
            ['Pending', transactions.pendingCount.toLocaleString()],
            ['Average Amount', `$${transactions.avgAmount.toFixed(0)}`]
          ]
        }
      ]
    };

    return reportData;
  }

  static async generateDailyReport(payments: Payment[], date: string): Promise<ReportData> {
    const dayPayments = payments.filter(p => 
      new Date(p.createdAt).toISOString().split('T')[0] === date
    );

    const totalRevenue = dayPayments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0);

    const methodBreakdown = dayPayments.reduce((groups, payment) => {
      const method = payment.method;
      if (!groups[method]) groups[method] = { count: 0, revenue: 0 };
      groups[method].count++;
      if (payment.status === PaymentStatus.COMPLETED) {
        groups[method].revenue += payment.amount;
      }
      return groups;
    }, {} as Record<string, { count: number; revenue: number }>);

    return {
      title: `Daily Report - ${new Date(date).toLocaleDateString()}`,
      generatedAt: new Date().toISOString(),
      metrics: [
        {
          title: 'Daily Revenue',
          value: `$${totalRevenue.toLocaleString()}`
        },
        {
          title: 'Transactions',
          value: dayPayments.length.toLocaleString()
        },
        {
          title: 'Average Amount',
          value: `$${(totalRevenue / dayPayments.length || 0).toFixed(0)}`
        }
      ],
      tables: [
        {
          title: 'Payment Methods',
          headers: ['Method', 'Count', 'Revenue'],
          rows: Object.entries(methodBreakdown).map(([method, stats]) => [
            method.replace('_', ' '),
            stats.count.toString(),
            `$${stats.revenue.toLocaleString()}`
          ])
        }
      ]
    };
  }
}

// Advanced Filtering
export class AdvancedFilter {
  static filterPayments(payments: Payment[], filters: PaymentFilters): Payment[] {
    return payments.filter(payment => {
      // Date range filter
      if (filters.dateFrom) {
        const paymentDate = new Date(payment.createdAt);
        const fromDate = new Date(filters.dateFrom);
        if (paymentDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const paymentDate = new Date(payment.createdAt);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (paymentDate > toDate) return false;
      }

      // Status filter
      if (filters.status && payment.status !== filters.status) {
        return false;
      }

      // Method filter
      if (filters.method && payment.method !== filters.method) {
        return false;
      }

      // Email filter
      if (filters.customerEmail) {
        const email = payment.customerEmail?.toLowerCase() || '';
        const filterEmail = filters.customerEmail.toLowerCase();
        if (!email.includes(filterEmail)) return false;
      }

      // Order ID filter
      if (filters.orderID) {
        const orderId = payment.orderID.toLowerCase();
        const filterOrderId = filters.orderID.toLowerCase();
        if (!orderId.includes(filterOrderId)) return false;
      }

      return true;
    });
  }

  static getFilterSuggestions(payments: Payment[]): FilterSuggestions {
    const methods = [...new Set(payments.map(p => p.method))];
    const statuses = [...new Set(payments.map(p => p.status))];
    const customers = [...new Set(payments.map(p => p.customerEmail).filter(Boolean))];
    
    // Get date range
    const dates = payments.map(p => new Date(p.createdAt)).sort((a, b) => a.getTime() - b.getTime());
    const minDate = dates[0]?.toISOString().split('T')[0];
    const maxDate = dates[dates.length - 1]?.toISOString().split('T')[0];

    return {
      methods,
      statuses,
      customers: customers.slice(0, 20), // Limit to 20 suggestions
      dateRange: { min: minDate, max: maxDate }
    };
  }
}

// Data validation utilities
export class DataValidator {
  static validatePaymentData(payment: Partial<Payment>): ValidationResult {
    const errors: string[] = [];

    if (!payment.orderID?.trim()) {
      errors.push('Order ID is required');
    }

    if (!payment.amount || payment.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!payment.method) {
      errors.push('Payment method is required');
    }

    if (!payment.customerEmail?.trim()) {
      errors.push('Customer email is required');
    } else if (!/\S+@\S+\.\S+/.test(payment.customerEmail)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateDateRange(fromDate: string, toDate: string): ValidationResult {
    const errors: string[] = [];

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      if (from > to) {
        errors.push('From date must be before to date');
      }

      const daysDiff = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        errors.push('Date range cannot exceed 365 days');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Type definitions
export interface ReportData {
  title: string;
  generatedAt: string;
  metrics: {
    title: string;
    value: string;
    change?: number;
  }[];
  tables: {
    title: string;
    headers: string[];
    rows: string[][];
  }[];
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  customerEmail?: string;
  orderID?: string;
}

export interface FilterSuggestions {
  methods: PaymentMethod[];
  statuses: PaymentStatus[];
  customers: string[];
  dateRange: { min?: string; max?: string };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Performance monitoring for analytics
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startTimer(operation: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.metrics.set(operation, duration);
      return duration;
    };
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static logSlowOperations(threshold: number = 1000): void {
    this.metrics.forEach((duration, operation) => {
      if (duration > threshold) {
        console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
      }
    });
  }
}