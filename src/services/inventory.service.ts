import API_GATEWAY_BASE_URL from "../env";
import getAuthHeaders from "../lib/authHeaders";

// Updated interface to match actual backend response
export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  available: boolean;
  warehouseLocation: string;
  reserved: number;
  lastUpdated: string;
  
  // Product information (flat properties from backend)
  productName: string | null;
  productSku: string | null;
  productPrice?: number | null;
  productStatus?: string | null;
  
  // Stock information
  lowStockThreshold: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockStatus: string;
  availableQuantity: number;
  
  // Warehouse information
  warehouseCode?: string | null;
  warehouseName?: string | null;
  warehouseRegion?: string | null;
  
  // Business metrics (if using enhanced response)
  optimalStockLevel?: number;
  reorderPoint?: number;
  economicOrderQuantity?: number;
  turnoverRate?: number;
  stockHealthIndicator?: string;
}

// Basic inventory interface for simple operations
export interface InventoryBasic {
  id: string;
  productId: string;
  quantity: number;
  available: boolean;
  warehouseLocation: string;
  reserved: number;
  lastUpdated: string;
  productName: string | null;
  productSku: string | null;
  lowStockThreshold: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockStatus: string;
}

export interface CreateInventoryRequest {
  productId: string;
  quantity: number;
  available: boolean;
  lowStockThreshold?: number;
  warehouseLocation: string;
  reserved?: number;
}

export interface UpdateInventoryRequest {
  id?: string;
  productId?: string;
  quantity?: number;
  available?: boolean;
  lowStockThreshold?: number;
  warehouseLocation?: string;
  reserved?: number;
}

// Stock operation requests
export interface StockUpdateRequest {
  quantity: number;
}

export interface RestockRequest {
  quantity: number;
}

export interface ReserveStockRequest {
  quantity: number;
}

// Error response interface
export interface InventoryError {
  error: string;
  message: string;
  timestamp: string;
}

export class InventoryService {
  private static baseUrl = `${API_GATEWAY_BASE_URL}/products/inventory`;

  // Helper method to handle API errors
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: InventoryError = await response.json().catch(() => ({
        error: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString()
      }));
      
      throw new Error(`${errorData.error}: ${errorData.message}`);
    }
    
    return await response.json();
  }

  // Get all inventory (enhanced response)
  static async getAllInventory(): Promise<Inventory[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return await this.handleResponse<Inventory[]>(response);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  // Get all inventory (basic response for performance)
  static async getAllInventoryBasic(): Promise<InventoryBasic[]> {
    try {
      const response = await fetch(`${this.baseUrl}/basic`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<InventoryBasic[]>(response);
    } catch (error) {
      console.error('Error fetching basic inventory:', error);
      throw error;
    }
  }

  // Get inventory by product ID
  static async getInventoryByProductId(productId: string): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error fetching inventory by product ID:', error);
      throw error;
    }
  }

  // Get basic inventory by product ID (lightweight)
  static async getInventoryByProductIdBasic(productId: string): Promise<InventoryBasic> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/basic`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<InventoryBasic>(response);
    } catch (error) {
      console.error('Error fetching basic inventory by product ID:', error);
      throw error;
    }
  }

  // Check if inventory exists for product
  static async checkInventoryExists(productId: string): Promise<{ exists: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/exists`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<{ exists: boolean }>(response);
    } catch (error) {
      console.error('Error checking inventory existence:', error);
      throw error;
    }
  }

  // Create new inventory
  static async createInventory(inventoryData: CreateInventoryRequest): Promise<Inventory> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(inventoryData),
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  // Create inventory using simple parameters
  static async createInventorySimple(
    productId: string, 
    quantity: number, 
    warehouseLocation: string = 'MAIN_WAREHOUSE',
    lowStockThreshold: number = 10
  ): Promise<Inventory> {
    try {
      const url = `${this.baseUrl}/simple?productId=${productId}&quantity=${quantity}&warehouseLocation=${warehouseLocation}&lowStockThreshold=${lowStockThreshold}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error creating simple inventory:', error);
      throw error;
    }
  }

  // Update inventory (full update)
  static async updateInventory(productId: string, inventoryData: UpdateInventoryRequest): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(inventoryData),
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  // Partial update inventory
  static async partialUpdateInventory(productId: string, inventoryData: Partial<UpdateInventoryRequest>): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(inventoryData),
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error partially updating inventory:', error);
      throw error;
    }
  }

  // Update stock quantity only
  static async updateStock(productId: string, quantity: number): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/stock?quantity=${quantity}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  // Update low stock threshold only
  static async updateLowStockThreshold(productId: string, threshold: number): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/threshold?threshold=${threshold}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error updating low stock threshold:', error);
      throw error;
    }
  }

  // Restock inventory (add to existing quantity)
  static async restockInventory(productId: string, quantity: number): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/restock?quantity=${quantity}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error restocking inventory:', error);
      throw error;
    }
  }

  // Delete inventory
  static async deleteInventory(productId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete inventory: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw error;
    }
  }

  // Get low stock items
  static async getLowStockItems(): Promise<Inventory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/low-stock`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory[]>(response);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  // Get inventory by warehouse
  static async getInventoryByWarehouse(location: string): Promise<Inventory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/warehouse/${encodeURIComponent(location)}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory[]>(response);
    } catch (error) {
      console.error('Error fetching inventory by warehouse:', error);
      throw error;
    }
  }

  // Check if order can be fulfilled
  static async canFulfillOrder(productId: string, quantity: number): Promise<{
    canFulfill: boolean;
    requestedQuantity: number;
    availableQuantity?: number;
    shortfall?: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/can-fulfill?quantity=${quantity}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error checking order fulfillment:', error);
      throw error;
    }
  }

  // Reserve stock for order
  static async reserveStock(productId: string, quantity: number): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/reserve?quantity=${quantity}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error reserving stock:', error);
      throw error;
    }
  }

  // Release reserved stock
  static async releaseReservedStock(productId: string, quantity: number): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/release?quantity=${quantity}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await this.handleResponse<Inventory>(response);
    } catch (error) {
      console.error('Error releasing reserved stock:', error);
      throw error;
    }
  }

  // Helper methods for common operations
  static async adjustStock(productId: string, adjustment: number): Promise<Inventory> {
    try {
      const inventory = await this.getInventoryByProductId(productId);
      const newQuantity = Math.max(0, inventory.quantity + adjustment);
      return await this.updateStock(productId, newQuantity);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }

  // Get display name for product (handles null values)
  static getProductDisplayName(inventory: Inventory): string {
    return inventory.productName || inventory.productSku || `Product ${inventory.productId.substring(0, 8)}`;
  }

  // Get display SKU for product (handles null values)
  static getProductDisplaySku(inventory: Inventory): string {
    return inventory.productSku || 'No SKU';
  }

  // Check if inventory is healthy
  static isInventoryHealthy(inventory: Inventory): boolean {
    return !inventory.isLowStock && !inventory.isOutOfStock && inventory.available;
  }

  // Get stock status color for UI
  static getStockStatusColor(inventory: Inventory): 'green' | 'yellow' | 'red' | 'gray' {
    if (inventory.isOutOfStock) return 'red';
    if (inventory.isLowStock) return 'yellow';
    if (inventory.available) return 'green';
    return 'gray';
  }
}