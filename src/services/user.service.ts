import { User_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum ERole {
  ROLE_USER = 'ROLE_USER',
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_MODERATOR = 'ROLE_MODERATOR'
}

// Interfaces
export interface Role {
  id: string;
  name: ERole;
}

export interface User {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  roles: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  password: string;
  roles: string[];
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface MessageResponse {
  message: string;
}

export interface UserOption {
  value: string;
  label: string;
  email: string;
  status: UserStatus;
  roles: string[];
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

// Helper function to create request headers for JSON requests
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

// Base URL for user endpoints
const USER_BASE_URL = `${User_Service_URL}/users`;

export class UserService {
  
  // Get base URL for constructing URLs
  static getBaseUrl(): string {
    return USER_BASE_URL;
  }

  // Get all users
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${USER_BASE_URL}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user options for dropdowns/selects
  static async getUserOptions(): Promise<UserOption[]> {
    try {
      const users = await this.getAllUsers();
      
      return users
        .filter(user => user.status === UserStatus.ACTIVE)
        .map(user => ({
          value: user.id,
          label: `${user.username} (${user.email})`,
          email: user.email,
          status: user.status,
          roles: user.roles.map(role => role.name)
        }));
    } catch (error) {
      console.error('Error fetching user options:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User> {
    try {
      const response = await fetch(`${USER_BASE_URL}/${id}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  // Get user by username
  static async getUserByUsername(username: string): Promise<User> {
    try {
      const response = await fetch(`${USER_BASE_URL}/username/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to fetch user by username: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User> {
    try {
      const response = await fetch(`${USER_BASE_URL}/email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to fetch user by email: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  // Update user (PUT - full update)
  static async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${USER_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid user data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to update user: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user status
  static async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    try {
      const response = await fetch(`${USER_BASE_URL}/${id}/status/${status}`, {
        method: 'PATCH',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Invalid status value: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to update user status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<MessageResponse> {
    try {
      const response = await fetch(`${USER_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to delete user: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Check if user exists
  static async userExists(id: string): Promise<boolean> {
    try {
      await this.getUserById(id);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return false;
      }
      throw error; // Re-throw other errors
    }
  }

  // Check if username exists
  static async usernameExists(username: string): Promise<boolean> {
    try {
      await this.getUserByUsername(username);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return false;
      }
      throw error;
    }
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    try {
      await this.getUserByEmail(email);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return false;
      }
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

  static getStatusDisplayName(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Active';
      case UserStatus.INACTIVE:
        return 'Inactive';
      case UserStatus.SUSPENDED:
        return 'Suspended';
      case UserStatus.PENDING:
        return 'Pending';
      default:
        return status;
    }
  }

  static getStatusColor(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.INACTIVE:
        return 'warning';
      case UserStatus.SUSPENDED:
        return 'error';
      case UserStatus.PENDING:
        return 'info';
      default:
        return 'default';
    }
  }

  static getRoleDisplayName(role: ERole): string {
    switch (role) {
      case ERole.ROLE_USER:
        return 'User';
      case ERole.ROLE_ADMIN:
        return 'Admin';
      case ERole.ROLE_MODERATOR:
        return 'Moderator';
      default:
        return role.replace('ROLE_', '');
    }
  }

  static getRoleColor(role: ERole): string {
    switch (role) {
      case ERole.ROLE_ADMIN:
        return 'error';
      case ERole.ROLE_MODERATOR:
        return 'warning';
      case ERole.ROLE_USER:
        return 'success';
      default:
        return 'default';
    }
  }

  static isUserActive(user: User): boolean {
    return user.status === UserStatus.ACTIVE;
  }

  static hasRole(user: User, role: ERole): boolean {
    return user.roles.some(userRole => userRole.name === role);
  }

  static isAdmin(user: User): boolean {
    return this.hasRole(user, ERole.ROLE_ADMIN);
  }

  static isModerator(user: User): boolean {
    return this.hasRole(user, ERole.ROLE_MODERATOR);
  }

  static getUserRoleNames(user: User): string[] {
    return user.roles.map(role => role.name);
  }

  static getUserRoleDisplayNames(user: User): string[] {
    return user.roles.map(role => this.getRoleDisplayName(role.name));
  }

  // Search and filter utilities
  static searchUsers(users: User[], searchTerm: string): User[] {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.roles.some(role => 
        this.getRoleDisplayName(role.name).toLowerCase().includes(term)
      )
    );
  }

  static filterUsersByStatus(users: User[], status: UserStatus | 'all'): User[] {
    if (status === 'all') return users;
    return users.filter(user => user.status === status);
  }

  static filterUsersByRole(users: User[], role: ERole | 'all'): User[] {
    if (role === 'all') return users;
    return users.filter(user => this.hasRole(user, role));
  }

  static sortUsers(
    users: User[], 
    sortBy: 'username' | 'email' | 'status' | 'createdAt' | 'updatedAt',
    order: 'asc' | 'desc' = 'asc'
  ): User[] {
    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt || '').getTime();
          bValue = new Date(b.updatedAt || '').getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Validation helpers
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUsername(username: string): boolean {
    // Username should be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { valid: errors.length === 0, errors };
  }

  static validateUserData(userData: Partial<UpdateUserRequest | CreateUserRequest>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (userData.username && !this.validateUsername(userData.username)) {
      errors.push('Username must be 3-20 characters long and contain only letters, numbers, and underscores');
    }
    
    if (userData.email && !this.validateEmail(userData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (userData.password) {
      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.valid) {
        errors.push(...passwordValidation.errors);
      }
    }
    
    if (userData.roles && userData.roles.length === 0) {
      errors.push('At least one role must be assigned');
    }
    
    return { valid: errors.length === 0, errors };
  }
}