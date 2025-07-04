import { Cart_Service_URL } from "../lib/apiEndPoints";

// Interfaces for API requests
export interface AddItemRequest {
  productId: string; // UUID from Java becomes string in JSON
  quantity: number;  // Integer from Java becomes number in TypeScript
  price: number;     // BigDecimal from Java becomes number in JSON
}

export interface UpdateQuantityRequest {
  quantity: number;  // Integer from Java becomes number in TypeScript
}

export interface SaveForLaterRequest {
  productId: string; // UUID from Java becomes string in JSON
}

export interface MoveToCartRequest {
  price: number;     // BigDecimal from Java becomes number in JSON
}

// Interfaces for API responses
export interface CartItemResponse {
  id: string;        // UUID from Java becomes string in JSON
  productId: string; // UUID from Java becomes string in JSON
  quantity: number;  // int from Java becomes number in TypeScript
  price: number;     // BigDecimal from Java becomes number in JSON
  subtotal: number;  // BigDecimal from Java becomes number in JSON
  addedAt: string;   // LocalDateTime from Java becomes ISO string in JSON
}

export interface ShoppingCartResponse {
  id: string;        // UUID from Java becomes string in JSON
  userId: string;    // UUID from Java becomes string in JSON
  items: CartItemResponse[];
  total: number;     // BigDecimal from Java becomes number in JSON
  createdAt: string; // LocalDateTime from Java becomes ISO string in JSON
  updatedAt: string; // LocalDateTime from Java becomes ISO string in JSON
  expiresAt: string; // LocalDateTime from Java becomes ISO string in JSON
}

export interface SavedItemResponse {
  id: string;        // UUID from Java becomes string in JSON
  productId: string; // UUID from Java becomes string in JSON
  savedAt: string;   // LocalDateTime from Java becomes ISO string in JSON
}

export interface CartTotalResponse {
  total: number;     // BigDecimal from Java becomes number in JSON
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  // Note: No timestamp field in the Java DTO
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

// Base URL for cart endpoints
const CART_BASE_URL = `${Cart_Service_URL}`;

export class CartService {
  
