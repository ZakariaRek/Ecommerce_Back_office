// lib/services/order.service.ts
import API_GATEWAY_BASE_URL from "../env";
/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED'
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  cartId: string;
  status: OrderStatus;
  totalAmount: number;
  tax: number;
  shippingCost: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
  billingAddressId: string;
  shippingAddressId: string;
  items?: OrderItem[];
}

export interface OrderTotal {
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
}

export interface Invoice {
  orderId: string;
  invoiceData: string;
  downloadUrl: string;
}

/* -------------------------------------------------------------------------- */
/*                            Request DTOs                                   */
/* -------------------------------------------------------------------------- */

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  discount?: number;
}

export interface CreateOrderRequest {
  userId: string;
  cartId: string;
  billingAddressId: string;
  shippingAddressId: string;
  items?: CreateOrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpdateOrderItemQuantityRequest {
  quantity: number;
}

/* -------------------------------------------------------------------------- */
/*                          BFF Enriched Types                              */
/* -------------------------------------------------------------------------- */

export enum ProductStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  DISCONTINUED = 'DISCONTINUED'
}

export interface ProductBatchInfo {
  id: string;
  name: string;
  imagePath: string;
  inStock: boolean;
  availableQuantity: number;
  status: string;
  price: number;
  productStatus: ProductStatus;
  discountValue?: number;
  discountType?: string;
}

export interface EnrichedOrderItem extends OrderItem {
  product?: ProductBatchInfo;
  productName?: string;
  productImage?: string;
}

export interface EnrichedOrderResponse {
  id: string;
  userId: string;
  cartId?: string;
  status: OrderStatus | string;
  totalAmount: number;
  tax: number;
  shippingCost: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
  billingAddressId: string;
  shippingAddressId: string;
  items: EnrichedOrderItem[];
  enrichmentMetadata?: {
    productsEnriched: boolean;
    enrichmentTimestamp: string;
    failedProductIds: string[];
  };
}

export interface BatchOrderRequest {
  orderIds: string[];
  includeProducts: boolean;
}

export interface BatchOrderResponse {
  orders: EnrichedOrderResponse[];
  failures: Record<string, string>;
  totalRequested: number;
  successful: number;
  failed: number;
  includeProducts: boolean;
  processingTimeMs: number;
}

/* -------------------------------------------------------------------------- */
/*                          User Orders Request Types                        */
/* -------------------------------------------------------------------------- */

export interface UserOrdersParams {
  userId: string;
  status?: string;
  includeProducts?: boolean;
  limit?: number;
}

/* -------------------------------------------------------------------------- */
/*                         Authentication & Headers                          */
/* -------------------------------------------------------------------------- */

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  // Try to get token from cookies first
  const getCookie = (name: string): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, ...cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue.join('=') || null;
      }
    }
    return null;
  };

  let tokenFromCookie = getCookie('user-service') || getCookie('jwt') || getCookie('authToken') || getCookie('token');
  
  if (tokenFromCookie) {
    tokenFromCookie = decodeURIComponent(tokenFromCookie);
    if (tokenFromCookie.startsWith('"') && tokenFromCookie.endsWith('"')) {
      tokenFromCookie = tokenFromCookie.slice(1, -1);
    }
    return tokenFromCookie;
  }
  
  try {
    const tokenFromStorage = localStorage.getItem('auth-token');
    return tokenFromStorage;
  } catch {
    return null;
  }
};

