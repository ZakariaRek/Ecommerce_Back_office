// src/lib/paymentApiEndpoints.ts

const PAYMENT_BASE_URL = 'http://localhost:8099/api/payments';

// ========================================
// PAYMENT SERVICE ENDPOINTS
// ========================================

// Basic Payment Operations
export const Payment_Service_URL = PAYMENT_BASE_URL + "/payments";
export const CREATE_PAYMENT_URL = Payment_Service_URL;
export const GET_PAYMENT_URL = (id: string) => `${Payment_Service_URL}/${id}`;
export const UPDATE_PAYMENT_URL = (id: string) => `${Payment_Service_URL}/${id}`;
export const DELETE_PAYMENT_URL = (id: string) => `${Payment_Service_URL}/${id}`;
export const GET_ALL_PAYMENTS_URL = Payment_Service_URL;
export const GET_PAYMENTS_BY_ORDER_URL = (orderID: string) => `${Payment_Service_URL}/order/${orderID}`;
export const PROCESS_PAYMENT_URL = (id: string) => `${Payment_Service_URL}/${id}/process`;
export const REFUND_PAYMENT_URL = (id: string) => `${Payment_Service_URL}/${id}/refund`;
export const GET_PAYMENT_STATUS_URL = (id: string) => `${Payment_Service_URL}/${id}/status`;

// Payment Invoice Operations
export const GET_PAYMENT_INVOICE_URL = (id: string) => `${Payment_Service_URL}/${id}/invoice`;
export const GET_PAYMENT_INVOICE_PDF_URL = (id: string) => `${Payment_Service_URL}/${id}/invoice/pdf`;
export const EMAIL_PAYMENT_INVOICE_URL = (id: string) => `${Payment_Service_URL}/${id}/invoice/email`;
export const GET_PAYMENT_TRANSACTIONS_URL = (id: string) => `${Payment_Service_URL}/${id}/transactions`;

// ========================================
// ORDER PAYMENT ENDPOINTS
// ========================================

export const Order_Payment_Service_URL = PAYMENT_BASE_URL + "/orders";
export const PROCESS_ORDER_PAYMENT_URL = (orderID: string) => `${Order_Payment_Service_URL}/${orderID}/payments`;
export const GET_ORDER_PAYMENTS_URL = (orderID: string) => `${Order_Payment_Service_URL}/${orderID}/payments`;
export const REFUND_ORDER_PAYMENT_URL = (orderID: string) => `${Order_Payment_Service_URL}/${orderID}/refund`;
export const GET_ORDER_PAYMENT_STATUS_URL = (orderID: string) => `${Order_Payment_Service_URL}/${orderID}/payments/status`;

// Order Invoice Operations
export const GET_ORDER_INVOICES_URL = (orderID: string) => `${Order_Payment_Service_URL}/${orderID}/invoices`;
export const GET_INVOICE_BY_ID_URL = (orderID: string, invoiceID: string) => `${Order_Payment_Service_URL}/${orderID}/invoices/${invoiceID}`;
export const GET_INVOICE_PDF_URL = (orderID: string, invoiceID: string) => `${Order_Payment_Service_URL}/${orderID}/invoices/${invoiceID}/pdf`;
export const EMAIL_INVOICE_URL = (orderID: string, invoiceID: string) => `${Order_Payment_Service_URL}/${orderID}/invoices/${invoiceID}/email`;

// ========================================
// TRANSACTION MANAGEMENT ENDPOINTS
// ========================================

export const Transaction_Service_URL = PAYMENT_BASE_URL + "/transactions";
export const CREATE_TRANSACTION_URL = Transaction_Service_URL;
export const GET_TRANSACTION_URL = (id: string) => `${Transaction_Service_URL}/${id}`;
export const UPDATE_TRANSACTION_URL = (id: string) => `${Transaction_Service_URL}/${id}`;
export const VERIFY_TRANSACTION_URL = (id: string) => `${Transaction_Service_URL}/${id}/verify`;
export const RETRY_TRANSACTION_URL = (id: string) => `${Transaction_Service_URL}/${id}/retry`;

// Transaction Queries
export const GET_ALL_TRANSACTIONS_URL = Transaction_Service_URL;
export const GET_TRANSACTIONS_BY_PAYMENT_URL = (paymentID: string) => `${Transaction_Service_URL}/payment/${paymentID}`;
export const GET_TRANSACTIONS_BY_GATEWAY_URL = (gateway: string) => `${Transaction_Service_URL}/gateway/${gateway}`;
export const GET_FAILED_TRANSACTIONS_URL = `${Transaction_Service_URL}/failed`;

