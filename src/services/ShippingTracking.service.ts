import { Shipping_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum TrackingStatus {
  PENDING = 'PENDING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}

// Interfaces
export interface TrackingResponseDto {
  id: string;
  shipping_id: string;
  location: string;
  status: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTrackingRequest {
  shipping_id: string;
  location: string;
  status: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface AddTrackingUpdateRequest {
  location: string;
  status: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateTrackingLocationRequest {
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface TrackingWithShippingResponse {
  tracking: TrackingResponseDto;
  shipping: {
    id: string;
    order_id: string;
    carrier: string;
    tracking_number: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

export interface TrackingHistoryResponse {
  shipping_id: string;
  tracking_history: TrackingResponseDto[];
  count: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
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

// Base URL for API endpoints
const TRACKING_BASE_URL = Shipping_Service_URL + '/tracking';

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
  static async getTracking(trackingId: string): Promise<TrackingResponseDto> {
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

  // Get tracking history for a shipping
  static async getTrackingHistory(shippingId: string): Promise<TrackingHistoryResponse> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/shipping/${shippingId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No tracking history found for this shipping');
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

  // Add tracking update to existing shipping
  static async addTrackingUpdate(shippingId: string, request: AddTrackingUpdateRequest): Promise<TrackingResponseDto> {
    try {
      const response = await fetch(`${TRACKING_BASE_URL}/shipping/${shippingId}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(request)
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
          throw new Error('No tracking found for this shipping');
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
      console.error('Error fetching tracking details:', error);
      throw error;
    }
  }

  // Update tracking
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

  // Delete tracking
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
    return location.replace(/,/g, ', ').replace(/\s+/g, ' ').trim();
  }

  static getStatusDisplayName(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'PICKED_UP':
        return 'Picked Up';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'EXCEPTION':
        return 'Exception';
      case 'RETURNED':
        return 'Returned';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  static getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return '#FFA500'; // Orange
      case 'PICKED_UP':
        return '#1E90FF'; // DodgerBlue
      case 'IN_TRANSIT':
        return '#4169E1'; // RoyalBlue
      case 'OUT_FOR_DELIVERY':
        return '#FF6347'; // Tomato
      case 'DELIVERED':
        return '#008000'; // Green
      case 'EXCEPTION':
        return '#DC143C'; // Crimson
      case 'RETURNED':
        return '#8B4513'; // SaddleBrown
      case 'CANCELLED':
        return '#696969'; // DimGray
      default:
        return '#666666'; // Gray
    }
  }

  static getStatusIcon(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return '⏳';
      case 'PICKED_UP':
        return '📦';
      case 'IN_TRANSIT':
        return '🚛';
      case 'OUT_FOR_DELIVERY':
        return '🚐';
      case 'DELIVERED':
        return '✅';
      case 'EXCEPTION':
        return '⚠️';
      case 'RETURNED':
        return '↩️';
      case 'CANCELLED':
        return '❌';
      default:
        return '📋';
    }
  }

  // Search and filter utilities
  static searchTrackingHistory(trackingHistory: TrackingResponseDto[], searchTerm: string): TrackingResponseDto[] {
    if (!searchTerm.trim()) return trackingHistory;
    
    const term = searchTerm.toLowerCase();
    return trackingHistory.filter(tracking => 
      tracking.location.toLowerCase().includes(term) ||
      tracking.status.toLowerCase().includes(term) ||
      (tracking.notes && tracking.notes.toLowerCase().includes(term)) ||
      tracking.id.toLowerCase().includes(term)
    );
  }

  static filterTrackingByStatus(trackingHistory: TrackingResponseDto[], status: string): TrackingResponseDto[] {
    return trackingHistory.filter(tracking => tracking.status === status);
  }

  static filterTrackingByLocation(trackingHistory: TrackingResponseDto[], location: string): TrackingResponseDto[] {
    return trackingHistory.filter(tracking => tracking.location.includes(location));
  }

  static sortTracking(
    trackingHistory: TrackingResponseDto[], 
    sortBy: 'timestamp' | 'created_at' | 'status' | 'location',
    order: 'asc' | 'desc' = 'desc'
  ): TrackingResponseDto[] {
    return [...trackingHistory].sort((a, b) => {
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
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'location':
          aValue = a.location.toLowerCase();
          bValue = b.location.toLowerCase();
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
  static getTrackingStats(trackingHistory: TrackingResponseDto[]): {
    total: number;
    byStatus: Record<string, number>;
    byLocation: Record<string, number>;
    timeRange?: { earliest: string; latest: string };
  } {
    const stats = {
      total: trackingHistory.length,
      byStatus: {} as Record<string, number>,
      byLocation: {} as Record<string, number>
    };

    if (trackingHistory.length === 0) {
      return stats;
    }

    // Count by status and location
    trackingHistory.forEach(tracking => {
      stats.byStatus[tracking.status] = (stats.byStatus[tracking.status] || 0) + 1;
      stats.byLocation[tracking.location] = (stats.byLocation[tracking.location] || 0) + 1;
    });

    // Calculate time range
    const timestamps = trackingHistory.map(t => new Date(t.timestamp).getTime()).sort();
    if (timestamps.length > 0) {
      (stats as any).timeRange = {
        earliest: new Date(timestamps[0]).toISOString(),
        latest: new Date(timestamps[timestamps.length - 1]).toISOString()
      };
    }

    return stats;
  }

  // Get common locations
  static getCommonLocations(trackingHistory: TrackingResponseDto[]): string[] {
    const locationCounts = trackingHistory.reduce((acc, tracking) => {
      acc[tracking.location] = (acc[tracking.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([location]) => location);
  }

  // Get coordinates from tracking history
  static getTrackingCoordinates(trackingHistory: TrackingResponseDto[]): Array<{
    id: string;
    location: string;
    latitude: number;
    longitude: number;
    status: string;
    timestamp: string;
    notes?: string;
  }> {
    return trackingHistory
      .filter(tracking => tracking.latitude && tracking.longitude)
      .map(tracking => ({
        id: tracking.id,
        location: tracking.location,
        latitude: tracking.latitude!,
        longitude: tracking.longitude!,
        status: tracking.status,
        timestamp: tracking.timestamp,
        notes: tracking.notes
      }));
  }
}