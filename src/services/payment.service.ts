// src/services/payment.service.ts - ADMIN MANAGEMENT & MONITORING FOCUSED
import { 
  Payment, 
  PaymentTransaction, 
  Invoice, 
  CreatePaymentRequest, 
  PaymentStatusResponse,
  PaymentFilters,
  PaginatedPaymentsResponse,
  BulkOperationResponse,
  RefundRequest
} from "../types/payment.types";
import getAuthHeaders from "../lib/authHeaders";

const BASE_URL = 'http://localhost:8099/api/payments'; // Payment service port

// Custom error class for payment operations
export class PaymentError extends Error {
  constructor(
    message: string,
    public type: 'VALIDATION' | 'NOT_FOUND' | 'PAYMENT_FAILED' | 'SERVER_ERROR' = 'SERVER_ERROR',
    public details?: unknown | null
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class PaymentService {
  private static baseUrl = BASE_URL;

  // Enhanced error handling for admin operations
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorType: 'VALIDATION' | 'NOT_FOUND' | 'PAYMENT_FAILED' | 'SERVER_ERROR' = 'SERVER_ERROR';
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
        case 402:
        case 422:
          errorType = 'PAYMENT_FAILED';
          break;
      }

      throw new PaymentError(errorMessage, errorType, errorDetails);
    }
    