// Transaction Analytics
export const GET_TRANSACTION_ANALYTICS_URL = `${Transaction_Service_URL}/analytics`;
export const GET_GATEWAY_ANALYTICS_URL = `${Transaction_Service_URL}/analytics/gateways`;
export const GET_HOURLY_ANALYTICS_URL = `${Transaction_Service_URL}/analytics/hourly`;

// Bulk Transaction Operations
export const BULK_RETRY_TRANSACTIONS_URL = `${Transaction_Service_URL}/bulk/retry`;
export const BULK_VERIFY_TRANSACTIONS_URL = `${Transaction_Service_URL}/bulk/verify`;

// ========================================
// ANALYTICS & REPORTING ENDPOINTS
// ========================================

export const Analytics_Service_URL = PAYMENT_BASE_URL + "/analytics";

// Dashboard Metrics
export const GET_DASHBOARD_METRICS_URL = `${Analytics_Service_URL}/dashboard`;
export const GET_DASHBOARD_METRICS_BY_PERIOD_URL = (period: string) => `${Analytics_Service_URL}/dashboard/${period}`;

// Revenue Analytics
export const GET_REVENUE_ANALYTICS_URL = `${Analytics_Service_URL}/revenue`;
export const GET_REVENUE_BY_PERIOD_URL = (period: string) => `${Analytics_Service_URL}/revenue/${period}`;

// Transaction Analytics
export const GET_TRANSACTION_ANALYTICS_BASIC_URL = `${Analytics_Service_URL}/transactions`;
export const GET_SUCCESS_RATE_ANALYTICS_URL = `${Analytics_Service_URL}/transactions/success-rate`;
export const GET_PAYMENT_METHOD_ANALYTICS_URL = `${Analytics_Service_URL}/transactions/methods`;

// Gateway Performance
export const GET_GATEWAY_PERFORMANCE_URL = `${Analytics_Service_URL}/gateways`;

// Customer Analytics
export const GET_CUSTOMER_ANALYTICS_URL = `${Analytics_Service_URL}/customers`;

// Reports
export const GET_DAILY_REPORT_URL = `${Analytics_Service_URL}/reports/daily`;
export const GET_WEEKLY_REPORT_URL = `${Analytics_Service_URL}/reports/weekly`;
export const GET_MONTHLY_REPORT_URL = `${Analytics_Service_URL}/reports/monthly`;

// Export Endpoints
export const EXPORT_PAYMENTS_URL = `${Analytics_Service_URL}/export/payments`;
export const EXPORT_REVENUE_URL = `${Analytics_Service_URL}/export/revenue`;

// ========================================
// HEALTH & UTILITY ENDPOINTS
// ========================================

export const PAYMENT_HEALTH_URL = 'http://localhost:8082/health';
export const PAYMENT_TEST_URL = 'http://localhost:8082/test';
export const PAYMENT_ADMIN_INFO_URL = 'http://localhost:8082/admin/info';

// ========================================
// ENDPOINT GROUPS FOR EASY ACCESS
// ========================================

export const PAYMENT_ENDPOINTS = {
  // Basic Operations
  CREATE: CREATE_PAYMENT_URL,
  GET_BY_ID: GET_PAYMENT_URL,
  UPDATE: UPDATE_PAYMENT_URL,
  DELETE: DELETE_PAYMENT_URL,
  GET_ALL: GET_ALL_PAYMENTS_URL,
  GET_BY_ORDER: GET_PAYMENTS_BY_ORDER_URL,
  PROCESS: PROCESS_PAYMENT_URL,
  REFUND: REFUND_PAYMENT_URL,
  GET_STATUS: GET_PAYMENT_STATUS_URL,
  
  // Invoice Operations
  GET_INVOICE: GET_PAYMENT_INVOICE_URL,
  GET_INVOICE_PDF: GET_PAYMENT_INVOICE_PDF_URL,
  EMAIL_INVOICE: EMAIL_PAYMENT_INVOICE_URL,
  GET_TRANSACTIONS: GET_PAYMENT_TRANSACTIONS_URL,
};

export const ORDER_PAYMENT_ENDPOINTS = {
  PROCESS: PROCESS_ORDER_PAYMENT_URL,
  GET_PAYMENTS: GET_ORDER_PAYMENTS_URL,
  REFUND: REFUND_ORDER_PAYMENT_URL,
  GET_STATUS: GET_ORDER_PAYMENT_STATUS_URL,
  
  // Invoice Operations
  GET_INVOICES: GET_ORDER_INVOICES_URL,
  GET_INVOICE: GET_INVOICE_BY_ID_URL,
  GET_INVOICE_PDF: GET_INVOICE_PDF_URL,
  EMAIL_INVOICE: EMAIL_INVOICE_URL,
};

