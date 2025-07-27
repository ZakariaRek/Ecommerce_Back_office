import { Notification_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  SHIPPING_UPDATE = 'SHIPPING_UPDATE',
  PRODUCT_RESTOCKED = 'PRODUCT_RESTOCKED',
  ACCOUNT_ACTIVITY = 'ACCOUNT_ACTIVITY',
  PROMOTION = 'PROMOTION',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  PRODUCT_STATUS_CHANGED = 'PRODUCT_STATUS_CHANGED',
  PRODUCT_PRICE_CHANGED = 'PRODUCT_PRICE_CHANGED',
  PRODUCT_STOCK_CHANGED = 'PRODUCT_STOCK_CHANGED',
  INVENTORY_LOW_STOCK = 'INVENTORY_LOW_STOCK',
  INVENTORY_OUT_OF_STOCK = 'INVENTORY_OUT_OF_STOCK',
  INVENTORY_RESTOCKED = 'INVENTORY_RESTOCKED',
  INVENTORY_THRESHOLD_CHANGED = 'INVENTORY_THRESHOLD_CHANGED',
  DISCOUNT_ACTIVATED = 'DISCOUNT_ACTIVATED',
  DISCOUNT_DEACTIVATED = 'DISCOUNT_DEACTIVATED',
  DISCOUNT_EXPIRED = 'DISCOUNT_EXPIRED',
  DISCOUNT_CREATED = 'DISCOUNT_CREATED',
  CATEGORY_CREATED = 'CATEGORY_CREATED',
  CATEGORY_UPDATED = 'CATEGORY_UPDATED',
  CATEGORY_DELETED = 'CATEGORY_DELETED',
  REVIEW_CREATED = 'REVIEW_CREATED',
  REVIEW_VERIFIED = 'REVIEW_VERIFIED',
  SUPPLIER_CREATED = 'SUPPLIER_CREATED',
  SUPPLIER_UPDATED = 'SUPPLIER_UPDATED',
  SUPPLIER_RATING_CHANGED = 'SUPPLIER_RATING_CHANGED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum NotificationCategory {
  INVENTORY = 'INVENTORY',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER',
  SYSTEM = 'SYSTEM',
  DISCOUNT = 'DISCOUNT',
  GENERAL = 'GENERAL'
}

// Interfaces
export interface NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  timestamp: string;
  expiresAt?: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  color?: string;
  dismissible: boolean;
  duration: number;
  productId?: string;
  productName?: string;
  productImage?: string;
  currentStock?: number;
  threshold?: number;
  warehouseLocation?: string;
  discountValue?: string;
  discountType?: string;
  orderId?: string;
  orderStatus?: string;
}

export interface SSENotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  category: string;
  timestamp: string;
  expiresAt?: string;
  isRead: boolean;
  dismissible: boolean;
  duration: number;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  color?: string;
  [key: string]: any;
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
const getRequestHeaders = (contentType = 'application/json'): HeadersInit => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': contentType
  };
};

// Base URLs
const NOTIFICATIONS_BASE_URL = Notification_Service_URL + "/notifications";
const SSE_BASE_URL = `${Notification_Service_URL}/sse`;

export class NotificationService {
  private static sseConnection: EventSource | null = null;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 3000;
  private static isReconnecting = false;
  private static currentUserId: string | null = null;

  // ================ NOTIFICATION CRUD OPERATIONS ================

