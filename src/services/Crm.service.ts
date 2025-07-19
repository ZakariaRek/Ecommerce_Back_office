import { Loyalty_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum MembershipTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND'
}

// Interfaces
export interface CrmResponseDto {
  id: string;
  userId: string;
  totalPoints: number;
  membershipLevel: MembershipTier;
  joinDate: string;
  lastActivity: string;
  loyaltyScore?: number;
}

export interface LoyaltyScoreResponseDto {
  userId: string;
  loyaltyScore: number;
  explanation: string;
}

export interface TierProgressInfo {
  currentTier: MembershipTier;
  currentPoints: number;
  pointsInCurrentTier: number;
  pointsNeededForNextTier: number;
  nextTier: MembershipTier;
  progressPercentage: number;
  tierStartPoints: number;
  nextTierPoints: number;
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

// Base URL for CRM endpoints
const CRM_BASE_URL = `${Loyalty_Service_URL}/crm`;

export class CRMService {
  
  // Get all CRM users
  static async getAllUsers(): Promise<CrmResponseDto[]> {
    try {
      const response = await fetch(`${CRM_BASE_URL}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CRM users: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching CRM users:', error);
      throw error;
    }
  }

  // Get CRM user by ID
  static async getCRMByUserId(userId: string): Promise<CrmResponseDto> {
    try {
      const response = await fetch(`${CRM_BASE_URL}/${userId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found in CRM system');
        }
        throw new Error(`Failed to fetch CRM data: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching CRM data by user ID:', error);
      throw error;
    }
  }

  // Get user loyalty score
  static async getLoyaltyScore(userId: string): Promise<LoyaltyScoreResponseDto> {
    try {
      const response = await fetch(`${CRM_BASE_URL}/${userId}/loyalty-score`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found in CRM system');
        }
        throw new Error(`Failed to fetch loyalty score: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching loyalty score:', error);
      throw error;
    }
  }

  // Check if user exists in CRM
  static async userExistsInCRM(userId: string): Promise<boolean> {
    try {
      await this.getCRMByUserId(userId);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found in CRM system') {
        return false;
      }
      throw error; // Re-throw other errors
    }
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

  static getTierDisplayName(tier: MembershipTier): string {
    switch (tier) {
      case MembershipTier.BRONZE:
        return 'Bronze';
      case MembershipTier.SILVER:
        return 'Silver';
      case MembershipTier.GOLD:
        return 'Gold';
      case MembershipTier.PLATINUM:
        return 'Platinum';
      case MembershipTier.DIAMOND:
        return 'Diamond';
      default:
        return tier;
    }
  }

  static getTierColor(tier: MembershipTier): string {
    switch (tier) {
      case MembershipTier.BRONZE:
        return '#CD7F32';
      case MembershipTier.SILVER:
        return '#C0C0C0';
      case MembershipTier.GOLD:
        return '#FFD700';
      case MembershipTier.PLATINUM:
        return '#E5E4E2';
      case MembershipTier.DIAMOND:
        return '#B9F2FF';
      default:
        return '#666666';
    }
  }

  static getTierIcon(tier: MembershipTier): string {
    switch (tier) {
      case MembershipTier.BRONZE:
        return '🥉';
      case MembershipTier.SILVER:
        return '🥈';
      case MembershipTier.GOLD:
        return '🥇';
      case MembershipTier.PLATINUM:
        return '💎';
      case MembershipTier.DIAMOND:
        return '💍';
      default:
        return '⭐';
    }
  }

  static getNextTier(currentTier: MembershipTier): MembershipTier | null {
    switch (currentTier) {
      case MembershipTier.BRONZE:
        return MembershipTier.SILVER;
      case MembershipTier.SILVER:
        return MembershipTier.GOLD;
      case MembershipTier.GOLD:
        return MembershipTier.PLATINUM;
      case MembershipTier.PLATINUM:
        return MembershipTier.DIAMOND;
      case MembershipTier.DIAMOND:
        return null; // Already at highest tier
      default:
        return null;
    }
  }

  static getTierThresholds(): Record<MembershipTier, number> {
    return {
      [MembershipTier.BRONZE]: 0,
      [MembershipTier.SILVER]: 500,
      [MembershipTier.GOLD]: 2000,
      [MembershipTier.PLATINUM]: 5000,
      [MembershipTier.DIAMOND]: 10000
    };
  }

  static calculateTierProgress(currentPoints: number, currentTier: MembershipTier): TierProgressInfo {
    const thresholds = this.getTierThresholds();
    const nextTier = this.getNextTier(currentTier);
    
    const tierStartPoints = thresholds[currentTier];
    const nextTierPoints = nextTier ? thresholds[nextTier] : thresholds[MembershipTier.DIAMOND];
    
    const pointsInCurrentTier = currentPoints - tierStartPoints;
    const pointsNeededForNextTier = nextTier ? nextTierPoints - currentPoints : 0;
    const pointsNeededForTier = nextTierPoints - tierStartPoints;
    
    const progressPercentage = nextTier 
      ? (pointsInCurrentTier / pointsNeededForTier) * 100 
      : 100;

    return {
      currentTier,
      currentPoints,
      pointsInCurrentTier,
      pointsNeededForNextTier,
      nextTier: nextTier || currentTier,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      tierStartPoints,
      nextTierPoints
    };
  }

  static formatLoyaltyScore(score: number): string {
    return score.toFixed(1);
  }

  static getLoyaltyScoreLevel(score: number): { level: string; color: string } {
    if (score >= 80) return { level: 'Excellent', color: 'green' };
    if (score >= 60) return { level: 'Good', color: 'blue' };
    if (score >= 40) return { level: 'Average', color: 'orange' };
    if (score >= 20) return { level: 'Fair', color: 'yellow' };
    return { level: 'Poor', color: 'red' };
  }

  // Search and filter utilities
  static searchUsers(users: CrmResponseDto[], searchTerm: string): CrmResponseDto[] {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.userId.toLowerCase().includes(term) ||
      user.membershipLevel.toLowerCase().includes(term) ||
      user.totalPoints.toString().includes(term)
    );
  }

  static filterUsersByTier(users: CrmResponseDto[], tier: MembershipTier | 'all'): CrmResponseDto[] {
    if (tier === 'all') return users;
    return users.filter(user => user.membershipLevel === tier);
  }

  static sortUsers(
    users: CrmResponseDto[], 
    sortBy: 'totalPoints' | 'membershipLevel' | 'joinDate' | 'lastActivity' | 'loyaltyScore',
    order: 'asc' | 'desc' = 'desc'
  ): CrmResponseDto[] {
    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'totalPoints':
          aValue = a.totalPoints;
          bValue = b.totalPoints;
          break;
        case 'membershipLevel':
          const tierOrder = {
            [MembershipTier.BRONZE]: 1,
            [MembershipTier.SILVER]: 2,
            [MembershipTier.GOLD]: 3,
            [MembershipTier.PLATINUM]: 4,
            [MembershipTier.DIAMOND]: 5
          };
          aValue = tierOrder[a.membershipLevel];
          bValue = tierOrder[b.membershipLevel];
          break;
        case 'joinDate':
          aValue = new Date(a.joinDate).getTime();
          bValue = new Date(b.joinDate).getTime();
          break;
        case 'lastActivity':
          aValue = new Date(a.lastActivity).getTime();
          bValue = new Date(b.lastActivity).getTime();
          break;
        case 'loyaltyScore':
          aValue = a.loyaltyScore || 0;
          bValue = b.loyaltyScore || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
}