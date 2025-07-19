import { Loyalty_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum TransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST'
}

// Interfaces
export interface TransactionCreateRequestDto {
  userId: string;
  type: TransactionType;
  points: number;
  source: string;
  relatedOrderId?: string;
  relatedCouponId?: string;
  orderAmount?: number;
  idempotencyKey?: string;
}

export interface TransactionResponseDto {
  id: string;
  userId: string;
  type: TransactionType;
  points: number;
  transactionDate: string;
  source: string;
  balance: number;
  relatedOrderId?: string;
  relatedCouponId?: string;
  expirationDate?: string;
  orderAmount?: number;
  idempotencyKey?: string;
}

export interface TransactionSummaryDto {
  userId: string;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  totalTransactions: number;
  earningTransactions: number;
  redemptionTransactions: number;
  firstTransactionDate?: string;
  lastTransactionDate?: string;
  averagePointsPerEarning: number;
}

export interface TransactionHistoryRequestDto {
  userId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
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

// Base URL for transaction endpoints
const TRANSACTION_BASE_URL = `${Loyalty_Service_URL}/transactions`;

export class PointTransactionService {
  
  // Create a new point transaction
  static async createTransaction(transactionData: TransactionCreateRequestDto): Promise<TransactionResponseDto> {
    try {
      const response = await fetch(`${TRANSACTION_BASE_URL}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid transaction data: ${errorData?.message || 'Bad Request'}`);
        }
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to create transaction: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Get transaction history for a user
  static async getTransactionHistory(userId: string): Promise<TransactionResponseDto[]> {
    try {
      const response = await fetch(`${TRANSACTION_BASE_URL}/${userId}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to fetch transaction history: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  // Check transaction status by idempotency key
  static async checkTransactionStatus(userId: string, idempotencyKey: string): Promise<TransactionResponseDto | null> {
    try {
      const response = await fetch(`${TRANSACTION_BASE_URL}/${userId}/check?idempotencyKey=${encodeURIComponent(idempotencyKey)}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (response.status === 404) {
        return null; // Transaction not found
      }

      if (!response.ok) {
        throw new Error(`Failed to check transaction status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw error;
    }
  }

  // Convenience method to earn points
  static async earnPoints(
    userId: string, 
    points: number, 
    source: string, 
    relatedOrderId?: string,
    orderAmount?: number
  ): Promise<TransactionResponseDto> {
    const transactionData: TransactionCreateRequestDto = {
      userId,
      type: TransactionType.EARN,
      points,
      source,
      relatedOrderId,
      orderAmount,
      idempotencyKey: relatedOrderId ? `earn-${relatedOrderId}` : undefined
    };

    return this.createTransaction(transactionData);
  }

  // Convenience method to redeem points
  static async redeemPoints(
    userId: string, 
    points: number, 
    source: string, 
    relatedCouponId?: string
  ): Promise<TransactionResponseDto> {
    const transactionData: TransactionCreateRequestDto = {
      userId,
      type: TransactionType.REDEEM,
      points,
      source,
      relatedCouponId,
      idempotencyKey: relatedCouponId ? `redeem-${relatedCouponId}` : undefined
    };

    return this.createTransaction(transactionData);
  }

  // Convenience method to adjust points (admin only)
  static async adjustPoints(
    userId: string, 
    points: number, 
    reason: string
  ): Promise<TransactionResponseDto> {
    const transactionData: TransactionCreateRequestDto = {
      userId,
      type: TransactionType.ADJUST,
      points,
      source: `Admin Adjustment: ${reason}`,
      idempotencyKey: `adjust-${userId}-${Date.now()}`
    };

    return this.createTransaction(transactionData);
  }

  // Generate transaction summary for a user
  static async getTransactionSummary(userId: string): Promise<TransactionSummaryDto> {
    try {
      const transactions = await this.getTransactionHistory(userId);
      
      const earningTransactions = transactions.filter(t => t.type === TransactionType.EARN);
      const redemptionTransactions = transactions.filter(t => t.type === TransactionType.REDEEM);
      
      const totalPointsEarned = earningTransactions.reduce((sum, t) => sum + t.points, 0);
      const totalPointsRedeemed = redemptionTransactions.reduce((sum, t) => sum + t.points, 0);
      
      const sortedTransactions = transactions.sort((a, b) => 
        new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
      );

      return {
        userId,
        totalPointsEarned,
        totalPointsRedeemed,
        currentBalance: transactions[0]?.balance || 0, // Most recent balance
        totalTransactions: transactions.length,
        earningTransactions: earningTransactions.length,
        redemptionTransactions: redemptionTransactions.length,
        firstTransactionDate: sortedTransactions[0]?.transactionDate,
        lastTransactionDate: sortedTransactions[sortedTransactions.length - 1]?.transactionDate,
        averagePointsPerEarning: earningTransactions.length > 0 
          ? totalPointsEarned / earningTransactions.length 
          : 0
      };
    } catch (error) {
      console.error('Error generating transaction summary:', error);
      throw error;
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

  static getTransactionTypeDisplayName(type: TransactionType): string {
    switch (type) {
      case TransactionType.EARN:
        return 'Earned';
      case TransactionType.REDEEM:
        return 'Redeemed';
      case TransactionType.EXPIRE:
        return 'Expired';
      case TransactionType.ADJUST:
        return 'Adjusted';
      default:
        return type;
    }
  }

  static getTransactionTypeColor(type: TransactionType): string {
    switch (type) {
      case TransactionType.EARN:
        return 'green';
      case TransactionType.REDEEM:
        return 'orange';
      case TransactionType.EXPIRE:
        return 'red';
      case TransactionType.ADJUST:
        return 'blue';
      default:
        return 'gray';
    }
  }

  static getTransactionTypeIcon(type: TransactionType): string {
    switch (type) {
      case TransactionType.EARN:
        return '⬆️';
      case TransactionType.REDEEM:
        return '⬇️';
      case TransactionType.EXPIRE:
        return '⏰';
      case TransactionType.ADJUST:
        return '⚖️';
      default:
        return '📝';
    }
  }

  // Search and filter utilities
  static searchTransactions(
    transactions: TransactionResponseDto[], 
    searchTerm: string
  ): TransactionResponseDto[] {
    if (!searchTerm.trim()) return transactions;
    
    const term = searchTerm.toLowerCase();
    return transactions.filter(transaction => 
      transaction.source.toLowerCase().includes(term) ||
      transaction.type.toLowerCase().includes(term) ||
      transaction.points.toString().includes(term) ||
      (transaction.relatedOrderId && transaction.relatedOrderId.toLowerCase().includes(term))
    );
  }

  static filterTransactionsByType(
    transactions: TransactionResponseDto[], 
    type: TransactionType | 'all'
  ): TransactionResponseDto[] {
    if (type === 'all') return transactions;
    return transactions.filter(transaction => transaction.type === type);
  }

  static filterTransactionsByDateRange(
    transactions: TransactionResponseDto[], 
    startDate?: string, 
    endDate?: string
  ): TransactionResponseDto[] {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate);
      
      if (startDate && transactionDate < new Date(startDate)) {
        return false;
      }
      
      if (endDate && transactionDate > new Date(endDate)) {
        return false;
      }
      
      return true;
    });
  }

  static sortTransactions(
    transactions: TransactionResponseDto[], 
    sortBy: 'transactionDate' | 'points' | 'balance' | 'type',
    order: 'asc' | 'desc' = 'desc'
  ): TransactionResponseDto[] {
    return [...transactions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'transactionDate':
          aValue = new Date(a.transactionDate).getTime();
          bValue = new Date(b.transactionDate).getTime();
          break;
        case 'points':
          aValue = a.points;
          bValue = b.points;
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  static groupTransactionsByMonth(transactions: TransactionResponseDto[]): Record<string, TransactionResponseDto[]> {
    return transactions.reduce((groups, transaction) => {
      const month = new Date(transaction.transactionDate).toISOString().slice(0, 7); // YYYY-MM
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(transaction);
      return groups;
    }, {} as Record<string, TransactionResponseDto[]>);
  }

  static calculateMonthlyStats(transactions: TransactionResponseDto[]): Record<string, {
    earned: number;
    redeemed: number;
    net: number;
    count: number;
  }> {
    const grouped = this.groupTransactionsByMonth(transactions);
    
    return Object.keys(grouped).reduce((stats, month) => {
      const monthTransactions = grouped[month];
      const earned = monthTransactions
        .filter(t => t.type === TransactionType.EARN)
        .reduce((sum, t) => sum + t.points, 0);
      const redeemed = monthTransactions
        .filter(t => t.type === TransactionType.REDEEM)
        .reduce((sum, t) => sum + t.points, 0);
      
      stats[month] = {
        earned,
        redeemed,
        net: earned - redeemed,
        count: monthTransactions.length
      };
      
      return stats;
    }, {} as Record<string, any>);
  }
}