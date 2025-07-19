import { Loyalty_Service_URL } from "../lib/apiEndPoints";
import { MembershipTier } from "./Crm.service";

// Enums
export enum BenefitType {
  DISCOUNT = 'DISCOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  EXCLUSIVE_ACCESS = 'EXCLUSIVE_ACCESS',
  BIRTHDAY_BONUS = 'BIRTHDAY_BONUS',
  POINT_MULTIPLIER = 'POINT_MULTIPLIER'
}

// Interfaces
export interface TierBenefitCreateRequestDto {
  tier: MembershipTier;
  benefitType: BenefitType;
  benefitConfig?: string;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
}

export interface TierBenefitUpdateRequestDto {
  benefitConfig?: string;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  active?: boolean;
}

export interface TierBenefitResponseDto {
  id: string;
  tier: MembershipTier;
  benefitType: BenefitType;
  benefitConfig?: string;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TierBenefitSummaryDto {
  id: string;
  tier: MembershipTier;
  benefitType: BenefitType;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  active: boolean;
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

// Base URL for tier benefits endpoints
const TIER_BENEFITS_BASE_URL = `${Loyalty_Service_URL}/tier-benefits`;

export class TierBenefitsService {
  
  // Get all tier benefits
  static async getAllTierBenefits(): Promise<TierBenefitResponseDto[]> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tier benefits: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tier benefits:', error);
      throw error;
    }
  }