// Helper function to create request headers
const getRequestHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Helper function to get request options
const getRequestOptions = (method: string, body?: any): RequestInit => {
  const options: RequestInit = {
    method,
    headers: getRequestHeaders(),
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */

const ORDER_URL = `${API_GATEWAY_BASE_URL}/orders`;
const BFF_URL = `${API_GATEWAY_BASE_URL}/order`;

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

export class OrderService {
  
  /* -------------------------------------------------------------------------- */
  /*                            Basic Order Operations                         */
  /* -------------------------------------------------------------------------- */

  /**
   * Get all orders
   */
  static async getAllOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${ORDER_URL}/order`, getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Create a new order
   */
  static async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    try {
      const response = await fetch(ORDER_URL, getRequestOptions('POST', orderRequest));

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid order data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to create order: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}`, getRequestOptions('GET'));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  /**
   * Get orders by user ID
   */
  static async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${ORDER_URL}/user/${userId}`, getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`Failed to fetch orders by user: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders by user:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, statusUpdate: UpdateOrderStatusRequest): Promise<Order> {
    try {
      const response = await fetch(`${ORDER_URL}/order/${orderId}/status`, getRequestOptions('PATCH', statusUpdate));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to update order status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}/cancel`, getRequestOptions('POST'));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to cancel order: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  /**
   * Generate invoice for an order
   */
  static async generateInvoice(orderId: string): Promise<Invoice> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}/invoice`, getRequestOptions('GET'));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to generate invoice: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  /**
   * Get order items for an order
   */
  static async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}/items`, getRequestOptions('GET'));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to fetch order items: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order items:', error);
      throw error;
    }
  }

  /**
   * Add item to an order
   */
  static async addOrderItem(orderId: string, orderItemRequest: CreateOrderItemRequest): Promise<OrderItem> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}/items`, getRequestOptions('POST', orderItemRequest));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid item data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to add order item: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding order item:', error);
      throw error;
    }
  }

  /**
   * Update item quantity
   */
  static async updateItemQuantity(
    orderId: string,
    itemId: string,
    quantityUpdate: UpdateOrderItemQuantityRequest
  ): Promise<OrderItem> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}/items/${itemId}`, getRequestOptions('PATCH', quantityUpdate));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order or item not found');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid quantity data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to update item quantity: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  /**
   * Calculate order total
   */
  static async calculateOrderTotal(orderId: string): Promise<OrderTotal> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}/total`, getRequestOptions('GET'));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to calculate order total: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating order total:', error);
      throw error;
    }
  }

  /**
   * Remove an order item
   */
  static async removeOrderItem(orderId: string, itemId: string): Promise<void> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}/items/${itemId}`, getRequestOptions('DELETE'));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order or item not found');
        }
        throw new Error(`Failed to remove order item: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing order item:', error);
      throw error;
    }
  }

  /**
   * Get order summary (without items details)
   */
  static async getOrderSummary(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${ORDER_URL}/${orderId}/summary`, getRequestOptions('GET'));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to fetch order summary: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order summary:', error);
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                         BFF Enriched Operations                          */
  /* -------------------------------------------------------------------------- */

  /**
   * Get enriched order with product details
   */
  static async getEnrichedOrder(orderId: string, includeProducts: boolean = true): Promise<EnrichedOrderResponse> {
    try {
      const response = await fetch(`${BFF_URL}/${orderId}/enriched?includeProducts=${includeProducts}`, getRequestOptions('GET'));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to fetch enriched order: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching enriched order:', error);
      throw error;
    }
  }

  /**
   * Get enriched orders by user ID (single order response - legacy endpoint)
   */
  static async getEnrichedOrdersByUserId(userId: string, status?: string): Promise<EnrichedOrderResponse> {
    try {
      const queryParams = status ? `?status=${status}` : '';
      const response = await fetch(`${BFF_URL}/user/${userId}${queryParams}`, getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`Failed to fetch enriched orders by user: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching enriched orders by user:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get all enriched orders for a user (batch response with optimized processing)
   */
  static async getUserOrdersBatch(params: UserOrdersParams): Promise<BatchOrderResponse> {
    try {
      const {
        userId,
        status,
        includeProducts = true,
        limit = 20
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      queryParams.append('includeProducts', includeProducts.toString());
      queryParams.append('limit', limit.toString());

      const queryString = queryParams.toString();
      const url = `${BFF_URL}/user/${userId}/all${queryString ? `?${queryString}` : ''}`;

      console.log(`📞 Calling user orders batch endpoint: ${url}`);
      console.log(`🔑 Auth token present: ${!!getAuthToken()}`);

      const response = await fetch(url, getRequestOptions('GET'));

      if (!response.ok) {
        console.error(`❌ Request failed with status: ${response.status}`);
        throw new Error(`Failed to fetch user orders batch: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`✅ User orders batch response:`, {
        totalRequested: result.totalRequested,
        successful: result.successful,
        failed: result.failed,
        includeProducts: result.includeProducts,
        processingTimeMs: result.processingTimeMs
      });

      return result;
    } catch (error) {
      console.error('Error fetching user orders batch:', error);
      throw error;
    }
  }

  /**
   * Get multiple enriched orders in batch (for specific order IDs)
   */
  static async getEnrichedOrdersBatch(batchRequest: BatchOrderRequest): Promise<BatchOrderResponse> {
    try {
      const response = await fetch(`${BFF_URL}/batch`, getRequestOptions('POST', batchRequest));

      if (!response.ok) {
        throw new Error(`Failed to fetch batch enriched orders: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching batch enriched orders:', error);
      throw error;
    }
  }

  /**
   * Health check for BFF service
   */
  static async healthCheck(): Promise<string> {
    try {
      const response = await fetch(`${BFF_URL}/health`, getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Utility Methods                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Check if order exists
   */
  static async orderExists(orderId: string): Promise<boolean> {
    try {
      await this.getOrderById(orderId);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'Order not found') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if order can be cancelled
   */
  static canCancelOrder(order: Order): boolean {
    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    return cancellableStatuses.includes(order.status);
  }

  /**
   * Check if order can be returned
   */
  static canReturnOrder(order: Order): boolean {
    return order.status === OrderStatus.DELIVERED;
  }

  /**
   * Calculate days since order creation
   */
  static daysSinceCreated(order: Order): number {
    const createdDate = new Date(order.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format order status for display
   */
  static formatOrderStatus(status: OrderStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
  }

  /**
   * Calculate subtotal from items
   */
  static calculateSubtotalFromItems(items: OrderItem[]): number {
    return items.reduce((total, item) => total + item.total, 0);
  }

  /**
   * Get order status color for UI
   */
  static getOrderStatusColor(status: OrderStatus): string {
    const statusColors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '#FFA500',     // Orange
      [OrderStatus.CONFIRMED]: '#007BFF',   // Blue
      [OrderStatus.PROCESSING]: '#6F42C1',  // Purple
      [OrderStatus.SHIPPED]: '#20C997',     // Teal
      [OrderStatus.DELIVERED]: '#28A745',   // Green
      [OrderStatus.CANCELED]: '#DC3545',   // Red
      [OrderStatus.RETURNED]: '#FFC107',    // Yellow
      [OrderStatus.REFUNDED]: '#6C757D'     // Gray
    };
    return statusColors[status] || '#6C757D';
  }

  /**
   * Get order status badge class
   */
  static getOrderStatusBadgeClass(status: OrderStatus): string {
    const statusClasses: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800',
      [OrderStatus.SHIPPED]: 'bg-teal-100 text-teal-800',
      [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELED]: 'bg-red-100 text-red-800',
      [OrderStatus.RETURNED]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Filter orders by date range
   */
  static filterOrdersByDateRange(orders: Order[], startDate: Date, endDate: Date): Order[] {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  /**
   * Group orders by status
   */
  static groupOrdersByStatus(orders: Order[]): Record<string, Order[]> {
    return orders.reduce((grouped, order) => {
      const status = order.status;
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(order);
      return grouped;
    }, {} as Record<string, Order[]>);
  }

  /**
   * Calculate total order value for multiple orders
   */
  static calculateTotalValue(orders: Order[]): number {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  }

  /**
   * Search orders by product name (requires enriched orders)
   */
  static searchOrdersByProduct(orders: EnrichedOrderResponse[], productName: string): EnrichedOrderResponse[] {
    if (!productName.trim()) return orders;
    
    const searchTerm = productName.toLowerCase();
    return orders.filter(order =>
      order.items.some(item =>
        item.product?.name.toLowerCase().includes(searchTerm) ||
        item.productName?.toLowerCase().includes(searchTerm)
      )
    );
  }

  /**
   * Sort orders by different criteria
   */
  static sortOrders(
    orders: Order[],
    sortBy: 'createdAt' | 'updatedAt' | 'totalAmount' | 'status',
    order: 'asc' | 'desc' = 'desc'
  ): Order[] {
    return [...orders].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                           Batch Analysis Utilities                       */
  /* -------------------------------------------------------------------------- */

  /**
   * Analyze batch response performance
   */
  static analyzeBatchPerformance(batchResponse: BatchOrderResponse): {
    successRate: number;
    averageProcessingTime: number;
    recommendedBatchSize: number;
  } {
    const successRate = (batchResponse.successful / batchResponse.totalRequested) * 100;
    const averageProcessingTime = batchResponse.processingTimeMs / batchResponse.totalRequested;
    
    // Simple heuristic for recommended batch size based on performance
    let recommendedBatchSize = 20;
    if (averageProcessingTime < 50) {
      recommendedBatchSize = 50;
    } else if (averageProcessingTime > 200) {
      recommendedBatchSize = 10;
    }

    return {
      successRate,
      averageProcessingTime,
      recommendedBatchSize
    };
  }

  /**
   * Get failed order IDs from batch response
   */
  static getFailedOrderIds(batchResponse: BatchOrderResponse): string[] {
    return Object.keys(batchResponse.failures);
  }

  /**
   * Check if batch response has product enrichment
   */
  static hasProductEnrichment(batchResponse: BatchOrderResponse): boolean {
    return batchResponse.includeProducts && 
           batchResponse.orders.some(order => 
             order.items.some(item => item.product !== undefined)
           );
  }

  /* -------------------------------------------------------------------------- */
  /*                           Formatting Utilities                           */
  /* -------------------------------------------------------------------------- */

  /**
   * Format currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  /**
   * Format order summary for display
   */
  static getOrderSummaryText(order: Order): string {
    return `Order #${order.id.substring(0, 8)} - ${this.formatOrderStatus(order.status)} - ${this.formatCurrency(order.totalAmount)}`;
  }

  /* -------------------------------------------------------------------------- */
  /*                           Validation Utilities                           */
  /* -------------------------------------------------------------------------- */

  /**
   * Validate order creation request
   */
  static validateCreateOrderRequest(request: CreateOrderRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.userId?.trim()) {
      errors.push('User ID is required');
    }

    if (!request.cartId?.trim()) {
      errors.push('Cart ID is required');
    }

    if (!request.billingAddressId?.trim()) {
      errors.push('Billing address ID is required');
    }

    if (!request.shippingAddressId?.trim()) {
      errors.push('Shipping address ID is required');
    }

    if (request.items && request.items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    if (request.items) {
      request.items.forEach((item, index) => {
        if (!item.productId?.trim()) {
          errors.push(`Item ${index + 1}: Product ID is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (!item.priceAtPurchase || item.priceAtPurchase <= 0) {
          errors.push(`Item ${index + 1}: Price must be greater than 0`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate order status transition
   */
  static validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): { valid: boolean; error?: string } {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELED]: [],
      [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: []
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      return {
        valid: false,
        error: `Cannot transition from ${currentStatus} to ${newStatus}`
      };
    }

    return { valid: true };
  }

  /* -------------------------------------------------------------------------- */
  /*                           Debug Methods                                   */
  /* -------------------------------------------------------------------------- */

  /**
   * Debug authentication status
   */
  static debugAuth(): void {
    console.log('🔍 Order Service Auth Debug:');
    console.log('- Token:', getAuthToken() ? 'Present' : 'Missing');
    console.log('- Headers:', getRequestHeaders());
    console.log('- Cookies:', typeof window !== 'undefined' ? document.cookie : 'N/A (SSR)');
  }

  /**
   * Debug order service endpoints
   */
  static debugEndpoints(): void {
    console.log('🔍 Order Service Endpoints Debug:');
    console.log('- Order URL:', ORDER_URL);
    console.log('- BFF URL:', BFF_URL);
  }
}

// Export the service class
export default OrderService;