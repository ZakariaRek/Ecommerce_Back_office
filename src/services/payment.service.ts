// src/services/payment.service.ts
import { 
  Payment, 
  PaymentTransaction, 
  Invoice, 
  CreatePaymentRequest, 
  ProcessOrderPaymentRequest,
  OrderPaymentResponse,
  RefundRequest,
  PaymentStatusResponse,
  PaymentFilters,
  PaginatedPaymentsResponse,
//   BulkTransactionRequest,
  BulkOperationResponse
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

  // Enhanced error handling
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
  // BASIC PAYMENT OPERATIONS
  // ========================================

  // Create new payment
  static async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse<Payment>(response);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  // Get payment by ID
  static async getPaymentById(id: string): Promise<Payment> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<Payment>(response);
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  // Update payment
  static async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse<Payment>(response);
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  // Delete payment
  static async deletePayment(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      await this.handleResponse<void>(response);
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  // Get all payments with filters and pagination
  static async getAllPayments(
    page: number = 1, 
    limit: number = 50, 
    filters?: PaymentFilters
  ): Promise<PaginatedPaymentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/payments?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<PaginatedPaymentsResponse>(response);
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  // Get payments by order ID
  static async getPaymentsByOrder(orderID: string): Promise<Payment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/order/${orderID}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<Payment[]>(response);
    } catch (error) {
      console.error('Error fetching payments by order:', error);
      throw error;
    }
  }

  // Process payment
  static async processPayment(id: string): Promise<Payment> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${id}/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<Payment>(response);
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Refund payment
  static async refundPayment(id: string, refundData?: RefundRequest): Promise<Payment> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${id}/refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: refundData ? JSON.stringify(refundData) : undefined,
      });
      
      return await this.handleResponse<Payment>(response);
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  // Get payment status
  static async getPaymentStatus(id: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${id}/status`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<PaymentStatusResponse>(response);
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw error;
    }
  }

  // ========================================
  // ORDER PAYMENT OPERATIONS
  // ========================================

  // Process order payment
  static async processOrderPayment(orderID: string, data: ProcessOrderPaymentRequest): Promise<OrderPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderID}/payments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse<OrderPaymentResponse>(response);
    } catch (error) {
      console.error('Error processing order payment:', error);
      throw error;
    }
  }

  // Get order payments
  static async getOrderPayments(orderID: string): Promise<OrderPaymentResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderID}/payments`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<OrderPaymentResponse[]>(response);
    } catch (error) {
      console.error('Error fetching order payments:', error);
      throw error;
    }
  }

  // Refund order payment
  static async refundOrderPayment(orderID: string, refundData: RefundRequest & { orderId: string }): Promise<OrderPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderID}/refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(refundData),
      });
      
      return await this.handleResponse<OrderPaymentResponse>(response);
    } catch (error) {
      console.error('Error refunding order payment:', error);
      throw error;
    }
  }

  // Get order payment status
  static async getOrderPaymentStatus(orderID: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderID}/payments/status`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Error fetching order payment status:', error);
      throw error;
    }
  }

  // ========================================
  // INVOICE OPERATIONS
  // ========================================

  // Get payment invoice
  static async getPaymentInvoice(paymentID: string): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentID}/invoice`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<Invoice>(response);
    } catch (error) {
      console.error('Error fetching payment invoice:', error);
      throw error;
    }
  }

  // Download payment invoice PDF
  static async downloadPaymentInvoicePDF(paymentID: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentID}/invoice/pdf`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new PaymentError(`Failed to download invoice PDF: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading payment invoice PDF:', error);
      throw error;
    }
  }

  // Email payment invoice
  static async emailPaymentInvoice(paymentID: string, email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentID}/invoice/email`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      
      return await this.handleResponse<{ message: string }>(response);
    } catch (error) {
      console.error('Error emailing payment invoice:', error);
      throw error;
    }
  }

  // Get order invoices
  static async getOrderInvoices(orderID: string): Promise<Invoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderID}/invoices`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<Invoice[]>(response);
    } catch (error) {
      console.error('Error fetching order invoices:', error);
      throw error;
    }
  }

  // Get specific invoice
  static async getInvoiceById(orderID: string, invoiceID: string): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderID}/invoices/${invoiceID}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<Invoice>(response);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  // Download invoice PDF
  static async downloadInvoicePDF(orderID: string, invoiceID: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderID}/invoices/${invoiceID}/pdf`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new PaymentError(`Failed to download invoice PDF: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  }

  // Email invoice
  static async emailInvoice(orderID: string, invoiceID: string, email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderID}/invoices/${invoiceID}/email`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      
      return await this.handleResponse<{ message: string }>(response);
    } catch (error) {
      console.error('Error emailing invoice:', error);
      throw error;
    }
  }

  // ========================================
  // TRANSACTION OPERATIONS
  // ========================================

  // Get payment transactions
  static async getPaymentTransactions(paymentID: string): Promise<PaymentTransaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentID}/transactions`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<{ paymentID: string; transactions: PaymentTransaction[] }>(response);
      return result.transactions;
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      throw error;
    }
  }

  // Create transaction
  static async createTransaction(data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse<PaymentTransaction>(response);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Get transaction by ID
  static async getTransactionById(id: string): Promise<PaymentTransaction> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<PaymentTransaction>(response);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  // Update transaction
  static async updateTransaction(id: string, data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse<PaymentTransaction>(response);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Verify transaction
  static async verifyTransaction(id: string): Promise<{ transactionID: string; isValid: boolean; verifiedAt: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<{ transactionID: string; isValid: boolean; verifiedAt: string }>(response);
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  }

  // Retry transaction
  static async retryTransaction(id: string): Promise<{ message: string; transactionID: string; retriedAt: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id}/retry`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<{ message: string; transactionID: string; retriedAt: string }>(response);
    } catch (error) {
      console.error('Error retrying transaction:', error);
      throw error;
    }
  }

  // Get transactions with filters
  static async getTransactions(filters?: {
    gateway?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ transactions: PaymentTransaction[]; count: number; filters: any }> {
    try {
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
      
      return await this.handleResponse<{ transactions: PaymentTransaction[]; count: number; filters: any }>(response);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Get failed transactions
  static async getFailedTransactions(): Promise<{ failedTransactions: PaymentTransaction[]; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/failed`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      return await this.handleResponse<{ failedTransactions: PaymentTransaction[]; count: number }>(response);
    } catch (error) {
      console.error('Error fetching failed transactions:', error);
      throw error;
    }
  }

  // Bulk retry transactions
  static async bulkRetryTransactions(transactionIds: string[]): Promise<BulkOperationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/bulk/retry`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ transactionIds }),
      });
      
      return await this.handleResponse<BulkOperationResponse>(response);
    } catch (error) {
      console.error('Error bulk retrying transactions:', error);
      throw error;
    }
  }

  // Bulk verify transactions
  static async bulkVerifyTransactions(transactionIds: string[]): Promise<BulkOperationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/bulk/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ transactionIds }),
      });
      
      return await this.handleResponse<BulkOperationResponse>(response);
    } catch (error) {
      console.error('Error bulk verifying transactions:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Search payments
  static async searchPayments(query: string): Promise<Payment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const result = await this.handleResponse<PaginatedPaymentsResponse>(response);
      return result.payments;
    } catch (error) {
      console.error('Error searching payments:', error);
      throw error;
    }
  }

  // Get service health
  static async getServiceHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`, {
        method: 'GET',
        credentials: 'include',
      });
      
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Error checking service health:', error);
      throw error;
    }
  }
}