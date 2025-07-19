import { Loyalty_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT'
}

export enum CouponPackage {
  BASIC_5_PERCENT = 'BASIC_5_PERCENT',
  STANDARD_10_PERCENT = 'STANDARD_10_PERCENT',
  PREMIUM_15_PERCENT = 'PREMIUM_15_PERCENT',
  FIXED_5_DOLLAR = 'FIXED_5_DOLLAR',
  FIXED_10_DOLLAR = 'FIXED_10_DOLLAR',
  FIXED_25_DOLLAR = 'FIXED_25_DOLLAR'
}

// Interfaces
export interface CouponGenerateRequestDto {
  userId: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  expirationDate: string;
  usageLimit: number;
}

export interface CouponPointsPurchaseRequestDto {
  userId: string;
  discountType: DiscountType;
  discountValue: number;
  pointsCost: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  expirationDate: string;
  usageLimit: number;
}

export interface CouponValidationRequestDto {
  couponCode: string;
  purchaseAmount: number;
}

export interface CouponApplyRequestDto {
  couponCode: string;
  purchaseAmount: number;
}

export interface CouponResponseDto {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  expirationDate: string;
  userId: string;
  isUsed: boolean;
  usageLimit: number;
  stackable: boolean;
  priorityLevel: number;
  createdAt: string;
}

export interface CouponValidationResponseDto {
  isValid: boolean;
  couponCode: string;
  message: string;
  expectedDiscount: number;
}

export interface CouponApplyResponseDto {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode: string;
  message: string;
}

export interface CouponPackageResponseDto {
  packageName: string;
  pointsCost: number;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  description: string;
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

// Base URL for coupon endpoints
const COUPONS_BASE_URL = `${Loyalty_Service_URL}/coupons`;

export class CouponService {
  
