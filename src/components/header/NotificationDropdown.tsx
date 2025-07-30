import { useState, useEffect, useCallback, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { 
  NotificationService, 
  NotificationResponseDto, 
  SSENotificationEvent,
  NotificationType,
  NotificationPriority,
  NotificationCategory 
} from "../../services/Notification.service";

interface NotificationDropdownProps {
  userId: string;
  className?: string;
  onNotificationReceived?: (notification: NotificationResponseDto) => void;
  maxNotifications?: number;
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
}

// Helper function to transform API response to expected format
const transformApiNotification = (apiNotification: any): NotificationResponseDto => {
  return {
    id: apiNotification.id,
    userId: apiNotification.userId,
    type: apiNotification.type as NotificationType || NotificationType.SYSTEM_ALERT,
    title: apiNotification.title || getDefaultTitle(apiNotification.type),
    message: apiNotification.message || apiNotification.content || 'No message provided',
    priority: apiNotification.priority as NotificationPriority || NotificationPriority.MEDIUM,
    category: apiNotification.category as NotificationCategory || getDefaultCategory(apiNotification.type),
    timestamp: apiNotification.timestamp || apiNotification.createdAt,
    expiresAt: apiNotification.expiresAt,
    isRead: apiNotification.isRead !== undefined ? apiNotification.isRead : (apiNotification.read !== undefined ? apiNotification.read : false),
    actionUrl: apiNotification.actionUrl,
    actionText: apiNotification.actionText,
    icon: apiNotification.icon,
    color: apiNotification.color,
    dismissible: apiNotification.dismissible !== false,
    duration: apiNotification.duration || 0,
    productId: apiNotification.productId,
    productName: apiNotification.productName,
    productImage: apiNotification.productImage,
    currentStock: apiNotification.currentStock,
    threshold: apiNotification.threshold,
    warehouseLocation: apiNotification.warehouseLocation,
    discountValue: apiNotification.discountValue,
    discountType: apiNotification.discountType,
    orderId: apiNotification.orderId,
    orderStatus: apiNotification.orderStatus
  };
};

// Helper function to get default title based on notification type
const getDefaultTitle = (type: string): string => {
  switch (type) {
    case 'PRODUCT_CREATED':
      return 'New Product Added';
    case 'PRODUCT_UPDATED':
      return 'Product Updated';
    case 'PRODUCT_DELETED':
      return 'Product Deleted';
    case 'INVENTORY_LOW_STOCK':
      return 'Low Stock Alert';
    case 'INVENTORY_OUT_OF_STOCK':
      return 'Out of Stock';
    case 'ORDER_STATUS':
      return 'Order Update';
    case 'PAYMENT_CONFIRMATION':
      return 'Payment Confirmed';
    case 'SHIPPING_UPDATE':
      return 'Shipping Update';
    case 'DISCOUNT_ACTIVATED':
      return 'Discount Activated';
    default:
      return 'Notification';
  }
};

// Helper function to get default category based on notification type
const getDefaultCategory = (type: string): NotificationCategory => {
  if (type?.includes('PRODUCT')) return NotificationCategory.PRODUCT;
  if (type?.includes('INVENTORY')) return NotificationCategory.INVENTORY;
  if (type?.includes('ORDER') || type?.includes('PAYMENT') || type?.includes('SHIPPING')) return NotificationCategory.ORDER;
  if (type?.includes('DISCOUNT')) return NotificationCategory.DISCOUNT;
  if (type?.includes('SYSTEM')) return NotificationCategory.SYSTEM;
  return NotificationCategory.GENERAL;
};

export default function NotificationDropdown({ 
  userId, 
  className = '', 
  onNotificationReceived,
  maxNotifications = 50,
  enableSound = true,
  enableBrowserNotifications = true
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false); // Changed to false initially
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'OPEN' | 'CLOSED'>('DISCONNECTED');
  
  const sseConnectionRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle SSE notification - FIXED VERSION
  const handleSSENotification = useCallback((notification: SSENotificationEvent) => {
    console.log('🔔 Received SSE notification:', notification);
    console.log('🔍 Notification type:', notification.type);
    console.log('🔍 Full notification object:', JSON.stringify(notification, null, 2));

    if (!mountedRef.current) {
      console.log('⚠️ Component unmounted, skipping notification');
      return;
    }

    // Skip connection events - they're not user notifications
    if (notification.type === 'CONNECTION_ESTABLISHED' || notification.type === 'CONNECTION_LOST') {
      console.log('📡 Connection event received, skipping notification processing');
      return;
    }

    // Add additional debugging
    console.log('✅ Processing notification as user notification');

    try {
      // Transform the notification to the expected format
      const newNotification: NotificationResponseDto = transformApiNotification(notification);

      console.log('🔄 Converted notification:', newNotification);

      // Add to notifications list (avoid duplicates)
      setNotifications(prev => {
        console.log('📋 Current notifications count:', prev.length);
        const exists = prev.some(n => n.id === newNotification.id);
        if (!exists) {
          const updated = [newNotification, ...prev].slice(0, maxNotifications);
          console.log('✅ Added new notification, total count:', updated.length);
          console.log('📝 Updated notifications list:', updated.map(n => ({ id: n.id, title: n.title })));
          return updated;
        } else {
          console.log('⚠️ Notification already exists, skipping');
        }
        return prev;
      });

      // Update unread count
      if (!newNotification.isRead) {
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('📊 Updated unread count:', newCount);
          return newCount;
        });
      }

      // Call external notification handler if provided
      if (onNotificationReceived) {
        console.log('📞 Calling external notification handler');
        onNotificationReceived(newNotification);
      }

      // Show browser notification if enabled
      if (enableBrowserNotifications) {
        console.log('🔔 Showing browser notification');
        NotificationService.showBrowserNotification(notification);
      }

      // Clear any previous errors since we received a notification
      setError(null);

    } catch (err) {
      console.error('❌ Error processing SSE notification:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        notification: notification
      });
      if (mountedRef.current) {
        setError('Error processing notification');
      }
    }
  }, [userId, onNotificationReceived, maxNotifications, enableBrowserNotifications]);

  // Load initial notifications - FIXED VERSION
  const loadNotifications = useCallback(async () => {
    if (!userId || userId === 'undefined' || userId.trim() === '') {
      console.warn('⚠️ Cannot load notifications: userId is invalid', userId);
      if (mountedRef.current) {
        setError('User ID is required');
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      console.log('📥 Loading notifications for user:', userId);
    }
    
    try {
      if (mountedRef.current) {
        setError(null);
      }

      const [userNotifications, unreadNotifications] = await Promise.all([
        NotificationService.getUserNotifications(userId),
        NotificationService.getUnreadNotifications(userId)
      ]);

      if (!mountedRef.current) return;

      // Transform the API responses to the expected format
      const transformedNotifications = userNotifications.map(transformApiNotification);
      const transformedUnreadNotifications = unreadNotifications.map(transformApiNotification);

      // Sort notifications by timestamp (newest first)
      const sortedNotifications = NotificationService.sortNotifications(
        transformedNotifications, 
        'timestamp', 
        'desc'
      ).slice(0, maxNotifications);

      console.log('✅ Loaded notifications:', {
        total: sortedNotifications.length,
        unread: transformedUnreadNotifications.length
      });

      setNotifications(sortedNotifications);
      setUnreadCount(transformedUnreadNotifications.length);

    } catch (err) {
      console.error('❌ Error loading notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications';
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId, maxNotifications]);

  // Connect to SSE
  const connectToSSE = useCallback(async () => {
    if (!userId || userId === 'undefined' || userId.trim() === '') {
      console.warn('⚠️ Cannot connect to SSE: userId is invalid', userId);
      if (mountedRef.current) {
        setError('User ID is required for real-time notifications');
      }
      return;
    }

    // Don't connect if already connected
    if (NotificationService.isConnected()) {
      console.log('🔗 SSE already connected');
      return;
    }

    try {
      console.log('🚀 Connecting to SSE for user:', userId);
      
      if (mountedRef.current) {
        setError(null);
        setConnectionStatus('CONNECTING');
      }

      const connection = NotificationService.connectToSSE(
        userId,
        handleSSENotification,
        (error) => {
          console.error('❌ SSE connection error:', error);
          if (mountedRef.current) {
            const errorMsg = error instanceof Error ? error.message : 'Connection error';
            setError(`Connection lost: ${errorMsg}`);
            setConnectionStatus('CLOSED');
          }
        },
        (event) => {
          console.log('✅ SSE connection established');
          if (mountedRef.current) {
            setConnectionStatus('OPEN');
            setError(null);
          }
        }
      );

      sseConnectionRef.current = connection;

      // Monitor connection status
      const statusInterval = setInterval(() => {
        if (!mountedRef.current) {
          clearInterval(statusInterval);
          return;
        }

        const status = NotificationService.getConnectionState() as typeof connectionStatus;
        setConnectionStatus(status);
        
        if (status === 'CLOSED' || status === 'DISCONNECTED') {
          clearInterval(statusInterval);
        }
      }, 2000);

    } catch (err) {
      console.error('❌ Error connecting to SSE:', err);
      if (mountedRef.current) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to establish real-time connection';
        setError(errorMsg);
        setConnectionStatus('DISCONNECTED');
      }
    }
  }, [userId, handleSSENotification]);

  // Disconnect from SSE
  const disconnectFromSSE = useCallback(() => {
    console.log('🔌 Disconnecting from SSE');
    
    NotificationService.disconnectSSE();
    sseConnectionRef.current = null;
    
    if (mountedRef.current) {
      setConnectionStatus('DISCONNECTED');
    }
  }, []);

  // Force reconnection
  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting...');
    disconnectFromSSE();
    setTimeout(() => {
      if (mountedRef.current) {
        connectToSSE();
      }
    }, 1000);
  }, [disconnectFromSSE, connectToSSE]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    console.log('📖 Marking notification as read:', notificationId);
    
    // Optimistic update
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );

    const wasUnread = notifications.find(n => n.id === notificationId && !n.isRead);
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await NotificationService.markAsRead(notificationId);
      console.log('✅ Notification marked as read successfully');
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
      // Revert optimistic update
      if (mountedRef.current) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
      }
    }
  }, [notifications, unreadCount]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    console.log('🗑️ Deleting notification:', notificationId);
    
    // Optimistic update
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    if (notificationToDelete && !notificationToDelete.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await NotificationService.deleteNotification(notificationId);
      console.log('✅ Notification deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting notification:', err);
      // Revert optimistic update
      if (mountedRef.current) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
      }
    }
  }, [notifications, unreadCount]);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: NotificationResponseDto) => {
    console.log('👆 Notification clicked:', notification.id);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('http')) {
        window.open(notification.actionUrl, '_blank');
      } else {
        window.location.href = notification.actionUrl;
      }
    }

    closeDropdown();
  }, [markAsRead, closeDropdown]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    if (unreadNotifications.length === 0) return;

    console.log('📖 Marking all notifications as read:', unreadNotifications.length);

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await Promise.all(
        unreadNotifications.map(notification => 
          NotificationService.markAsRead(notification.id)
        )
      );
      console.log('✅ All notifications marked as read');
    } catch (err) {
      console.error('❌ Error marking all notifications as read:', err);
      // Reload notifications on error
      loadNotifications();
    }
  }, [notifications, loadNotifications]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      console.log('🧪 Sending test notification...');
      const result = await NotificationService.sendTestNotification(userId);
      console.log('✅ Test notification sent:', result);
    } catch (err) {
      console.error('❌ Error sending test notification:', err);
    }
  }, [userId]);

  // Initialize component
  useEffect(() => {
    console.log('🎯 NotificationDropdown initializing for userId:', userId);
    
    if (userId && userId !== 'undefined' && userId.trim() !== '') {
      loadNotifications();
      connectToSSE();
    } else {
      console.warn('⚠️ NotificationDropdown: userId is invalid or undefined:', userId);
      if (mountedRef.current) {
        setError('User ID is required for notifications');
        setLoading(false);
      }
    }

    // Cleanup on unmount or userId change
    return () => {
      console.log('🧹 Cleaning up NotificationDropdown');
      disconnectFromSSE();
    };
  }, [userId, loadNotifications, connectToSSE, disconnectFromSSE]);

  // Request notification permissions on mount
  useEffect(() => {
    NotificationService.requestNotificationPermission().then(permission => {
      console.log('🔔 Notification permission:', permission);
    });
  }, []);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('🔍 State update - Notifications:', notifications.length, 'Unread:', unreadCount, 'Loading:', loading);
    if (notifications.length > 0) {
      console.log('📋 Current notifications:', notifications.map(n => ({ id: n.id, title: n.title, isRead: n.isRead })));
    }
  }, [notifications, unreadCount, loading]);

  // Get notification icon
  const getNotificationIcon = (notification: NotificationResponseDto) => {
    if (notification.icon) return notification.icon;
    return NotificationService.getNotificationIcon(notification.type);
  };

  // Get notification display color
  const getNotificationDisplayColor = (notification: NotificationResponseDto) => {
    if (notification.color) return notification.color;
    return NotificationService.getNotificationColor(notification.priority);
  };

  // Get connection status indicator
  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'OPEN':
        return { color: '#4caf50', text: 'Connected' };
      case 'CONNECTING':
        return { color: '#ff9800', text: 'Connecting...' };
      case 'CLOSED':
      case 'DISCONNECTED':
        return { color: '#f44336', text: 'Disconnected' };
      default:
        return { color: '#9e9e9e', text: 'Unknown' };
    }
  };

  // Render notification item
  const renderNotificationItem = (notification: NotificationResponseDto) => {
    const isUnread = !notification.isRead;
    const timeAgo = NotificationService.formatTimestamp(notification.timestamp);
    const displayColor = getNotificationDisplayColor(notification);
    const icon = getNotificationIcon(notification);
    const isExpired = NotificationService.isNotificationExpired(notification);

    return (
      <li key={notification.id}>
        <DropdownItem
          onItemClick={() => handleNotificationClick(notification)}
          className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
            isUnread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          } ${isExpired ? 'opacity-60' : ''}`}
        >
          <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: displayColor }}
            >
              {icon}
            </div>
            {isUnread && (
              <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-blue-500 dark:border-gray-900"></span>
            )}
            {isExpired && (
              <span className="absolute top-0 left-0 z-10 w-3 h-3 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center">
                ⏰
              </span>
            )}
          </span>

          <span className="block flex-1">
            <span className="mb-1.5 block text-theme-sm text-gray-800 dark:text-white/90 font-medium">
              {notification.title}
              {notification.priority === NotificationPriority.HIGH && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">
                  HIGH
                </span>
              )}
            </span>
            <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
              {notification.message}
            </span>

            {/* Additional context for specific notification types */}
            {notification.productName && (
              <span className="mb-1 block text-theme-xs text-blue-600 dark:text-blue-400">
                Product: {notification.productName}
              </span>
            )}
            
            {notification.currentStock !== undefined && notification.threshold !== undefined && (
              <span className="mb-1 block text-theme-xs text-orange-600 dark:text-orange-400">
                Stock: {notification.currentStock} / Threshold: {notification.threshold}
              </span>
            )}

            <span className="flex items-center justify-between gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
              <span className="flex items-center gap-2">
                <span>{NotificationService.getCategoryDisplayName(notification.category)}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{timeAgo}</span>
                {notification.actionText && (
                  <>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="text-blue-500">{notification.actionText}</span>
                  </>
                )}
              </span>
              
              {notification.dismissible && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete notification"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </span>
          </span>
        </DropdownItem>
      </li>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        title={`${unreadCount} unread notifications - ${getConnectionStatusIndicator().text}`}
      >
        {unreadCount > 0 && (
          <>
            <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
              <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
            </span>
            <span className="absolute -top-1 -right-1 z-10 min-w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
        
        {/* Connection status indicator */}
        <span 
          className="absolute bottom-0 left-0 w-2 h-2 rounded-full border border-white"
          style={{ backgroundColor: getConnectionStatusIndicator().color }}
        ></span>
        
        {connectionStatus === 'CONNECTING' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h5>
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <span 
              className="text-xs px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: getConnectionStatusIndicator().color + '20', 
                color: getConnectionStatusIndicator().color 
              }}
            >
              {getConnectionStatusIndicator().text}
            </span>
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs text-gray-500">
                ({notifications.length})
              </span>
            )}
            
            {/* Test notification button (development) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={sendTestNotification}
                className="text-purple-500 hover:text-purple-700 transition-colors text-xs"
                title="Send test notification"
              >
                🧪
              </button>
            )}
            
            {error && (
              <button
                onClick={() => loadNotifications()}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Retry loading notifications"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            {(connectionStatus === 'CLOSED' || connectionStatus === 'DISCONNECTED') && (
              <button
                onClick={forceReconnect}
                className="text-green-500 hover:text-green-700 transition-colors"
                title="Force reconnect"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
              </button>
            )}
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-500 hover:text-blue-700 transition-colors text-xs"
                title="Mark all as read"
              >
                ✓ All
              </button>
            )}
            
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col h-full overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-500">Loading notifications...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <p className="text-red-500 text-sm mb-2">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadNotifications()}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
                {(connectionStatus === 'CLOSED' || connectionStatus === 'DISCONNECTED') && (
                  <button
                    onClick={forceReconnect}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5m0-10v10m-5-17H5l5-5m0 10V3" />
              </svg>
              <p className="text-gray-500 text-sm">No notifications yet</p>
              <p className="text-gray-400 text-xs mt-1">
                {connectionStatus === 'OPEN' 
                  ? 'Connected and waiting for updates' 
                  : 'Connect to start receiving real-time updates'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col h-full overflow-y-auto custom-scrollbar">
              {notifications.map(renderNotificationItem)}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Link
            to="/notifications"
            className="block px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            onClick={closeDropdown}
          >
            View All Notifications
          </Link>
        </div>
      </Dropdown>
    </div>  
  );
}