  static async getUserNotifications(userId: string): Promise<NotificationResponseDto[]> {
    try {
      const response = await fetch(`${NOTIFICATIONS_BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  static async getUnreadNotifications(userId: string): Promise<NotificationResponseDto[]> {
    try {
      const response = await fetch(`${NOTIFICATIONS_BASE_URL}/user/${userId}/unread`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread notifications: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<NotificationResponseDto> {
    try {
      const response = await fetch(`${NOTIFICATIONS_BASE_URL}/${notificationId}/read`, {
        method: 'PUT',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${NOTIFICATIONS_BASE_URL}/${notificationId}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // ================ SSE CONNECTION MANAGEMENT ================
// Updated connectToSSE method in NotificationService
static connectToSSE(
  userId: string,
  onNotification: (notification: SSENotificationEvent) => void,
  onError?: (error: Event) => void,
  onOpen?: (event: Event) => void
): EventSource {
  console.log('🔌 Connecting to SSE for user:', userId);

  // Close existing connection
  this.disconnectSSE();

  const token = getAuthToken();
  if (!token) {
    const error = new Error('Authentication token not found');
    console.error('SSE connection failed:', error);
    if (onError) onError(error as any);
    throw error;
  }

  try {
    // Include token in URL as query parameter (works with EventSource)
    const sseUrl = `${SSE_BASE_URL}/connect/${userId}?token=${encodeURIComponent(token)}`;
    
    console.log(`🚀 Connecting to SSE: ${sseUrl.replace(/token=[^&]+/, 'token=***')}`);
    
    this.sseConnection = new EventSource(sseUrl, {
      withCredentials: true
    });

    this.currentUserId = userId;

    // Connection established
    this.sseConnection.onopen = (event) => {
      console.log('✅ SSE connection established');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      if (onOpen) onOpen(event);
    };

    // Handle specific notification events
    this.sseConnection.addEventListener('notification', (event) => {
      try {
        const notification: SSENotificationEvent = JSON.parse(event.data);
        console.log('🔔 Received notification event:', notification);
        onNotification(notification);
      } catch (error) {
        console.error('❌ Error parsing notification:', error, 'Data:', event.data);
      }
    });

    // Handle system alerts
    this.sseConnection.addEventListener('system-alert', (event) => {
      try {
        const alert: SSENotificationEvent = JSON.parse(event.data);
        console.log('🚨 Received system alert:', alert);
        onNotification(alert);
      } catch (error) {
        console.error('❌ Error parsing system alert:', error, 'Data:', event.data);
      }
    });

    // Handle connection events - DON'T pass these to onNotification
    this.sseConnection.addEventListener('connection', (event) => {
      try {
        const connectionEvent = JSON.parse(event.data);
        console.log('🔗 SSE connection event:', connectionEvent);
        // Don't call onNotification for connection events
        // These are internal system events, not user notifications
      } catch (error) {
        console.error('❌ Error parsing connection event:', error, 'Data:', event.data);
      }
    });

    // Handle heartbeat events
    this.sseConnection.addEventListener('heartbeat', (event) => {
      try {
        const heartbeat = JSON.parse(event.data);
        console.debug('💓 SSE heartbeat received:', heartbeat);
      } catch (error) {
        console.error('❌ Error parsing heartbeat:', error, 'Data:', event.data);
      }
    });

    // Handle general message events (fallback) - BUT be more selective
    this.sseConnection.onmessage = (event) => {
      try {
        console.log('📨 SSE general message received:', event);
        const data = JSON.parse(event.data);
        console.log('📄 Parsed message data:', data);
        
        // Only pass actual notifications, not connection events
        if (data.type && !data.type.includes('CONNECTION')) {
          onNotification(data);
        }
      } catch (error) {
        console.error('❌ Error parsing general message:', error, 'Data:', event.data);
      }
    };

    // Handle errors with reconnection logic
    this.sseConnection.onerror = (event) => {
      console.error('❌ SSE error:', event);
      
      if (onError) onError(event);

      // Check the readyState to understand the error
      switch (this.sseConnection?.readyState) {
        case EventSource.CONNECTING:
          console.log('🔄 SSE is reconnecting...');
          break;
        case EventSource.CLOSED:
          console.log('🔌 SSE connection was closed');
          this.handleReconnection(userId, onNotification, onError, onOpen);
          break;
        default:
          console.log('❓ SSE connection in unknown state');
      }
    };

    return this.sseConnection;
  } catch (error) {
    console.error('❌ Error establishing SSE connection:', error);
    throw error;
  }
}

  private static handleReconnection(
    userId: string,
    onNotification: (notification: SSENotificationEvent) => void,
    onError?: (error: Event) => void,
    onOpen?: (event: Event) => void
  ): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('💀 Max reconnection attempts reached');
      }
      return;
    }

    this.isReconnecting = true;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    
    console.log(`🔄 Reconnecting SSE in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connectToSSE(userId, onNotification, onError, onOpen);
    }, delay);
  }