  // Purchase coupon with points
  static async purchaseCouponWithPoints(couponData: CouponPointsPurchaseRequestDto): Promise<CouponResponseDto> {
    try {
      const response = await fetch(`${COUPONS_BASE_URL}/purchase`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(couponData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid request: ${errorData?.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('User not found in loyalty system');
        }
        throw new Error(`Failed to purchase coupon: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing coupon with points:', error);
      throw error;
    }
  }

  // Purchase coupon package
  static async purchaseCouponPackage(userId: string, packageType: CouponPackage): Promise<CouponResponseDto> {
    try {
      const response = await fetch(`${COUPONS_BASE_URL}/purchase-package?userId=${userId}&packageType=${packageType}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid request: ${errorData?.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('User not found in loyalty system');
        }
        throw new Error(`Failed to purchase coupon package: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing coupon package:', error);
      throw error;
    }
  }

  // Get available coupon packages for user
  static async getAvailableCouponPackages(userId: string): Promise<CouponPackageResponseDto[]> {
    try {
      const response = await fetch(`${COUPONS_BASE_URL}/packages/${userId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found in loyalty system');
        }
        throw new Error(`Failed to fetch available packages: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available coupon packages:', error);
      throw error;
    }
  }

  // Get all coupon packages
  static async getAllCouponPackages(): Promise<CouponPackageResponseDto[]> {
    try {
      const response = await fetch(`${COUPONS_BASE_URL}/packages`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch coupon packages: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching all coupon packages:', error);
      throw error;
    }
  }

  // Generate promotional coupon (admin use)
  static async generatePromotionalCoupon(couponData: CouponGenerateRequestDto): Promise<CouponResponseDto> {
    try {
      const response = await fetch(`${COUPONS_BASE_URL}/promotional`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(couponData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid coupon data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to generate promotional coupon: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating promotional coupon:', error);
      throw error;
    }
  }

  // Validate coupon
  static async validateCoupon(validationData: CouponValidationRequestDto): Promise<CouponValidationResponseDto> {
    try {
      const response = await fetch(`${COUPONS_BASE_URL}/validate`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(validationData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid validation data: ${errorData?.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('Coupon not found');
        }
        throw new Error(`Failed to validate coupon: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  }

  // Apply coupon
  static async applyCoupon(applyData: CouponApplyRequestDto): Promise<CouponApplyResponseDto> {
    try {
      const response = await fetch(`${COUPONS_BASE_URL}/apply`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(applyData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid coupon or request: ${errorData?.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('Coupon not found');
        }
        throw new Error(`Failed to apply coupon: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }

  // Get user's active coupons
  static async getUserCoupons(userId: string): Promise<CouponResponseDto[]> {
    try {
      const response = await fetch(`${COUPONS_BASE_URL}/${userId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user coupons: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user coupons:', error);
      throw error;
    }
  }

  // Utility functions
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  static formatPercentage(percentage: number): string {
    return `${percentage}%`;
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

  static getDiscountTypeDisplayName(type: DiscountType): string {
    switch (type) {
      case DiscountType.PERCENTAGE:
        return 'Percentage';
      case DiscountType.FIXED_AMOUNT:
        return 'Fixed Amount';
      default:
        return type;
    }
  }

  static getCouponStatusColor(coupon: CouponResponseDto): string {
    const now = new Date();
    const expirationDate = new Date(coupon.expirationDate);
    
    if (coupon.isUsed) {
      return 'gray'; // Used
    }
    
    if (expirationDate < now) {
      return 'red'; // Expired
    }
    
    const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) {
      return 'orange'; // Expiring soon
    }
    
    return 'green'; // Active
  }

  static getCouponStatusText(coupon: CouponResponseDto): string {
    const now = new Date();
    const expirationDate = new Date(coupon.expirationDate);
    
    if (coupon.isUsed) {
      return 'Used';
    }
    
    if (expirationDate < now) {
      return 'Expired';
    }
    
    const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 1) {
      return 'Expires today';
    }
    
    if (daysUntilExpiry <= 7) {
      return `Expires in ${daysUntilExpiry} days`;
    }
    
    return 'Active';
  }

  static formatCouponValue(coupon: CouponResponseDto): string {
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      return this.formatPercentage(coupon.discountValue);
    } else {
      return this.formatCurrency(coupon.discountValue);
    }
  }

  static generateCouponDescription(coupon: CouponResponseDto): string {
    let description = '';
    
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      description = `${coupon.discountValue}% off`;
    } else {
      description = `${this.formatCurrency(coupon.discountValue)} off`;
    }
    
    if (coupon.minPurchaseAmount > 0) {
      description += ` on orders over ${this.formatCurrency(coupon.minPurchaseAmount)}`;
    }
    
    if (coupon.maxDiscountAmount && coupon.discountType === DiscountType.PERCENTAGE) {
      description += ` (max ${this.formatCurrency(coupon.maxDiscountAmount)})`;
    }
    
    return description;
  }

  static calculatePotentialDiscount(coupon: CouponResponseDto, purchaseAmount: number): number {
    if (purchaseAmount < coupon.minPurchaseAmount) {
      return 0;
    }
    
    let discount = 0;
    
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = purchaseAmount * (coupon.discountValue / 100);
      
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }
    
    return Math.min(discount, purchaseAmount);
  }

  static getPackageDisplayName(packageType: CouponPackage): string {
    switch (packageType) {
      case CouponPackage.BASIC_5_PERCENT:
        return 'Basic 5% Off';
      case CouponPackage.STANDARD_10_PERCENT:
        return 'Standard 10% Off';
      case CouponPackage.PREMIUM_15_PERCENT:
        return 'Premium 15% Off';
      case CouponPackage.FIXED_5_DOLLAR:
        return '$5 Off';
      case CouponPackage.FIXED_10_DOLLAR:
        return '$10 Off';
      case CouponPackage.FIXED_25_DOLLAR:
        return '$25 Off';
      default:
        return packageType;
    }
  }

  // Search and filter utilities
  static searchCoupons(
    coupons: CouponResponseDto[], 
    searchTerm: string
  ): CouponResponseDto[] {
    if (!searchTerm.trim()) return coupons;
    
    const term = searchTerm.toLowerCase();
    return coupons.filter(coupon => 
      coupon.code.toLowerCase().includes(term) ||
      this.generateCouponDescription(coupon).toLowerCase().includes(term) ||
      coupon.discountValue.toString().includes(term)
    );
  }

  static filterCouponsByStatus(
    coupons: CouponResponseDto[], 
    status: 'all' | 'active' | 'used' | 'expired'
  ): CouponResponseDto[] {
    if (status === 'all') return coupons;
    
    const now = new Date();
    
    return coupons.filter(coupon => {
      const expirationDate = new Date(coupon.expirationDate);
      
      switch (status) {
        case 'active':
          return !coupon.isUsed && expirationDate >= now;
        case 'used':
          return coupon.isUsed;
        case 'expired':
          return !coupon.isUsed && expirationDate < now;
        default:
          return true;
      }
    });
  }

  static filterCouponsByDiscountType(
    coupons: CouponResponseDto[], 
    discountType: DiscountType | 'all'
  ): CouponResponseDto[] {
    if (discountType === 'all') return coupons;
    return coupons.filter(coupon => coupon.discountType === discountType);
  }

  static sortCoupons(
    coupons: CouponResponseDto[], 
    sortBy: 'code' | 'discountValue' | 'expirationDate' | 'createdAt' | 'minPurchaseAmount',
    order: 'asc' | 'desc' = 'desc'
  ): CouponResponseDto[] {
    return [...coupons].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'code':
          aValue = a.code.toLowerCase();
          bValue = b.code.toLowerCase();
          break;
        case 'discountValue':
          aValue = a.discountValue;
          bValue = b.discountValue;
          break;
        case 'expirationDate':
          aValue = new Date(a.expirationDate).getTime();
          bValue = new Date(b.expirationDate).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'minPurchaseAmount':
          aValue = a.minPurchaseAmount;
          bValue = b.minPurchaseAmount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Group coupons by status
  static groupCouponsByStatus(coupons: CouponResponseDto[]): Record<string, CouponResponseDto[]> {
    const now = new Date();
    
    return coupons.reduce((groups, coupon) => {
      const expirationDate = new Date(coupon.expirationDate);
      let status: string;
      
      if (coupon.isUsed) {
        status = 'used';
      } else if (expirationDate < now) {
        status = 'expired';
      } else {
        status = 'active';
      }
      
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(coupon);
      
      return groups;
    }, {} as Record<string, CouponResponseDto[]>);
  }

  // Calculate coupon statistics
  static calculateCouponStats(coupons: CouponResponseDto[]): {
    total: number;
    active: number;
    used: number;
    expired: number;
    totalSavings: number;
    averageDiscount: number;
  } {
    const now = new Date();
    let active = 0;
    let used = 0;
    let expired = 0;
    
    coupons.forEach(coupon => {
      const expirationDate = new Date(coupon.expirationDate);
      
      if (coupon.isUsed) {
        used++;
      } else if (expirationDate < now) {
        expired++;
      } else {
        active++;
      }
    });
    
    // Calculate total potential savings (assuming average purchase of $100)
    const averagePurchase = 100;
    const totalSavings = coupons
      .filter(c => !c.isUsed && new Date(c.expirationDate) >= now)
      .reduce((sum, coupon) => {
        return sum + this.calculatePotentialDiscount(coupon, averagePurchase);
      }, 0);
    
    const averageDiscount = coupons.length > 0 
      ? coupons.reduce((sum, c) => sum + c.discountValue, 0) / coupons.length 
      : 0;
    
    return {
      total: coupons.length,
      active,
      used,
      expired,
      totalSavings,
      averageDiscount
    };
  }
}