export const TRANSACTION_ENDPOINTS = {
  // Basic Operations
  CREATE: CREATE_TRANSACTION_URL,
  GET_BY_ID: GET_TRANSACTION_URL,
  UPDATE: UPDATE_TRANSACTION_URL,
  VERIFY: VERIFY_TRANSACTION_URL,
  RETRY: RETRY_TRANSACTION_URL,
  
  // Queries
  GET_ALL: GET_ALL_TRANSACTIONS_URL,
  GET_BY_PAYMENT: GET_TRANSACTIONS_BY_PAYMENT_URL,
  GET_BY_GATEWAY: GET_TRANSACTIONS_BY_GATEWAY_URL,
  GET_FAILED: GET_FAILED_TRANSACTIONS_URL,
  
  // Analytics
  GET_ANALYTICS: GET_TRANSACTION_ANALYTICS_URL,
  GET_GATEWAY_ANALYTICS: GET_GATEWAY_ANALYTICS_URL,
  GET_HOURLY_ANALYTICS: GET_HOURLY_ANALYTICS_URL,
  
  // Bulk Operations
  BULK_RETRY: BULK_RETRY_TRANSACTIONS_URL,
  BULK_VERIFY: BULK_VERIFY_TRANSACTIONS_URL,
};

export const ANALYTICS_ENDPOINTS = {
  // Dashboard
  DASHBOARD: GET_DASHBOARD_METRICS_URL,
  DASHBOARD_BY_PERIOD: GET_DASHBOARD_METRICS_BY_PERIOD_URL,
  
  // Revenue
  REVENUE: GET_REVENUE_ANALYTICS_URL,
  REVENUE_BY_PERIOD: GET_REVENUE_BY_PERIOD_URL,
  
  // Transactions
  TRANSACTION_ANALYTICS: GET_TRANSACTION_ANALYTICS_BASIC_URL,
  SUCCESS_RATE: GET_SUCCESS_RATE_ANALYTICS_URL,
  PAYMENT_METHODS: GET_PAYMENT_METHOD_ANALYTICS_URL,
  
  // Gateway
  GATEWAY_PERFORMANCE: GET_GATEWAY_PERFORMANCE_URL,
  
  // Customer
  CUSTOMER_ANALYTICS: GET_CUSTOMER_ANALYTICS_URL,
  
  // Reports
  DAILY_REPORT: GET_DAILY_REPORT_URL,
  WEEKLY_REPORT: GET_WEEKLY_REPORT_URL,
  MONTHLY_REPORT: GET_MONTHLY_REPORT_URL,
  
  // Exports
  EXPORT_PAYMENTS: EXPORT_PAYMENTS_URL,
  EXPORT_REVENUE: EXPORT_REVENUE_URL,
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Build URL with query parameters
export const buildUrlWithParams = (baseUrl: string, params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// Common query parameters
export const PAYMENT_QUERY_PARAMS = {
  PAGE: 'page',
  LIMIT: 'limit',
  STATUS: 'status',
  METHOD: 'method',
  DATE_FROM: 'dateFrom',
  DATE_TO: 'dateTo',
  ORDER_ID: 'orderID',
  CUSTOMER_EMAIL: 'customerEmail',
  SEARCH: 'search',
};

export const ANALYTICS_QUERY_PARAMS = {
  PERIOD: 'period',
  GROUP_BY: 'groupBy',
  DATE_FROM: 'dateFrom',
  DATE_TO: 'dateTo',
  PAYMENT_METHOD: 'paymentMethod',
  GATEWAY: 'gateway',
  STATUS: 'status',
  FORMAT: 'format',
};

// ========================================
// ERROR HANDLING CONSTANTS
// ========================================

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  INVALID_PAYMENT_DATA: 'Invalid payment data provided.',
  PAYMENT_NOT_FOUND: 'Payment not found.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction.',
  EXPIRED_CARD: 'Card has expired. Please use a different payment method.',
  INVALID_CARD: 'Invalid card information provided.',
  GATEWAY_ERROR: 'Payment gateway error. Please try again later.',
  SERVER_ERROR: 'Server error occurred. Please contact support.',
  UNAUTHORIZED_ACCESS: 'Unauthorized access. Please log in again.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
} as const;

// ========================================
// CONFIGURATION
// ========================================

export const PAYMENT_CONFIG = {
  BASE_URL: PAYMENT_BASE_URL,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const SUPPORTED_PAYMENT_METHODS = [
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PAYPAL',
  'BANK_TRANSFER',
  'CRYPTO',
  'POINTS',
  'GIFT_CARD'
] as const;

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY'
] as const;

export const EXPORT_FORMATS = [
  'csv',
  'excel',
  'pdf'
] as const;