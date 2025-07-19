import { Loyalty_Service_URL } from "../lib/apiEndPoints";

// Interfaces
export interface RewardRedeemRequestDto {
  userId: string;
  rewardId: string;
}

export interface RewardResponseDto {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  isActive: boolean;
  expiryDays: number;
  canAfford?: boolean;
  userCurrentPoints?: number;
}

export interface RewardRedeemResponseDto {
  transactionId: string;
  userId: string;
  reward: RewardResponseDto;
  pointsDeducted: number;
  remainingPoints: number;
  redeemedAt: string;
  message: string;
  instructions: string;
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

// Base URL for reward endpoints
const REWARDS_BASE_URL = `${Loyalty_Service_URL}/rewards`;

export class LoyaltyRewardService {
  
  // Get all active rewards
  static async getActiveRewards(userId?: string): Promise<RewardResponseDto[]> {
    try {
      const url = userId 
        ? `${REWARDS_BASE_URL}?userId=${userId}` 
        : REWARDS_BASE_URL;

      const response = await fetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active rewards: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active rewards:', error);
      throw error;
    }
  }

  // Get affordable rewards for a specific user
  static async getAffordableRewards(userId: string): Promise<RewardResponseDto[]> {
    try {
      const rewards = await this.getActiveRewards(userId);
      return rewards.filter(reward => reward.canAfford === true);
    } catch (error) {
      console.error('Error fetching affordable rewards:', error);
      throw error;
    }
  }

