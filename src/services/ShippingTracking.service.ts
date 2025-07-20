import { Shipping_Service_URL } from "../lib/apiEndPoints";

// Interfaces
export interface TrackingResponseDto {
  id: string;
  shipping_id: string;
  location: string;
  status: string;
  notes?: string;
  timestamp: string;
  created_at: string;
}

export interface TrackingWithShippingResponse {
  tracking: TrackingResponseDto;
  shipping: ShippingResponseDto;
}

export interface TrackingHistoryResponse {
  shipping_id: string;
  tracking_history: TrackingResponseDto[];
  count: number;
}

export interface CreateTrackingRequest {
  shipping_id: string;
  location: string;
  status: string;
  notes?: string;
}

export interface AddTrackingUpdateRequest {
  location: string;
  status: string;
  notes?: string;
}

export interface UpdateTrackingLocationRequest {
  location: string;
}

export interface ShippingResponseDto {
  id: string;
  order_id: string;
  status: string;
  carrier: string;
  tracking_number: string;
  estimated_delivery?: string;
  shipped_date?: string;
  delivered_date?: string;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Common tracking statuses
export enum TrackingStatus {
  PACKAGE_RECEIVED = 'Package received',
  IN_TRANSIT = 'In transit',
  OUT_FOR_DELIVERY = 'Out for delivery',
  DELIVERED = 'Delivered',
  ATTEMPTED_DELIVERY = 'Attempted delivery',
  RETURNED_TO_SENDER = 'Returned to sender',
  EXCEPTION = 'Exception',
  CUSTOMS_CLEARANCE = 'Customs clearance'
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

// Base URL for Tracking endpoints
const TRACKING_BASE_URL = `${Shipping_Service_URL}/tracking`;

export class TrackingService {
  
  // Create new tracking record
  static async createTracking(request: CreateTrackingRequest): Promise<TrackingResponseDto> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to create tracking: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<TrackingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create tracking');
      }