  static disconnectSSE(): void {
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
      this.currentUserId = null;
      console.log('🔌 SSE connection closed');
    }
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
  }

  static isConnected(): boolean {
    return this.sseConnection?.readyState === EventSource.OPEN;
  }

  static getConnectionState(): string {
    if (!this.sseConnection) return 'DISCONNECTED';
    
    switch (this.sseConnection.readyState) {
      case EventSource.CONNECTING:
        return 'CONNECTING';
      case EventSource.OPEN:
        return 'OPEN';
      case EventSource.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  static forceReconnect(): void {
    if (this.currentUserId) {
      console.log('🔄 Force reconnecting...');
      this.disconnectSSE();
      // We need the callbacks to reconnect, so this method is limited
      // Better to call connectToSSE again from the component
    }
  }

  // ================ TEST FUNCTIONS ================

  static async sendTestNotification(userId: string): Promise<any> {
    try {
      const response = await fetch(`${SSE_BASE_URL}/test/${userId}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to send test notification: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  static async getSSEStats(): Promise<any> {
    try {
      const response = await fetch(`${SSE_BASE_URL}/stats`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch SSE stats: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching SSE stats:', error);
      throw error;
    }
  }

  static async getUserConnectionStats(userId: string): Promise<any> {
    try {
      const response = await fetch(`${SSE_BASE_URL}/stats/${userId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user connection stats: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user connection stats:', error);
      throw error;
    }
  }

  static async getSSEHealthCheck(): Promise<any> {
    try {
      const response = await fetch(`${SSE_BASE_URL}/health`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch SSE health: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching SSE health:', error);
      throw error;
    }
  }

  // ================ UTILITY FUNCTIONS ================

  static formatTimestamp(timestamp: string): string {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hr ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  static getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return '📦';
      case NotificationType.PAYMENT_CONFIRMATION:
        return '💳';
      case NotificationType.SHIPPING_UPDATE:
        return '🚚';
      case NotificationType.PRODUCT_RESTOCKED:
        return '📈';
      case NotificationType.INVENTORY_LOW_STOCK:
        return '⚠️';
      case NotificationType.INVENTORY_OUT_OF_STOCK:
        return '❌';
      case NotificationType.DISCOUNT_ACTIVATED:
        return '🏷️';
      case NotificationType.SYSTEM_ALERT:
        return '🔔';
      default:
        return '📢';
    }
  }

  static getNotificationColor(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.HIGH:
        return '#f44336';
      case NotificationPriority.MEDIUM:
        return '#ff9800';
      case NotificationPriority.LOW:
        return '#4caf50';
      default:
        return '#2196f3';
    }
  }

  static getCategoryDisplayName(category: NotificationCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  static isNotificationExpired(notification: NotificationResponseDto): boolean {
    if (!notification.expiresAt) return false;
    return new Date(notification.expiresAt) < new Date();
  }

  static sortNotifications(
    notifications: NotificationResponseDto[],
    sortBy: 'timestamp' | 'priority' | 'type' | 'isRead' = 'timestamp',
    order: 'asc' | 'desc' = 'desc'
  ): NotificationResponseDto[] {
    return [...notifications].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'priority':
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'isRead':
          aValue = a.isRead ? 1 : 0;
          bValue = b.isRead ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Browser notification support
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  static async showBrowserNotification(notification: SSENotificationEvent): Promise<void> {
    const permission = await this.requestNotificationPermission();
    
    if (permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/images/notification-icon.png',
        badge: '/images/notification-badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'HIGH',
        timestamp: new Date(notification.timestamp).getTime()
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      };

      if (notification.duration > 0) {
        setTimeout(() => {
          browserNotification.close();
        }, notification.duration * 1000);
      }
    }
  }
}