  // Redeem a reward
  static async redeemReward(rewardId: string, redeemData: RewardRedeemRequestDto): Promise<RewardRedeemResponseDto> {
    try {
      const response = await fetch(`${REWARDS_BASE_URL}/${rewardId}/redeem`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(redeemData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid request: ${errorData?.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('Reward or user not found');
        }
        throw new Error(`Failed to redeem reward: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  // Check if user can afford a specific reward
  static async canUserAffordReward(userId: string, rewardId: string): Promise<boolean> {
    try {
      const rewards = await this.getActiveRewards(userId);
      const reward = rewards.find(r => r.id === rewardId);
      return reward ? (reward.canAfford === true) : false;
    } catch (error) {
      console.error('Error checking if user can afford reward:', error);
      return false;
    }
  }

  // Get reward categories based on point cost
  static getRewardCategories(): { name: string; minPoints: number; maxPoints: number; color: string }[] {
    return [
      { name: 'Low Cost', minPoints: 0, maxPoints: 500, color: 'green' },
      { name: 'Medium', minPoints: 501, maxPoints: 1500, color: 'blue' },
      { name: 'High Value', minPoints: 1501, maxPoints: 5000, color: 'purple' },
      { name: 'Premium', minPoints: 5001, maxPoints: Infinity, color: 'gold' }
    ];
  }

  // Get reward category for a specific reward
  static getRewardCategory(pointsCost: number): { name: string; color: string } {
    const categories = this.getRewardCategories();
    const category = categories.find(cat => 
      pointsCost >= cat.minPoints && pointsCost <= cat.maxPoints
    );
    return category || { name: 'Unknown', color: 'gray' };
  }

  // Utility functions
  static formatPoints(points: number): string {
    return new Intl.NumberFormat('en-US').format(points);
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

  static getRewardIcon(rewardName: string): string {
    const name = rewardName.toLowerCase();
    
    if (name.includes('gift card')) return '🎁';
    if (name.includes('shipping')) return '🚚';
    if (name.includes('coupon') || name.includes('discount')) return '🎟️';
    if (name.includes('birthday')) return '🎂';
    if (name.includes('vip') || name.includes('premium')) return '👑';
    if (name.includes('express')) return '⚡';
    if (name.includes('bonus')) return '⭐';
    if (name.includes('access')) return '🔐';
    if (name.includes('shopping')) return '🛍️';
    if (name.includes('wrapping')) return '🎀';
    if (name.includes('sale') || name.includes('preview')) return '👀';
    
    return '🎁'; // Default icon
  }

  static getAffordabilityStatus(canAfford: boolean | undefined, userPoints?: number, pointsCost?: number): {
    status: string;
    color: string;
    message: string;
  } {
    if (canAfford === undefined) {
      return {
        status: 'unknown',
        color: 'gray',
        message: 'Affordability unknown'
      };
    }
    
    if (canAfford) {
      return {
        status: 'affordable',
        color: 'green',
        message: 'You can redeem this reward'
      };
    }
    
    if (userPoints !== undefined && pointsCost !== undefined) {
      const pointsNeeded = pointsCost - userPoints;
      return {
        status: 'unaffordable',
        color: 'red',
        message: `You need ${this.formatPoints(pointsNeeded)} more points`
      };
    }
    
    return {
      status: 'unaffordable',
      color: 'red',
      message: 'Insufficient points'
    };
  }

  static getExpiryUrgency(expiryDays: number): {
    urgency: string;
    color: string;
    message: string;
  } {
    if (expiryDays <= 7) {
      return {
        urgency: 'high',
        color: 'red',
        message: `Expires in ${expiryDays} days`
      };
    }
    
    if (expiryDays <= 30) {
      return {
        urgency: 'medium',
        color: 'orange',
        message: `Expires in ${expiryDays} days`
      };
    }
    
    if (expiryDays <= 90) {
      return {
        urgency: 'low',
        color: 'blue',
        message: `Expires in ${expiryDays} days`
      };
    }
    
    return {
      urgency: 'none',
      color: 'green',
      message: `Expires in ${expiryDays} days`
    };
  }

  // Search and filter utilities
  static searchRewards(
    rewards: RewardResponseDto[], 
    searchTerm: string
  ): RewardResponseDto[] {
    if (!searchTerm.trim()) return rewards;
    
    const term = searchTerm.toLowerCase();
    return rewards.filter(reward => 
      reward.name.toLowerCase().includes(term) ||
      reward.description.toLowerCase().includes(term) ||
      reward.pointsCost.toString().includes(term)
    );
  }

  static filterRewardsByAffordability(
    rewards: RewardResponseDto[], 
    affordability: 'all' | 'affordable' | 'unaffordable'
  ): RewardResponseDto[] {
    if (affordability === 'all') return rewards;
    
    return rewards.filter(reward => {
      if (affordability === 'affordable') {
        return reward.canAfford === true;
      } else {
        return reward.canAfford === false;
      }
    });
  }

  static filterRewardsByPointRange(
    rewards: RewardResponseDto[], 
    minPoints?: number, 
    maxPoints?: number
  ): RewardResponseDto[] {
    return rewards.filter(reward => {
      if (minPoints !== undefined && reward.pointsCost < minPoints) {
        return false;
      }
      if (maxPoints !== undefined && reward.pointsCost > maxPoints) {
        return false;
      }
      return true;
    });
  }

  static filterRewardsByCategory(
    rewards: RewardResponseDto[], 
    category: string
  ): RewardResponseDto[] {
    if (category === 'all') return rewards;
    
    const categories = this.getRewardCategories();
    const selectedCategory = categories.find(cat => cat.name === category);
    
    if (!selectedCategory) return rewards;
    
    return this.filterRewardsByPointRange(
      rewards, 
      selectedCategory.minPoints, 
      selectedCategory.maxPoints === Infinity ? undefined : selectedCategory.maxPoints
    );
  }

  static sortRewards(
    rewards: RewardResponseDto[], 
    sortBy: 'name' | 'pointsCost' | 'expiryDays' | 'affordability',
    order: 'asc' | 'desc' = 'asc'
  ): RewardResponseDto[] {
    return [...rewards].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'pointsCost':
          aValue = a.pointsCost;
          bValue = b.pointsCost;
          break;
        case 'expiryDays':
          aValue = a.expiryDays;
          bValue = b.expiryDays;
          break;
        case 'affordability':
          // Sort affordable rewards first
          aValue = a.canAfford === true ? 1 : 0;
          bValue = b.canAfford === true ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Group rewards by category
  static groupRewardsByCategory(rewards: RewardResponseDto[]): Record<string, RewardResponseDto[]> {
    const categories = this.getRewardCategories();
    const grouped: Record<string, RewardResponseDto[]> = {};
    
    // Initialize groups
    categories.forEach(category => {
      grouped[category.name] = [];
    });
    
    // Group rewards
    rewards.forEach(reward => {
      const category = this.getRewardCategory(reward.pointsCost);
      if (grouped[category.name]) {
        grouped[category.name].push(reward);
      }
    });
    
    return grouped;
  }

  // Calculate redemption statistics
  static calculateRedemptionStats(rewards: RewardResponseDto[], userPoints?: number): {
    totalRewards: number;
    affordableRewards: number;
    averagePointsCost: number;
    cheapestReward: RewardResponseDto | null;
    mostExpensiveReward: RewardResponseDto | null;
    pointsNeededForNext: number;
  } {
    const affordableRewards = rewards.filter(r => r.canAfford === true).length;
    const averagePointsCost = rewards.length > 0 
      ? rewards.reduce((sum, r) => sum + r.pointsCost, 0) / rewards.length 
      : 0;
    
    const sortedByPoints = rewards.sort((a, b) => a.pointsCost - b.pointsCost);
    const cheapestReward = sortedByPoints[0] || null;
    const mostExpensiveReward = sortedByPoints[sortedByPoints.length - 1] || null;
    
    // Find the cheapest reward the user cannot afford
    let pointsNeededForNext = 0;
    if (userPoints !== undefined) {
      const unaffordable = rewards
        .filter(r => r.pointsCost > userPoints)
        .sort((a, b) => a.pointsCost - b.pointsCost);
      
      if (unaffordable.length > 0) {
        pointsNeededForNext = unaffordable[0].pointsCost - userPoints;
      }
    }
    
    return {
      totalRewards: rewards.length,
      affordableRewards,
      averagePointsCost,
      cheapestReward,
      mostExpensiveReward,
      pointsNeededForNext
    };
  }

  // Generate reward recommendations
  static getRewardRecommendations(
    rewards: RewardResponseDto[], 
    userPoints?: number, 
    userPreferences?: string[]
  ): RewardResponseDto[] {
    // Filter for affordable rewards
    let recommendations = rewards.filter(r => r.canAfford === true);
    
    // If user has preferences, prioritize those
    if (userPreferences && userPreferences.length > 0) {
      const preferredRewards = recommendations.filter(reward => 
        userPreferences.some(pref => 
          reward.name.toLowerCase().includes(pref.toLowerCase()) ||
          reward.description.toLowerCase().includes(pref.toLowerCase())
        )
      );
      
      if (preferredRewards.length > 0) {
        recommendations = preferredRewards;
      }
    }
    
    // Sort by best value (considering points cost and expiry)
    recommendations.sort((a, b) => {
      // Prefer rewards with shorter expiry (more urgent)
      const urgencyA = a.expiryDays;
      const urgencyB = b.expiryDays;
      
      if (urgencyA !== urgencyB) {
        return urgencyA - urgencyB; // Shorter expiry first
      }
      
      // Then by points cost (cheaper first)
      return a.pointsCost - b.pointsCost;
    });
    
    // Return top 5 recommendations
    return recommendations.slice(0, 5);
  }
}