  // Get active tier benefits
  static async getActiveTierBenefits(): Promise<TierBenefitResponseDto[]> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/active`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active tier benefits: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active tier benefits:', error);
      throw error;
    }
  }

  // Get tier benefits summary
  static async getTierBenefitsSummary(): Promise<TierBenefitSummaryDto[]> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/summary`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tier benefits summary: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tier benefits summary:', error);
      throw error;
    }
  }

  // Get tier benefit by ID
  static async getTierBenefitById(id: string): Promise<TierBenefitResponseDto> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/${id}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tier benefit not found');
        }
        throw new Error(`Failed to fetch tier benefit: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tier benefit by ID:', error);
      throw error;
    }
  }

  // Get tier benefits by membership tier
  static async getTierBenefitsByTier(tier: MembershipTier): Promise<TierBenefitResponseDto[]> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/tier/${tier}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tier benefits by tier: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tier benefits by tier:', error);
      throw error;
    }
  }

  // Get tier benefits by benefit type
  static async getTierBenefitsByType(benefitType: BenefitType): Promise<TierBenefitResponseDto[]> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/type/${benefitType}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tier benefits by type: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tier benefits by type:', error);
      throw error;
    }
  }

  // Get specific tier benefit by tier and benefit type
  static async getSpecificTierBenefit(tier: MembershipTier, benefitType: BenefitType): Promise<TierBenefitResponseDto | null> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/tier/${tier}/type/${benefitType}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (response.status === 404) {
        return null; // Tier benefit not found
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch specific tier benefit: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching specific tier benefit:', error);
      throw error;
    }
  }

  // Create a new tier benefit
  static async createTierBenefit(benefitData: TierBenefitCreateRequestDto): Promise<TierBenefitResponseDto> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(benefitData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid benefit data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to create tier benefit: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating tier benefit:', error);
      throw error;
    }
  }

  // Update an existing tier benefit
  static async updateTierBenefit(id: string, benefitData: TierBenefitUpdateRequestDto): Promise<TierBenefitResponseDto> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(benefitData)
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tier benefit not found');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid benefit data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to update tier benefit: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating tier benefit:', error);
      throw error;
    }
  }

  // Activate a tier benefit
  static async activateTierBenefit(id: string): Promise<TierBenefitResponseDto> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/${id}/activate`, {
        method: 'PATCH',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tier benefit not found');
        }
        throw new Error(`Failed to activate tier benefit: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error activating tier benefit:', error);
      throw error;
    }
  }

  // Deactivate a tier benefit
  static async deactivateTierBenefit(id: string): Promise<TierBenefitResponseDto> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/${id}/deactivate`, {
        method: 'PATCH',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tier benefit not found');
        }
        throw new Error(`Failed to deactivate tier benefit: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deactivating tier benefit:', error);
      throw error;
    }
  }

  // Delete a tier benefit
  static async deleteTierBenefit(id: string): Promise<void> {
    try {
      const response = await fetch(`${TIER_BENEFITS_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tier benefit not found');
        }
        throw new Error(`Failed to delete tier benefit: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting tier benefit:', error);
      throw error;
    }
  }

  // Utility functions
  static getBenefitTypeDisplayName(type: BenefitType): string {
    switch (type) {
      case BenefitType.DISCOUNT:
        return 'Discount';
      case BenefitType.FREE_SHIPPING:
        return 'Free Shipping';
      case BenefitType.PRIORITY_SUPPORT:
        return 'Priority Support';
      case BenefitType.EXCLUSIVE_ACCESS:
        return 'Exclusive Access';
      case BenefitType.BIRTHDAY_BONUS:
        return 'Birthday Bonus';
      case BenefitType.POINT_MULTIPLIER:
        return 'Point Multiplier';
      default:
        return type;
    }
  }

  static getBenefitTypeIcon(type: BenefitType): string {
    switch (type) {
      case BenefitType.DISCOUNT:
        return '💰';
      case BenefitType.FREE_SHIPPING:
        return '🚚';
      case BenefitType.PRIORITY_SUPPORT:
        return '🎧';
      case BenefitType.EXCLUSIVE_ACCESS:
        return '🔐';
      case BenefitType.BIRTHDAY_BONUS:
        return '🎂';
      case BenefitType.POINT_MULTIPLIER:
        return '✨';
      default:
        return '🎁';
    }
  }

  static getBenefitTypeColor(type: BenefitType): string {
    switch (type) {
      case BenefitType.DISCOUNT:
        return 'green';
      case BenefitType.FREE_SHIPPING:
        return 'blue';
      case BenefitType.PRIORITY_SUPPORT:
        return 'purple';
      case BenefitType.EXCLUSIVE_ACCESS:
        return 'gold';
      case BenefitType.BIRTHDAY_BONUS:
        return 'pink';
      case BenefitType.POINT_MULTIPLIER:
        return 'orange';
      default:
        return 'gray';
    }
  }

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

  // Generate human-readable benefit description
  static generateBenefitDescription(benefit: TierBenefitResponseDto): string {
    const type = benefit.benefitType;

    switch (type) {
      case BenefitType.DISCOUNT:
        let discountDesc = '';
        if (benefit.discountPercentage) {
          discountDesc += `${benefit.discountPercentage}% discount`;
        }
        if (benefit.minOrderAmount && benefit.minOrderAmount > 0) {
          discountDesc += ` on orders over ${this.formatCurrency(benefit.minOrderAmount)}`;
        }
        if (benefit.maxDiscountAmount) {
          discountDesc += ` (max ${this.formatCurrency(benefit.maxDiscountAmount)})`;
        }
        return discountDesc;

      case BenefitType.FREE_SHIPPING:
        if (benefit.minOrderAmount && benefit.minOrderAmount > 0) {
          return `Free shipping on orders over ${this.formatCurrency(benefit.minOrderAmount)}`;
        } else {
          return 'Free shipping on all orders';
        }

      case BenefitType.PRIORITY_SUPPORT:
        return 'Priority customer support access';

      case BenefitType.EXCLUSIVE_ACCESS:
        return 'Exclusive access to sales and new products';

      case BenefitType.BIRTHDAY_BONUS:
        return 'Birthday bonus points';

      case BenefitType.POINT_MULTIPLIER:
        if (benefit.discountPercentage) {
          return `${benefit.discountPercentage}x points multiplier`;
        } else {
          return 'Points multiplier';
        }

      default:
        return 'Special benefit';
    }
  }

  // Group benefits by tier
  static groupBenefitsByTier(benefits: TierBenefitResponseDto[]): Record<MembershipTier, TierBenefitResponseDto[]> {
    return benefits.reduce((groups, benefit) => {
      if (!groups[benefit.tier]) {
        groups[benefit.tier] = [];
      }
      groups[benefit.tier].push(benefit);
      return groups;
    }, {} as Record<MembershipTier, TierBenefitResponseDto[]>);
  }

  // Group benefits by type
  static groupBenefitsByType(benefits: TierBenefitResponseDto[]): Record<BenefitType, TierBenefitResponseDto[]> {
    return benefits.reduce((groups, benefit) => {
      if (!groups[benefit.benefitType]) {
        groups[benefit.benefitType] = [];
      }
      groups[benefit.benefitType].push(benefit);
      return groups;
    }, {} as Record<BenefitType, TierBenefitResponseDto[]>);
  }

  // Search and filter utilities
  static searchBenefits(
    benefits: TierBenefitResponseDto[], 
    searchTerm: string
  ): TierBenefitResponseDto[] {
    if (!searchTerm.trim()) return benefits;
    
    const term = searchTerm.toLowerCase();
    return benefits.filter(benefit => 
      benefit.tier.toLowerCase().includes(term) ||
      benefit.benefitType.toLowerCase().includes(term) ||
      this.generateBenefitDescription(benefit).toLowerCase().includes(term)
    );
  }

  static filterBenefitsByTier(
    benefits: TierBenefitResponseDto[], 
    tier: MembershipTier | 'all'
  ): TierBenefitResponseDto[] {
    if (tier === 'all') return benefits;
    return benefits.filter(benefit => benefit.tier === tier);
  }

  static filterBenefitsByType(
    benefits: TierBenefitResponseDto[], 
    type: BenefitType | 'all'
  ): TierBenefitResponseDto[] {
    if (type === 'all') return benefits;
    return benefits.filter(benefit => benefit.benefitType === type);
  }

  static filterBenefitsByStatus(
    benefits: TierBenefitResponseDto[], 
    active: boolean | 'all'
  ): TierBenefitResponseDto[] {
    if (active === 'all') return benefits;
    return benefits.filter(benefit => benefit.active === active);
  }

  static sortBenefits(
    benefits: TierBenefitResponseDto[], 
    sortBy: 'tier' | 'benefitType' | 'createdAt' | 'updatedAt' | 'discountPercentage',
    order: 'asc' | 'desc' = 'asc'
  ): TierBenefitResponseDto[] {
    return [...benefits].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'tier':
          const tierOrder = {
            [MembershipTier.BRONZE]: 1,
            [MembershipTier.SILVER]: 2,
            [MembershipTier.GOLD]: 3,
            [MembershipTier.PLATINUM]: 4,
            [MembershipTier.DIAMOND]: 5
          };
          aValue = tierOrder[a.tier];
          bValue = tierOrder[b.tier];
          break;
        case 'benefitType':
          aValue = a.benefitType;
          bValue = b.benefitType;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'discountPercentage':
          aValue = a.discountPercentage || 0;
          bValue = b.discountPercentage || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Validation utilities
  static validateBenefitConfiguration(
    benefitType: BenefitType, 
    discountPercentage?: number, 
    maxDiscountAmount?: number, 
    minOrderAmount?: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (benefitType === BenefitType.DISCOUNT) {
      if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
        errors.push('Discount percentage must be between 0.01 and 100');
      }
    }

    if (benefitType === BenefitType.POINT_MULTIPLIER) {
      if (!discountPercentage || discountPercentage <= 1) {
        errors.push('Point multiplier must be greater than 1');
      }
    }

    if (maxDiscountAmount && maxDiscountAmount <= 0) {
      errors.push('Maximum discount amount must be greater than 0');
    }

    if (minOrderAmount && minOrderAmount < 0) {
      errors.push('Minimum order amount cannot be negative');
    }

    return { valid: errors.length === 0, errors };
  }
}