      return result.data!;
    } catch (error) {
      console.error('Error creating tracking:', error);
      throw error;
    }
  }

  // Get tracking by ID
  static async getTrackingById(trackingId: string): Promise<TrackingResponseDto> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/${trackingId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tracking record not found');
        }
        throw new Error(`Failed to fetch tracking: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<TrackingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tracking');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching tracking by ID:', error);
      throw error;
    }
  }

  // Update tracking record
  static async updateTracking(trackingId: string, tracking: Partial<TrackingResponseDto>): Promise<TrackingResponseDto> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/${trackingId}`, {
        method: 'PUT',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(tracking)
      });

      if (!response.ok) {
        throw new Error(`Failed to update tracking: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<TrackingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update tracking');
      }

      return result.data!;
    } catch (error) {
      console.error('Error updating tracking:', error);
      throw error;
    }
  }

  // Delete tracking record
  static async deleteTracking(trackingId: string): Promise<void> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/${trackingId}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete tracking: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete tracking');
      }
    } catch (error) {
      console.error('Error deleting tracking:', error);
      throw error;
    }
  }

  // Update tracking location
  static async updateTrackingLocation(trackingId: string, locationUpdate: UpdateTrackingLocationRequest): Promise<void> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/${trackingId}/location`, {
        method: 'PATCH',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(locationUpdate)
      });

      if (!response.ok) {
        throw new Error(`Failed to update tracking location: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update tracking location');
      }
    } catch (error) {
      console.error('Error updating tracking location:', error);
      throw error;
    }
  }

  // Get tracking with shipping details
  static async getTrackingWithShipping(trackingId: string): Promise<TrackingWithShippingResponse> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/${trackingId}/details`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tracking record not found');
        }
        throw new Error(`Failed to fetch tracking details: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<TrackingWithShippingResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tracking details');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching tracking with shipping:', error);
      throw error;
    }
  }

  // Get tracking history for shipping
  static async getTrackingHistory(shippingId: string): Promise<TrackingHistoryResponse> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/shipping/${shippingId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipping not found');
        }
        throw new Error(`Failed to fetch tracking history: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<TrackingHistoryResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tracking history');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching tracking history:', error);
      throw error;
    }
  }

  // Add tracking update for existing shipping
  static async addTrackingUpdate(shippingId: string, updateRequest: AddTrackingUpdateRequest): Promise<TrackingResponseDto> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/shipping/${shippingId}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(updateRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to add tracking update: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<TrackingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add tracking update');
      }

      return result.data!;
    } catch (error) {
      console.error('Error adding tracking update:', error);
      throw error;
    }
  }

  // Get latest tracking for shipping
  static async getLatestTracking(shippingId: string): Promise<TrackingResponseDto> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/shipping/${shippingId}/latest`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No tracking records found for this shipping');
        }
        throw new Error(`Failed to fetch latest tracking: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse<TrackingResponseDto> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch latest tracking');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching latest tracking:', error);
      throw error;
    }
  }

  // Check if tracking exists
  static async trackingExists(trackingId: string): Promise<boolean> {
    try {
      await this.getTrackingById(trackingId);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'Tracking record not found') {
        return false;
      }
      throw error; // Re-throw other errors
    }
  }

  // Utility functions
  static formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  static formatLocation(location: string): string {
    return location.replace(/\b\w/g, l => l.toUpperCase());
  }

  static getStatusDisplayName(status: string): string {
    return status.replace(/\b\w/g, l => l.toUpperCase());
  }

  static getStatusColor(status: string): string {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus.includes('delivered')) return '#008000'; // Green
    if (normalizedStatus.includes('out for delivery')) return '#FF6347'; // Tomato
    if (normalizedStatus.includes('in transit')) return '#4169E1'; // RoyalBlue
    if (normalizedStatus.includes('received')) return '#32CD32'; // LimeGreen
    if (normalizedStatus.includes('exception') || normalizedStatus.includes('failed')) return '#DC143C'; // Crimson
    if (normalizedStatus.includes('attempted')) return '#FFA500'; // Orange
    if (normalizedStatus.includes('returned')) return '#8B4513'; // SaddleBrown
    if (normalizedStatus.includes('customs')) return '#9370DB'; // MediumPurple
    
    return '#666666'; // Default gray
  }

  static getStatusIcon(status: string): string {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus.includes('delivered')) return '✅';
    if (normalizedStatus.includes('out for delivery')) return '🚐';
    if (normalizedStatus.includes('in transit')) return '🚚';
    if (normalizedStatus.includes('received')) return '📦';
    if (normalizedStatus.includes('exception') || normalizedStatus.includes('failed')) return '❌';
    if (normalizedStatus.includes('attempted')) return '🔄';
    if (normalizedStatus.includes('returned')) return '↩️';
    if (normalizedStatus.includes('customs')) return '🛃';
    
    return '📍'; // Default location pin
  }

  static isDeliveryStatus(status: string): boolean {
    return status.toLowerCase().includes('delivered');
  }

  static isFailureStatus(status: string): boolean {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus.includes('exception') || 
           normalizedStatus.includes('failed') || 
           normalizedStatus.includes('returned');
  }

  static isInTransitStatus(status: string): boolean {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus.includes('in transit') || 
           normalizedStatus.includes('out for delivery');
  }

  // Search and filter utilities
  static searchTrackingHistory(tracking: TrackingResponseDto[], searchTerm: string): TrackingResponseDto[] {
    if (!searchTerm.trim()) return tracking;
    
    const term = searchTerm.toLowerCase();
    return tracking.filter(record => 
      record.location.toLowerCase().includes(term) ||
      record.status.toLowerCase().includes(term) ||
      (record.notes && record.notes.toLowerCase().includes(term))
    );
  }

  static filterTrackingByStatus(tracking: TrackingResponseDto[], status: string | 'all'): TrackingResponseDto[] {
    if (status === 'all') return tracking;
    return tracking.filter(record => record.status.toLowerCase().includes(status.toLowerCase()));
  }

  static filterTrackingByLocation(tracking: TrackingResponseDto[], location: string | 'all'): TrackingResponseDto[] {
    if (location === 'all') return tracking;
    return tracking.filter(record => record.location.toLowerCase().includes(location.toLowerCase()));
  }

  static sortTracking(
    tracking: TrackingResponseDto[], 
    sortBy: 'timestamp' | 'location' | 'status' | 'created_at',
    order: 'asc' | 'desc' = 'desc'
  ): TrackingResponseDto[] {
    return [...tracking].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'location':
          aValue = a.location.toLowerCase();
          bValue = b.location.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Get tracking statistics
  static getTrackingStats(tracking: TrackingResponseDto[]): {
    total: number;
    byStatus: Record<string, number>;
    byLocation: Record<string, number>;
    timeRange: { earliest: string; latest: string } | null;
  } {
    const stats = {
      total: tracking.length,
      byStatus: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      timeRange: null as { earliest: string; latest: string } | null
    };

    if (tracking.length === 0) {
      return stats;
    }

    // Count by status and location
    const timestamps: number[] = [];
    tracking.forEach(record => {
      stats.byStatus[record.status] = (stats.byStatus[record.status] || 0) + 1;
      stats.byLocation[record.location] = (stats.byLocation[record.location] || 0) + 1;
      timestamps.push(new Date(record.timestamp).getTime());
    });

    // Calculate time range
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    stats.timeRange = {
      earliest: new Date(minTime).toISOString(),
      latest: new Date(maxTime).toISOString()
    };

    return stats;
  }

  // Get common locations
  static getCommonLocations(tracking: TrackingResponseDto[]): string[] {
    const locationCounts = tracking.reduce((acc, record) => {
      acc[record.location] = (acc[record.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([location]) => location);
  }

  // Get tracking timeline
  static getTrackingTimeline(tracking: TrackingResponseDto[]): TrackingResponseDto[] {
    return this.sortTracking(tracking, 'timestamp', 'asc');
  }

  // Calculate delivery time estimate
  static estimateDeliveryTime(tracking: TrackingResponseDto[]): string | null {
    const timeline = this.getTrackingTimeline(tracking);
    
    if (timeline.length < 2) {
      return null;
    }

    // Simple estimation based on average time between updates
    const intervals: number[] = [];
    for (let i = 1; i < timeline.length; i++) {
      const current = new Date(timeline[i].timestamp).getTime();
      const previous = new Date(timeline[i - 1].timestamp).getTime();
      intervals.push(current - previous);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const lastUpdate = new Date(timeline[timeline.length - 1].timestamp).getTime();
    const estimatedDelivery = new Date(lastUpdate + averageInterval * 2); // Estimate 2 more intervals

    return estimatedDelivery.toISOString();
  }
}