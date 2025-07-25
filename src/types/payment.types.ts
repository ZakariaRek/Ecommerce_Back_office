// src/types/payment.types.ts

// Core payment interfaces matching backend models
export interface Payment {
  id: string;
  orderID: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  currency?: string;
  description?: string;
  customerEmail?: string;
  gatewayResponse?: string;
}

// Payment statuses from backend
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

// Payment methods from backend
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTO = 'CRYPTO',
  POINTS = 'POINTS',
  GIFT_CARD = 'GIFT_CARD'
}

// Transaction interface
export interface PaymentTransaction {
  id: string;
  paymentID: string;
  paymentGateway: string;
  gatewayTransactionId: string;
  amount: number;
  status: TransactionStatus;
  responseData?: string;
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TransactionStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRY_FAILED = 'retry_failed',
  VERIFIED = 'verified'
}

// Invoice interface
export interface Invoice {
  id: string;
  orderID: string;
  paymentID: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount?: number;
  paymentMethod?: string;
  status: string;
}

// Request/Response interfaces for API calls
export interface CreatePaymentRequest {
  orderID: string;
  amount: number;
  paymentMethod: PaymentMethod;
  currency?: string;
  description?: string;
  customerEmail?: string;
}

export interface ProcessOrderPaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  currency?: string;
}

export interface OrderPaymentResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  createdAt: string;
  message?: string;
  invoiceNumber?: string;
}

export interface RefundRequest {
  amount?: number;
  reason?: string;
}

export interface PaymentStatusResponse {
  payment_id: string;
  status: PaymentStatus;
}

// Filter and pagination types
export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  customerEmail?: string;
  orderID?: string;
}

export interface PaginatedPaymentsResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: PaymentFilters;
}

// Bulk operations
export interface BulkTransactionRequest {
  transactionIds: string[];
}

export interface BulkTransactionResult {
  transactionID: string;
  success: boolean;
  error?: string;
  message?: string;
  isValid?: boolean;
  verifiedAt?: string;
}

export interface BulkOperationResponse {
  bulkRetryResults?: BulkTransactionResult[];
  bulkVerifyResults?: BulkTransactionResult[];
  totalProcessed: number;
  processedAt: string;
}

// Utility functions
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return 'green';
    case PaymentStatus.PENDING:
      return 'yellow';
    case PaymentStatus.FAILED:
      return 'red';
    case PaymentStatus.REFUNDED:
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'blue';
    default:
      return 'gray';
  }
};

export const getPaymentMethodDisplay = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.CREDIT_CARD:
      return 'Credit Card';
    case PaymentMethod.DEBIT_CARD:
      return 'Debit Card';
    case PaymentMethod.PAYPAL:
      return 'PayPal';
    case PaymentMethod.BANK_TRANSFER:
      return 'Bank Transfer';
    case PaymentMethod.CRYPTO:
      return 'Cryptocurrency';
    case PaymentMethod.POINTS:
      return 'Loyalty Points';
    case PaymentMethod.GIFT_CARD:
      return 'Gift Card';
    default:
      return method;
  }
};

export const getTransactionStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case TransactionStatus.COMPLETED:
    case TransactionStatus.VERIFIED:
      return 'green';
    case TransactionStatus.PENDING:
    case TransactionStatus.AUTHORIZED:
      return 'yellow';
    case TransactionStatus.FAILED:
    case TransactionStatus.RETRY_FAILED:
      return 'red';
    case TransactionStatus.CAPTURED:
      return 'blue';
    default:
      return 'gray';
  }
};

// Common sort options
export const PAYMENT_SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'amount', label: 'Amount' },
  { value: 'status', label: 'Status' },
  { value: 'method', label: 'Payment Method' },
  { value: 'customerEmail', label: 'Customer Email' }
] as const;

// API error handling
export interface PaymentApiError {
  message: string;
  code?: string;
  field?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: PaymentApiError;
  message?: string;
}