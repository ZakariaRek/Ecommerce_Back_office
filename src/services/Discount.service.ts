import { Product_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_ONE_GET_ONE = 'BUY_ONE_GET_ONE'
}

// Interfaces
export interface DiscountRequestDTO {
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
}

export interface DiscountResponseDTO {
  id: string;
  productId: string;
  productName: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  active: boolean;
}

export interface DiscountSummaryDTO {
  id: string;
  productId: string;
  discountType: DiscountType;
  discountValue: number;
  endDate: string;
  active: boolean;
}

export interface PricingResponseDTO {
  productId: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  appliedDiscounts: DiscountSummaryDTO[];
  savings: number;
  discountPercentage: number;
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

// Base URL for discount endpoints
const DISCOUNT_BASE_URL = `${Product_Service_URL}/discounts`;

export class DiscountService {
  
  // Get all discounts
  static async getAllDiscounts(): Promise<DiscountSummaryDTO[]> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch discounts: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching discounts:', error);
      throw error;
    }
  }

  // Get discount by ID
  static async getDiscountById(id: string): Promise<DiscountResponseDTO> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/${id}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Discount not found');
        }
        throw new Error(`Failed to fetch discount: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching discount by ID:', error);
      throw error;
    }
  }

  // Get discounts by product ID
  static async getDiscountsByProductId(productId: string): Promise<DiscountSummaryDTO[]> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/product/${productId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product discounts: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product discounts:', error);
      throw error;
    }
  }

  // Get discounts by type
  static async getDiscountsByType(discountType: DiscountType): Promise<DiscountSummaryDTO[]> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/type/${discountType}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch discounts by type: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching discounts by type:', error);
      throw error;
    }
  }

  // Get active discounts
  static async getActiveDiscounts(): Promise<DiscountSummaryDTO[]> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/active`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active discounts: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active discounts:', error);
      throw error;
    }
  }

  // Create discount for product
  static async createDiscount(productId: string, discountData: DiscountRequestDTO): Promise<DiscountResponseDTO> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/product/${productId}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(discountData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          if (errorData.errors && errorData.errors.length > 0) {
            const fieldErrors = errorData.errors.map((error: any) => 
              `${error.field}: ${error.defaultMessage || 'Invalid value'}`
            ).join(', ');
            throw new Error(`Validation failed: ${fieldErrors}`);
          }
          throw new Error(`Invalid discount data: ${errorData.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to create discount: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating discount:', error);
      throw error;
    }
  }

  // Update discount
  static async updateDiscount(id: string, discountData: DiscountRequestDTO): Promise<DiscountResponseDTO> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(discountData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          if (errorData.errors && errorData.errors.length > 0) {
            const fieldErrors = errorData.errors.map((error: any) => 
              `${error.field}: ${error.defaultMessage || 'Invalid value'}`
            ).join(', ');
            throw new Error(`Validation failed: ${fieldErrors}`);
          }
          throw new Error(`Invalid discount data: ${errorData.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('Discount not found');
        }
        throw new Error(`Failed to update discount: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating discount:', error);
      throw error;
    }
  }

  // Delete discount
  static async deleteDiscount(id: string): Promise<void> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Discount not found');
        }
        throw new Error(`Failed to delete discount: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      throw error;
    }
  }

  // Calculate pricing with discounts
  static async calculatePricing(productId: string): Promise<PricingResponseDTO> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/product/${productId}/pricing`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to calculate pricing: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating pricing:', error);
      throw error;
    }
  }

  // Create bulk discounts
  static async createBulkDiscounts(productId: string, discountsData: DiscountRequestDTO[]): Promise<DiscountResponseDTO[]> {
    try {
      const response = await fetch(`${DISCOUNT_BASE_URL}/product/${productId}/bulk`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(discountsData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          if (errorData.errors && errorData.errors.length > 0) {
            const fieldErrors = errorData.errors.map((error: any) => 
              `${error.field}: ${error.defaultMessage || 'Invalid value'}`
            ).join(', ');
            throw new Error(`Validation failed: ${fieldErrors}`);
          }
          throw new Error(`Invalid bulk discount data: ${errorData.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to create bulk discounts: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating bulk discounts:', error);
      throw error;
    }
  }

  // Utility functions
  static formatDiscountValue(type: DiscountType, value: number): string {
    switch (type) {
      case DiscountType.PERCENTAGE:
        return `${value}%`;
      case DiscountType.FIXED_AMOUNT:
        return `$${value.toFixed(2)}`;
      case DiscountType.BUY_ONE_GET_ONE:
        return 'BOGO';
      default:
        return value.toString();
    }
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  static isDiscountActive(discount: DiscountSummaryDTO | DiscountResponseDTO): boolean {
    const now = new Date();
    const endDate = new Date(discount.endDate);
    return discount.active && endDate > now;
  }

  static calculateSavings(originalPrice: number, finalPrice: number): number {
    return originalPrice - finalPrice;
  }

  static calculateDiscountPercentage(originalPrice: number, discountAmount: number): number {
    return originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
  }
}