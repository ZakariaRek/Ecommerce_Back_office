import { Shipping_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum ShippingStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED'
}

// Interfaces
export interface ShippingResponseDto {
  id: string;
  order_id: string;
  status: ShippingStatus;
  carrier: string;
  tracking_number: string;
  estimated_delivery?: string;
  shipped_date?: string;
  delivered_date?: string;
  created_at: string;
  updated_at: string;
  tracking_history?: ShipmentTrackingDto[];
}

export interface ShipmentTrackingDto {
  id: string;
  shipping_id: string;
  location: string;
  timestamp: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface CreateShippingRequest {
  order_id: string;
  carrier: string;
}

export interface UpdateStatusRequest {
  status: ShippingStatus;
  location?: string;
  notes?: string;
}

export interface TrackingResponse {
  shipping: ShippingResponseDto;
  tracking_history: ShipmentTrackingDto[];
}

export interface ShippingCostResponse {
  shipping_id: string;
  cost: number;
  currency: string;
}

export interface PaginatedShippingResponse {
  shippings: ShippingResponseDto[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
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

  let tokenFromCookie = getCookie('token') || getCookie('auth-token') || getCookie('userservice');
  
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
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Base URL for Shipping endpoints
const SHIPPING_BASE_URL = Shipping_Service_URL;

export class ShippingService {
  
  // Create new shipping
  static async createShipping(request: CreateShippingRequest): Promise<ShippingResponseDto> {
    try {
      const response = await fetch(`${SHIPPING_BASE_URL}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to create shipping: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<ShippingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create shipping');
      }

      return result.data!;
    } catch (error) {
      console.error('Error creating shipping:', error);
      throw error;
    }
  }

  // Get all shippings with pagination
  static async getAllShippings(limit: number = 10, offset: number = 0): Promise<PaginatedShippingResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${SHIPPING_BASE_URL}?${params}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch shippings: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<PaginatedShippingResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch shippings');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching shippings:', error);
      throw error;
    }
  }

  // Get shipping by ID
  static async getShippingById(shippingId: string): Promise<ShippingResponseDto> {
    try {
      const response = await fetch(`${SHIPPING_BASE_URL}/${shippingId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipping not found');
        }
        throw new Error(`Failed to fetch shipping: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<ShippingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch shipping');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching shipping by ID:', error);
      throw error;
    }
  }

  // Get shipping by order ID
  static async getShippingByOrderId(orderId: string): Promise<ShippingResponseDto> {
    try {
      const response = await fetch(`${SHIPPING_BASE_URL}/order/${orderId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipping not found for this order');
        }
        throw new Error(`Failed to fetch shipping by order: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<ShippingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch shipping by order');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching shipping by order ID:', error);
      throw error;
    }
  }

  // Update shipping
  static async updateShipping(shippingId: string, shipping: Partial<ShippingResponseDto>): Promise<ShippingResponseDto> {
    try {
      const response = await fetch(`${SHIPPING_BASE_URL}/${shippingId}`, {
        method: 'PUT',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(shipping)
      });

      if (!response.ok) {
        throw new Error(`Failed to update shipping: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<ShippingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update shipping');
      }

      return result.data!;
    } catch (error) {
      console.error('Error updating shipping:', error);
      throw error;
    }
  }

  // Update shipping status
  static async updateShippingStatus(shippingId: string, statusUpdate: UpdateStatusRequest): Promise<void> {
    try {
      const response = await fetch(`${SHIPPING_BASE_URL}/${shippingId}/status`, {
        method: 'PATCH',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(statusUpdate)
      });

      if (!response.ok) {
        throw new Error(`Failed to update shipping status: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update shipping status');
      }
    } catch (error) {
      console.error('Error updating shipping status:', error);
      throw error;
    }
  }

  // Track order (get shipping with tracking history)
  static async trackOrder(shippingId: string): Promise<TrackingResponse> {
    try {
      const response = await fetch(`${SHIPPING_BASE_URL}/${shippingId}/track`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipping not found');
        }
        throw new Error(`Failed to track order: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<TrackingResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to track order');
      }

      return result.data!;
    } catch (error) {
      console.error('Error tracking order:', error);
      throw error;
    }
  }

  // Get shipping cost
  static async getShippingCost(shippingId: string): Promise<ShippingCostResponse> {
    try {
      const response = await fetch(`${SHIPPING_BASE_URL}/${shippingId}/cost`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipping not found');
        }
        throw new Error(`Failed to get shipping cost: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<ShippingCostResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get shipping cost');
      }

      return result.data!;
    } catch (error) {
      console.error('Error getting shipping cost:', error);
      throw error;
    }
  }

  // Check if shipping exists
  static async shippingExists(shippingId: string): Promise<boolean> {
    try {
      await this.getShippingById(shippingId);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'Shipping not found') {
        return false;
      }
      throw error; // Re-throw other errors
    }
  }

  // Utility functions
  static formatTrackingNumber(trackingNumber: string): string {
    return trackingNumber.toUpperCase();
  }

  static formatCost(cost: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(cost);
  }

  static formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  static getStatusDisplayName(status: ShippingStatus): string {
    switch (status) {
      case ShippingStatus.PENDING:
        return 'Pending';
      case ShippingStatus.PREPARING:
        return 'Preparing';
      case ShippingStatus.SHIPPED:
        return 'Shipped';
      case ShippingStatus.IN_TRANSIT:
        return 'In Transit';
      case ShippingStatus.OUT_FOR_DELIVERY:
        return 'Out for Delivery';
      case ShippingStatus.DELIVERED:
        return 'Delivered';
      case ShippingStatus.FAILED:
        return 'Failed';
      case ShippingStatus.RETURNED:
        return 'Returned';
      default:
        return status;
    }
  }

  static getStatusColor(status: ShippingStatus): string {
    switch (status) {
      case ShippingStatus.PENDING:
        return '#FFA500'; // Orange
      case ShippingStatus.PREPARING:
        return '#1E90FF'; // DodgerBlue
      case ShippingStatus.SHIPPED:
        return '#32CD32'; // LimeGreen
      case ShippingStatus.IN_TRANSIT:
        return '#4169E1'; // RoyalBlue
      case ShippingStatus.OUT_FOR_DELIVERY:
        return '#FF6347'; // Tomato
      case ShippingStatus.DELIVERED:
        return '#008000'; // Green
      case ShippingStatus.FAILED:
        return '#DC143C'; // Crimson
      case ShippingStatus.RETURNED:
        return '#8B4513'; // SaddleBrown
      default:
        return '#666666'; // Gray
    }
  }

  static getStatusIcon(status: ShippingStatus): string {
    switch (status) {
      case ShippingStatus.PENDING:
        return '⏳';
      case ShippingStatus.PREPARING:
        return '📦';
      case ShippingStatus.SHIPPED:
        return '🚛';
      case ShippingStatus.IN_TRANSIT:
        return '🚚';
      case ShippingStatus.OUT_FOR_DELIVERY:
        return '🚐';
      case ShippingStatus.DELIVERED:
        return '✅';
      case ShippingStatus.FAILED:
        return '❌';
      case ShippingStatus.RETURNED:
        return '↩️';
      default:
        return '📋';
    }
  }

  static isDelivered(status: ShippingStatus): boolean {
    return status === ShippingStatus.DELIVERED;
  }

  static isInProgress(status: ShippingStatus): boolean {
    return [
      ShippingStatus.PREPARING,
      ShippingStatus.SHIPPED,
      ShippingStatus.IN_TRANSIT,
      ShippingStatus.OUT_FOR_DELIVERY
    ].includes(status);
  }

  static isFinalStatus(status: ShippingStatus): boolean {
    return [
      ShippingStatus.DELIVERED,
      ShippingStatus.FAILED,
      ShippingStatus.RETURNED
    ].includes(status);
  }

  // Search and filter utilities
  static searchShippings(shippings: ShippingResponseDto[], searchTerm: string): ShippingResponseDto[] {
    if (!searchTerm.trim()) return shippings;
    
    const term = searchTerm.toLowerCase();
    return shippings.filter(shipping => 
      shipping.id.toLowerCase().includes(term) ||
      shipping.order_id.toLowerCase().includes(term) ||
      shipping.tracking_number.toLowerCase().includes(term) ||
      shipping.carrier.toLowerCase().includes(term) ||
      shipping.status.toLowerCase().includes(term)
    );
  }

  static filterShippingsByStatus(shippings: ShippingResponseDto[], status: ShippingStatus | 'all'): ShippingResponseDto[] {
    if (status === 'all') return shippings;
    return shippings.filter(shipping => shipping.status === status);
  }

  static filterShippingsByCarrier(shippings: ShippingResponseDto[], carrier: string | 'all'): ShippingResponseDto[] {
    if (carrier === 'all') return shippings;
    return shippings.filter(shipping => shipping.carrier.toLowerCase() === carrier.toLowerCase());
  }

  static sortShippings(
    shippings: ShippingResponseDto[], 
    sortBy: 'created_at' | 'updated_at' | 'status' | 'carrier' | 'tracking_number',
    order: 'asc' | 'desc' = 'desc'
  ): ShippingResponseDto[] {
    return [...shippings].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'status':
          const statusOrder = {
            [ShippingStatus.PENDING]: 1,
            [ShippingStatus.PREPARING]: 2,
            [ShippingStatus.SHIPPED]: 3,
            [ShippingStatus.IN_TRANSIT]: 4,
            [ShippingStatus.OUT_FOR_DELIVERY]: 5,
            [ShippingStatus.DELIVERED]: 6,
            [ShippingStatus.FAILED]: 7,
            [ShippingStatus.RETURNED]: 8
          };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'carrier':
          aValue = a.carrier.toLowerCase();
          bValue = b.carrier.toLowerCase();
          break;
        case 'tracking_number':
          aValue = a.tracking_number.toLowerCase();
          bValue = b.tracking_number.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Get shipping statistics
  static getShippingStats(shippings: ShippingResponseDto[]): {
    total: number;
    byStatus: Record<ShippingStatus, number>;
    byCarrier: Record<string, number>;
  } {
    const stats = {
      total: shippings.length,
      byStatus: {} as Record<ShippingStatus, number>,
      byCarrier: {} as Record<string, number>
    };

    // Initialize status counts
    Object.values(ShippingStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Count by status and carrier
    shippings.forEach(shipping => {
      stats.byStatus[shipping.status]++;
      stats.byCarrier[shipping.carrier] = (stats.byCarrier[shipping.carrier] || 0) + 1;
    });

    return stats;
  }
}