    return await response.json();
  }

  // ========================================
  // PAYMENT MANAGEMENT FOR ADMIN
  // ========================================

  /**
   * Create new payment (Admin operation)
   */
  static async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    try {
      console.log('💳 PAYMENT: Creating new payment:', data);
      
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const payment = await this.handleResponse<Payment>(response);
      console.log('💳 PAYMENT: Payment created successfully:', payment.id);
      return payment;
    } catch (error) {
      console.error('💳 PAYMENT: Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID (Admin view)
   */
  static async getPaymentById(id: string): Promise<Payment> {
    try {
      console.log('💳 PAYMENT: Fetching payment:', id);
      
      const response = await fetch(`${this.baseUrl}/payments/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const payment = await this.handleResponse<Payment>(response);
      console.log('💳 PAYMENT: Payment fetched successfully:', payment.id);
      return payment;
    } catch (error) {
      console.error('💳 PAYMENT: Error fetching payment:', error);
      throw error;
    }
  }

  /**
   * Update payment (Admin operation)
   */
  static async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    try {
      console.log('💳 PAYMENT: Updating payment:', id, data);
      
      const response = await fetch(`${this.baseUrl}/payments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const payment = await this.handleResponse<Payment>(response);
      console.log('💳 PAYMENT: Payment updated successfully:', payment.id);
      return payment;
    } catch (error) {
      console.error('💳 PAYMENT: Error updating payment:', error);
      throw error;
    }
  }

  /**
   * Delete payment (Admin operation)
   */
  static async deletePayment(id: string): Promise<void> {
    try {
      console.log('💳 PAYMENT: Deleting payment:', id);
      
      const response = await fetch(`${this.baseUrl}/payments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      await this.handleResponse<void>(response);
      console.log('💳 PAYMENT: Payment deleted successfully:', id);
    } catch (error) {
      console.error('💳 PAYMENT: Error deleting payment:', error);
      throw error;
    }
  }

  /**
   * Get all payments with advanced filtering and pagination for admin
   */
  static async getAllPayments(
    page: number = 1, 
    limit: number = 50, 
    filters?: PaymentFilters
  ): Promise<PaginatedPaymentsResponse> {
    try {
      console.log('💳 PAYMENT: Fetching all payments with filters:', { page, limit, filters });
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/payments?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<PaginatedPaymentsResponse>(response);
      console.log('💳 PAYMENT: Payments fetched successfully, count:', result.payments.length);
      return result;
    } catch (error) {
      console.error('💳 PAYMENT: Error fetching payments:', error);
      throw error;
    }
  }

  /**
   * Search payments with advanced criteria for admin
   */
  static async searchPayments(query: {
    searchTerm?: string;
    status?: string;
    method?: string;
    amountMin?: number;
    amountMax?: number;
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
  }): Promise<Payment[]> {
    try {
      console.log('💳 PAYMENT: Searching payments:', query);
      
      const queryParams = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/payments/search?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<{ payments: Payment[] }>(response);
      console.log('💳 PAYMENT: Search completed, found:', result.payments.length, 'payments');
      return result.payments;
    } catch (error) {
      console.error('💳 PAYMENT: Error searching payments:', error);
      throw error;
    }
  }

  // ========================================
  // PAYMENT PROCESSING & STATUS MANAGEMENT
  // ========================================

  /**
   * Process payment (Admin operation)
   */
  static async processPayment(id: string): Promise<Payment> {
    try {
      console.log('💳 PAYMENT: Processing payment:', id);
      
      const response = await fetch(`${this.baseUrl}/payments/${id}/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const payment = await this.handleResponse<Payment>(response);
      console.log('💳 PAYMENT: Payment processed successfully:', payment.id, 'Status:', payment.status);
      return payment;
    } catch (error) {
      console.error('💳 PAYMENT: Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Refund payment with optional partial amount
   */
  static async refundPayment(id: string, refundData?: RefundRequest): Promise<Payment> {
    try {
      console.log('💳 PAYMENT: Refunding payment:', id, refundData);
      
      const response = await fetch(`${this.baseUrl}/payments/${id}/refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: refundData ? JSON.stringify(refundData) : undefined,
      });
      
      const payment = await this.handleResponse<Payment>(response);
      console.log('💳 PAYMENT: Payment refunded successfully:', payment.id);
      return payment;
    } catch (error) {
      console.error('💳 PAYMENT: Error refunding payment:', error);
      throw error;
    }
  }

  /**
   * Get payment status with detailed information
   */
  static async getPaymentStatus(id: string): Promise<PaymentStatusResponse & {
    transactions?: PaymentTransaction[];
    lastUpdate?: string;
    statusHistory?: Array<{
      status: string;
      timestamp: string;
      reason?: string;
    }>;
  }> {
    try {
      console.log('💳 PAYMENT: Getting payment status:', id);
      
      const [statusResponse, transactionsResponse] = await Promise.all([
        fetch(`${this.baseUrl}/payments/${id}/status`, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        this.getPaymentTransactions(id).catch(() => []) // Don't fail if transactions endpoint not available
      ]);
      
      const status = await this.handleResponse<PaymentStatusResponse>(statusResponse);
      
      return {
        ...status,
        transactions: transactionsResponse,
        lastUpdate: new Date().toISOString(),
        statusHistory: [] // TODO: Implement status history if needed
      };
    } catch (error) {
      console.error('💳 PAYMENT: Error fetching payment status:', error);
      throw error;
    }
  }

  /**
   * Get payments by status for admin monitoring
   */
  static async getPaymentsByStatus(status: string): Promise<Payment[]> {
    try {
      console.log('💳 PAYMENT: Fetching payments by status:', status);
      
      const result = await this.getAllPayments(1, 100, { status });
      return result.payments;
    } catch (error) {
      console.error('💳 PAYMENT: Error fetching payments by status:', error);
      throw error;
    }
  }

  /**
   * Get failed payments for admin review
   */
  static async getFailedPayments(): Promise<Payment[]> {
    try {
      return await this.getPaymentsByStatus('FAILED');
    } catch (error) {
      console.error('💳 PAYMENT: Error fetching failed payments:', error);
      throw error;
    }
  }

  /**
   * Get pending payments for admin monitoring
   */
  static async getPendingPayments(): Promise<Payment[]> {
    try {
      return await this.getPaymentsByStatus('PENDING');
    } catch (error) {
      console.error('💳 PAYMENT: Error fetching pending payments:', error);
      throw error;
    }
  }

  // ========================================
  // TRANSACTION MANAGEMENT
  // ========================================

  /**
   * Get payment transactions for detailed admin view
   */
  static async getPaymentTransactions(paymentID: string): Promise<PaymentTransaction[]> {
    try {
      console.log('💳 PAYMENT: Fetching transactions for payment:', paymentID);
      
      const response = await fetch(`${this.baseUrl}/payments/${paymentID}/transactions`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<{ paymentID: string; transactions: PaymentTransaction[] }>(response);
      console.log('💳 PAYMENT: Transactions fetched:', result.transactions.length);
      return result.transactions;
    } catch (error) {
      console.error('💳 PAYMENT: Error fetching payment transactions:', error);
      return []; // Return empty array if endpoint not available
    }
  }

  /**
   * Create transaction (Admin operation)
   */
  static async createTransaction(data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    try {
      console.log('💳 TRANSACTION: Creating transaction:', data);
      
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const transaction = await this.handleResponse<PaymentTransaction>(response);
      console.log('💳 TRANSACTION: Transaction created successfully:', transaction.id);
      return transaction;
    } catch (error) {
      console.error('💳 TRANSACTION: Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(id: string): Promise<PaymentTransaction> {
    try {
      console.log('💳 TRANSACTION: Fetching transaction:', id);
      
      const response = await fetch(`${this.baseUrl}/transactions/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const transaction = await this.handleResponse<PaymentTransaction>(response);
      console.log('💳 TRANSACTION: Transaction fetched successfully:', transaction.id);
      return transaction;
    } catch (error) {
      console.error('💳 TRANSACTION: Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction (Admin operation)
   */
  static async updateTransaction(id: string, data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    try {
      console.log('💳 TRANSACTION: Updating transaction:', id, data);
      
      const response = await fetch(`${this.baseUrl}/transactions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const transaction = await this.handleResponse<PaymentTransaction>(response);
      console.log('💳 TRANSACTION: Transaction updated successfully:', transaction.id);
      return transaction;
    } catch (error) {
      console.error('💳 TRANSACTION: Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Verify transaction with payment gateway
   */
  static async verifyTransaction(id: string): Promise<{ transactionID: string; isValid: boolean; verifiedAt: string }> {
    try {
      console.log('💳 TRANSACTION: Verifying transaction:', id);
      
      const response = await fetch(`${this.baseUrl}/transactions/${id}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<{ transactionID: string; isValid: boolean; verifiedAt: string }>(response);
      console.log('💳 TRANSACTION: Transaction verified:', id, 'Valid:', result.isValid);
      return result;
    } catch (error) {
      console.error('💳 TRANSACTION: Error verifying transaction:', error);
      throw error;
    }
  }

  /**
   * Retry failed transaction
   */
  static async retryTransaction(id: string): Promise<{ message: string; transactionID: string; retriedAt: string }> {
    try {
      console.log('💳 TRANSACTION: Retrying transaction:', id);
      
      const response = await fetch(`${this.baseUrl}/transactions/${id}/retry`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<{ message: string; transactionID: string; retriedAt: string }>(response);
      console.log('💳 TRANSACTION: Transaction retry initiated:', id);
      return result;
    } catch (error) {
      console.error('💳 TRANSACTION: Error retrying transaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions with filtering for admin monitoring
   */
  static async getTransactions(filters?: {
    gateway?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentId?: string;
  }): Promise<{ transactions: PaymentTransaction[]; count: number; filters: any }> {
    try {
      console.log('💳 TRANSACTION: Fetching transactions with filters:', filters);
      
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/transactions?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<{ transactions: PaymentTransaction[]; count: number; filters: any }>(response);
      console.log('💳 TRANSACTION: Transactions fetched:', result.count);
      return result;
    } catch (error) {
      console.error('💳 TRANSACTION: Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get failed transactions for admin review
   */
  static async getFailedTransactions(): Promise<{ failedTransactions: PaymentTransaction[]; count: number }> {
    try {
      console.log('💳 TRANSACTION: Fetching failed transactions');
      
      const response = await fetch(`${this.baseUrl}/transactions/failed`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<{ failedTransactions: PaymentTransaction[]; count: number }>(response);
      console.log('💳 TRANSACTION: Failed transactions fetched:', result.count);
      return result;
    } catch (error) {
      console.error('💳 TRANSACTION: Error fetching failed transactions:', error);
      throw error;
    }
  }

  // ========================================
  // BULK OPERATIONS FOR ADMIN
  // ========================================

  /**
   * Bulk retry failed transactions
   */
  static async bulkRetryTransactions(transactionIds: string[]): Promise<BulkOperationResponse> {
    try {
      console.log('💳 TRANSACTION: Bulk retrying transactions:', transactionIds.length);
      
      const response = await fetch(`${this.baseUrl}/transactions/bulk/retry`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ transactionIds }),
      });
      
      const result = await this.handleResponse<BulkOperationResponse>(response);
      console.log('💳 TRANSACTION: Bulk retry completed:', result);
      return result;
    } catch (error) {
      console.error('💳 TRANSACTION: Error bulk retrying transactions:', error);
      throw error;
    }
  }

  /**
   * Bulk verify transactions
   */
  static async bulkVerifyTransactions(transactionIds: string[]): Promise<BulkOperationResponse> {
    try {
      console.log('💳 TRANSACTION: Bulk verifying transactions:', transactionIds.length);
      
      const response = await fetch(`${this.baseUrl}/transactions/bulk/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ transactionIds }),
      });
      
      const result = await this.handleResponse<BulkOperationResponse>(response);
      console.log('💳 TRANSACTION: Bulk verify completed:', result);
      return result;
    } catch (error) {
      console.error('💳 TRANSACTION: Error bulk verifying transactions:', error);
      throw error;
    }
  }

  /**
   * Bulk update payment status (Admin operation)
   */
  static async bulkUpdatePayments(paymentIds: string[], updates: Partial<Payment>): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    totalProcessed: number;
  }> {
    try {
      console.log('💳 PAYMENT: Bulk updating payments:', paymentIds.length);
      
      const results = {
        successful: [] as string[],
        failed: [] as Array<{ id: string; error: string }>,
        totalProcessed: paymentIds.length
      };

      // Process in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < paymentIds.length; i += batchSize) {
        const batch = paymentIds.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (id) => {
          try {
            await this.updatePayment(id, updates);
            results.successful.push(id);
          } catch (error) {
            results.failed.push({
              id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }));
      }

      console.log('💳 PAYMENT: Bulk update completed:', results);
      return results;
    } catch (error) {
      console.error('💳 PAYMENT: Error bulk updating payments:', error);
      throw error;
    }
  }

  // ========================================
  // INVOICE MANAGEMENT (SIMPLIFIED)
  // ========================================

  /**
   * Get payment invoice
   */
  static async getPaymentInvoice(paymentID: string): Promise<Invoice> {
    try {
      console.log('📄 INVOICE: Fetching invoice for payment:', paymentID);
      
      const response = await fetch(`${this.baseUrl}/payments/${paymentID}/invoice`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const invoice = await this.handleResponse<Invoice>(response);
      console.log('📄 INVOICE: Invoice fetched successfully:', invoice.id);
      return invoice;
    } catch (error) {
      console.error('📄 INVOICE: Error fetching payment invoice:', error);
      throw error;
    }
  }

  /**
   * Download payment invoice PDF
   */
  static async downloadPaymentInvoicePDF(paymentID: string): Promise<Blob> {
    try {
      console.log('📄 INVOICE: Downloading PDF for payment:', paymentID);
      
      const response = await fetch(`${this.baseUrl}/payments/${paymentID}/invoice/pdf`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new PaymentError(`Failed to download invoice PDF: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📄 INVOICE: PDF downloaded successfully');
      return blob;
    } catch (error) {
      console.error('📄 INVOICE: Error downloading payment invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Email payment invoice
   */
  static async emailPaymentInvoice(paymentID: string, email: string): Promise<{ message: string }> {
    try {
      console.log('📄 INVOICE: Emailing invoice for payment:', paymentID, 'to:', email);
      
      const response = await fetch(`${this.baseUrl}/payments/${paymentID}/invoice/email`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      
      const result = await this.handleResponse<{ message: string }>(response);
      console.log('📄 INVOICE: Invoice emailed successfully');
      return result;
    } catch (error) {
      console.error('📄 INVOICE: Error emailing payment invoice:', error);
      throw error;
    }
  }

  // ========================================
  // ADMIN MONITORING & REPORTS
  // ========================================

  /**
   * Get payment statistics for admin dashboard
   */
  static async getPaymentStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
    byGateway: Record<string, number>;
    totalAmount: number;
    averageAmount: number;
    recentActivity: Payment[];
  }> {
    try {
      console.log('💳 PAYMENT: Fetching payment statistics');
      
      const [allPayments, recentPayments] = await Promise.all([
        this.getAllPayments(1, 1000), // Get a large sample
        this.getAllPayments(1, 10) // Get recent payments
      ]);

      const payments = allPayments.payments;
      
      // Calculate statistics
      const byStatus: Record<string, number> = {};
      const byMethod: Record<string, number> = {};
      const byGateway: Record<string, number> = {};
      let totalAmount = 0;

      payments.forEach(payment => {
        // Status breakdown
        byStatus[payment.status] = (byStatus[payment.status] || 0) + 1;
        
        // Method breakdown
        byMethod[payment.method] = (byMethod[payment.method] || 0) + 1;
        
        // Gateway breakdown (if available)
        if (payment.gateway) {
          byGateway[payment.gateway] = (byGateway[payment.gateway] || 0) + 1;
        }
        
        // Total amount
        totalAmount += payment.amount;
      });

      const statistics = {
        total: payments.length,
        byStatus,
        byMethod,
        byGateway,
        totalAmount,
        averageAmount: payments.length > 0 ? totalAmount / payments.length : 0,
        recentActivity: recentPayments.payments.slice(0, 5)
      };

      console.log('💳 PAYMENT: Statistics calculated:', statistics);
      return statistics;
    } catch (error) {
      console.error('💳 PAYMENT: Error fetching payment statistics:', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics for admin monitoring
   */
  static async getTransactionStatistics(): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
    byGateway: Record<string, { count: number; successRate: number }>;
    avgProcessingTime: number;
  }> {
    try {
      console.log('💳 TRANSACTION: Fetching transaction statistics');
      
      const transactionsResult = await this.getTransactions();
      const transactions = transactionsResult.transactions;
      
      const successful = transactions.filter(t => t.status === 'completed').length;
      const failed = transactions.filter(t => t.status === 'failed').length;
      const pending = transactions.filter(t => t.status === 'pending').length;
      
      // Gateway breakdown
      const byGateway: Record<string, { count: number; successRate: number }> = {};
      transactions.forEach(transaction => {
        if (!byGateway[transaction.gateway]) {
          byGateway[transaction.gateway] = { count: 0, successRate: 0 };
        }
        byGateway[transaction.gateway].count++;
      });

      // Calculate success rates for each gateway
      Object.keys(byGateway).forEach(gateway => {
        const gatewayTransactions = transactions.filter(t => t.gateway === gateway);
        const gatewaySuccessful = gatewayTransactions.filter(t => t.status === 'completed').length;
        byGateway[gateway].successRate = gatewayTransactions.length > 0 
          ? (gatewaySuccessful / gatewayTransactions.length) * 100 
          : 0;
      });

      const statistics = {
        total: transactions.length,
        successful,
        failed,
        pending,
        successRate: transactions.length > 0 ? (successful / transactions.length) * 100 : 0,
        byGateway,
        avgProcessingTime: 250 // Mock average processing time in ms
      };

      console.log('💳 TRANSACTION: Statistics calculated:', statistics);
      return statistics;
    } catch (error) {
      console.error('💳 TRANSACTION: Error fetching transaction statistics:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get service health for admin monitoring
   */
  static async getServiceHealth(): Promise<{
    status: string;
    version: string;
    features: string[];
    endpoints: Record<string, string[]>;
    timestamp: string;
  }> {
    try {
      console.log('💳 PAYMENT: Checking service health');
      
      const response = await fetch(`${this.baseUrl.replace('/api/payments', '')}/health`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const health = await this.handleResponse<any>(response);
      console.log('💳 PAYMENT: Service health checked:', health.status);
      return health;
    } catch (error) {
      console.error('💳 PAYMENT: Error checking service health:', error);
      throw error;
    }
  }

  /**
   * Test connection to payment service
   */
  static async testConnection(): Promise<boolean> {
    try {
      await this.getServiceHealth();
      return true;
    } catch (error) {
      console.error('💳 PAYMENT: Service connection test failed:', error);
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
   * Format amount for display
   */
  static formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Format date for display
   */
  static formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Get status color for UI display
   */
  static getStatusColor(status: string): string {
    const colors = {
      'COMPLETED': 'green',
      'PENDING': 'yellow',
      'FAILED': 'red',
      'REFUNDED': 'blue',
      'CANCELLED': 'gray',
    };
    return colors[status.toUpperCase()] || 'gray';
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodDisplay(method: string): string {
    const displayNames = {
      'CREDIT_CARD': 'Credit Card',
      'DEBIT_CARD': 'Debit Card',
      'PAYPAL': 'PayPal',
      'BANK_TRANSFER': 'Bank Transfer',
      'CRYPTO': 'Cryptocurrency',
      'POINTS': 'Loyalty Points',
      'GIFT_CARD': 'Gift Card',
    };
    return displayNames[method.toUpperCase() as keyof typeof displayNames] || method;
  }
}