  // Get cart by user ID
  static async getCart(userId: string): Promise<ShoppingCartResponse> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiResponse<ShoppingCartResponse> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  // Add item to cart
  static async addItemToCart(userId: string, request: AddItemRequest): Promise<ShoppingCartResponse> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/items`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid request data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to add item to cart: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiResponse<ShoppingCartResponse> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Remove item from cart
  static async removeItemFromCart(userId: string, productId: string): Promise<ShoppingCartResponse> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/items/${productId}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Item not found in cart');
        }
        throw new Error(`Failed to remove item from cart: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiResponse<ShoppingCartResponse> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  // Update item quantity
  static async updateItemQuantity(
    userId: string, 
    productId: string, 
    request: UpdateQuantityRequest
  ): Promise<ShoppingCartResponse> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/items/${productId}`, {
        method: 'PUT',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invalid quantity (must be at least 1)');
        }
        if (response.status === 404) {
          throw new Error('Item not found in cart');
        }
        throw new Error(`Failed to update item quantity: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiResponse<ShoppingCartResponse> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  // Get cart total
  static async getCartTotal(userId: string): Promise<number> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/total`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Cart not found');
        }
        throw new Error(`Failed to get cart total: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiResponse<CartTotalResponse> = await response.json();
      return apiResponse.data.total;
    } catch (error) {
      console.error('Error getting cart total:', error);
      throw error;
    }
  }

  // Checkout cart
  static async checkout(userId: string): Promise<void> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/checkout`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invalid cart state');
        }
        if (response.status === 404) {
          throw new Error('Cart not found');
        }
        throw new Error(`Failed to checkout: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
  }

  // Get saved items
  static async getSavedItems(userId: string): Promise<SavedItemResponse[]> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/saved`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch saved items: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiResponse<SavedItemResponse[]> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error('Error fetching saved items:', error);
      throw error;
    }
  }

  // Save item for later
  static async saveForLater(userId: string, request: SaveForLaterRequest): Promise<SavedItemResponse> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/saved`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid request data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to save item for later: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiResponse<SavedItemResponse> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error('Error saving item for later:', error);
      throw error;
    }
  }

  // Move saved item to cart
  static async moveToCart(
    userId: string, 
    productId: string, 
    request: MoveToCartRequest
  ): Promise<ShoppingCartResponse> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/saved/${productId}/move-to-cart`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid request data: ${errorData?.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('Saved item not found');
        }
        throw new Error(`Failed to move item to cart: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiResponse<ShoppingCartResponse> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error('Error moving item to cart:', error);
      throw error;
    }
  }

  // Remove item from saved
  static async removeFromSaved(userId: string, productId: string): Promise<void> {
    try {
      const response = await fetch(`${CART_BASE_URL}/${userId}/saved/${productId}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Saved item not found');
        }
        throw new Error(`Failed to remove saved item: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing saved item:', error);
      throw error;
    }
  }

  // Utility methods

  // Calculate item subtotal
  static calculateItemSubtotal(quantity: number, price: number): number {
    return quantity * price;
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Format date
  static formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  // Check if cart is empty
  static isCartEmpty(cart: ShoppingCartResponse): boolean {
    return !cart.items || cart.items.length === 0;
  }

  // Get cart item count
  static getCartItemCount(cart: ShoppingCartResponse): number {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Find item in cart by product ID
  static findCartItem(cart: ShoppingCartResponse, productId: string): CartItemResponse | undefined {
    return cart.items.find(item => item.productId === productId);
  }

  // Check if product is in cart
  static isProductInCart(cart: ShoppingCartResponse, productId: string): boolean {
    return this.findCartItem(cart, productId) !== undefined;
  }

  // Helper methods to create request objects

  // Create AddItemRequest with validation
  static createAddItemRequest(productId: string, quantity: number, price: number): AddItemRequest {
    const request: AddItemRequest = { productId, quantity, price };
    const validation = this.validateAddItemRequest(request);
    
    if (!validation.valid) {
      throw new Error(`Invalid AddItemRequest: ${validation.errors.join(', ')}`);
    }
    
    return request;
  }

  // Create UpdateQuantityRequest with validation
  static createUpdateQuantityRequest(quantity: number): UpdateQuantityRequest {
    const request: UpdateQuantityRequest = { quantity };
    const validation = this.validateUpdateQuantityRequest(request);
    
    if (!validation.valid) {
      throw new Error(`Invalid UpdateQuantityRequest: ${validation.errors.join(', ')}`);
    }
    
    return request;
  }

  // Create MoveToCartRequest with validation
  static createMoveToCartRequest(price: number): MoveToCartRequest {
    const request: MoveToCartRequest = { price };
    const validation = this.validateMoveToCartRequest(request);
    
    if (!validation.valid) {
      throw new Error(`Invalid MoveToCartRequest: ${validation.errors.join(', ')}`);
    }
    
    return request;
  }

  // Create SaveForLaterRequest with validation
  static createSaveForLaterRequest(productId: string): SaveForLaterRequest {
    const request: SaveForLaterRequest = { productId };
    const validation = this.validateSaveForLaterRequest(request);
    
    if (!validation.valid) {
      throw new Error(`Invalid SaveForLaterRequest: ${validation.errors.join(', ')}`);
    }
    
    return request;
  }

  // Validation methods matching Java validation constraints

  // Validate AddItemRequest
  static validateAddItemRequest(request: AddItemRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Product ID validation (@NotNull)
    if (!request.productId) {
      errors.push('Product ID is required');
    }

    // Quantity validation (@NotNull, @Min(value = 1))
    if (request.quantity === null || request.quantity === undefined) {
      errors.push('Quantity is required');
    } else if (request.quantity < 1) {
      errors.push('Quantity must be at least 1');
    } else if (!Number.isInteger(request.quantity)) {
      errors.push('Quantity must be a whole number');
    }

    // Price validation (@NotNull, @Min(value = 0))
    if (request.price === null || request.price === undefined) {
      errors.push('Price is required');
    } else if (request.price < 0) {
      errors.push('Price cannot be negative');
    }

    return { valid: errors.length === 0, errors };
  }

  // Validate UpdateQuantityRequest
  static validateUpdateQuantityRequest(request: UpdateQuantityRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Quantity validation (@NotNull, @Min(value = 1))
    if (request.quantity === null || request.quantity === undefined) {
      errors.push('Quantity is required');
    } else if (request.quantity < 1) {
      errors.push('Quantity must be at least 1');
    } else if (!Number.isInteger(request.quantity)) {
      errors.push('Quantity must be a whole number');
    }

    return { valid: errors.length === 0, errors };
  }

  // Validate MoveToCartRequest
  static validateMoveToCartRequest(request: MoveToCartRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Price validation (@NotNull, @Min(value = 0))
    if (request.price === null || request.price === undefined) {
      errors.push('Price is required');
    } else if (request.price < 0) {
      errors.push('Price cannot be negative');
    }

    return { valid: errors.length === 0, errors };
  }

  // Validate SaveForLaterRequest
  static validateSaveForLaterRequest(request: SaveForLaterRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Product ID validation (@NotNull)
    if (!request.productId) {
      errors.push('Product ID is required');
    }

    return { valid: errors.length === 0, errors };
  }

  // Legacy validation methods (keeping for backward compatibility)
  
  // Validate quantity (simple version)
  static validateQuantity(quantity: number): { valid: boolean; error?: string } {
    if (quantity < 1) {
      return { valid: false, error: 'Quantity must be at least 1' };
    }
    if (quantity > 999) {
      return { valid: false, error: 'Quantity cannot exceed 999' };
    }
    if (!Number.isInteger(quantity)) {
      return { valid: false, error: 'Quantity must be a whole number' };
    }
    return { valid: true };
  }

  // Validate price (simple version)
  static validatePrice(price: number): { valid: boolean; error?: string } {
    if (price < 0) {
      return { valid: false, error: 'Price cannot be negative' };
    }
    if (price > 999999.99) {
      return { valid: false, error: 'Price cannot exceed $999,999.99' };
    }
    return { valid: true };
  }

  // Group cart items by some criteria (example utility)
  static groupCartItemsByPrice(cart: ShoppingCartResponse): { [priceRange: string]: CartItemResponse[] } {
    const groups: { [priceRange: string]: CartItemResponse[] } = {
      'Under $10': [],
      '$10 - $50': [],
      '$50 - $100': [],
      'Over $100': []
    };

    cart.items.forEach(item => {
      if (item.price < 10) {
        groups['Under $10'].push(item);
      } else if (item.price < 50) {
        groups['$10 - $50'].push(item);
      } else if (item.price < 100) {
        groups['$50 - $100'].push(item);
      } else {
        groups['Over $100'].push(item);
      }
    });

    return groups;
  }

  // Get cart summary
  static getCartSummary(cart: ShoppingCartResponse): {
    totalItems: number;
    uniqueProducts: number;
    totalAmount: number;
    averageItemPrice: number;
  } {
    const totalItems = this.getCartItemCount(cart);
    const uniqueProducts = cart.items.length;
    const totalAmount = cart.total;
    const averageItemPrice = totalItems > 0 ? totalAmount / totalItems : 0;

    return {
      totalItems,
      uniqueProducts,
      totalAmount,
      averageItemPrice
    };
  }

  // Check if cart is expired
  static isCartExpired(cart: ShoppingCartResponse): boolean {
    const expiryDate = new Date(cart.expiresAt);
    const now = new Date();
    return expiryDate < now;
  }

  // Get time until expiry
  static getTimeUntilExpiry(cart: ShoppingCartResponse): {
    expired: boolean;
    timeLeft?: {
      days: number;
      hours: number;
      minutes: number;
    };
  } {
    const expiryDate = new Date(cart.expiresAt);
    const now = new Date();
    
    if (expiryDate <= now) {
      return { expired: true };
    }

    const timeDiff = expiryDate.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      expired: false,
      timeLeft: { days, hours, minutes }
    };
  }
}