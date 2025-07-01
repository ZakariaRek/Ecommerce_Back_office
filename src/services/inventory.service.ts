// src/services/inventory.service.ts
import { Inventory_Service_URL } from "../lib/apiEndPoints";
import getAuthHeaders from "../lib/authHeaders";

// Updated Inventory interface to match backend response
export interface InventoryResponseDTO {
  id: string;
  productId: string;
  quantity: number;
  available: boolean;
  warehouseLocation: string;
  reserved: number;
  lastUpdated: string;
  productName: string;
  productSku: string;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  availableQuantity: number;
  stockStatus: string;
}

// Flattened inventory interface for UI
export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  lowStockThreshold: number;
  warehouseLocation: string;
  lastUpdated: string;
  available: boolean;
  reserved: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  availableQuantity: number;
  stockStatus: string;
}

// Request Interfaces
export interface CreateInventoryRequest {
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  warehouseLocation: string;
  reserved?: number;
}

export interface UpdateInventoryRequest {
  id: string;
  productId : string;
  quantity?: number;
  lowStockThreshold?: number;
  warehouseLocation?: string;
  reserved?: number;
}

export interface StockAdjustmentRequest {
  adjustment: number;
  reason?: string;
}

export class InventoryService {
  private static baseUrl = `${Inventory_Service_URL}`;

  // Handle API responses
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  // Flatten the grouped inventory response
  private static flattenInventoryResponse(
    groupedInventory: Record<string, InventoryResponseDTO[]>
  ): Inventory[] {
    const flattened: Inventory[] = [];
    
    Object.values(groupedInventory).forEach(inventoryArray => {
      inventoryArray.forEach(item => {
        flattened.push({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          lowStockThreshold: item.lowStockThreshold,
          warehouseLocation: item.warehouseLocation,
          lastUpdated: item.lastUpdated,
          available: item.available,
          reserved: item.reserved,
          isLowStock: item.isLowStock,
          isOutOfStock: item.isOutOfStock,
          availableQuantity: item.availableQuantity,
          stockStatus: item.stockStatus,
        });
      });
    });
    
    return flattened;
  }

  // Get all inventory (handles grouped response)
  static async getAllInventory(): Promise<Inventory[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const groupedData = await this.handleResponse<Record<string, InventoryResponseDTO[]>>(response);
      return this.flattenInventoryResponse(groupedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  // Get inventory by ID
  static async getInventoryById(id: string): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      console.log("Inventory by ID: ", response)
      const item = await this.handleResponse<InventoryResponseDTO>(response);
      
      // Convert single item to flattened format
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        warehouseLocation: item.warehouseLocation,
        lastUpdated: item.lastUpdated,
        available: item.available,
        reserved: item.reserved,
        isLowStock: item.isLowStock,
        isOutOfStock: item.isOutOfStock,
        availableQuantity: item.availableQuantity,
        stockStatus: item.stockStatus,
      };
    } catch (error) {
      console.error('Error fetching inventory by ID:', error);
      throw error;
    }
  }

  // Create new inventory
  static async createInventory(data: CreateInventoryRequest): Promise<Inventory> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const item = await this.handleResponse<InventoryResponseDTO>(response);
      
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        warehouseLocation: item.warehouseLocation,
        lastUpdated: item.lastUpdated,
        available: item.available,
        reserved: item.reserved,
        isLowStock: item.isLowStock,
        isOutOfStock: item.isOutOfStock,
        availableQuantity: item.availableQuantity,
        stockStatus: item.stockStatus,
      };
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  // Update inventory
  static async updateInventory(data: UpdateInventoryRequest, id : string): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const item = await this.handleResponse<InventoryResponseDTO>(response);
      
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        warehouseLocation: item.warehouseLocation,
        lastUpdated: item.lastUpdated,
        available: item.available,
        reserved: item.reserved,
        isLowStock: item.isLowStock,
        isOutOfStock: item.isOutOfStock,
        availableQuantity: item.availableQuantity,
        stockStatus: item.stockStatus,
      };
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  // Delete inventory
  static async deleteInventory(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete inventory: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw error;
    }
  }

  // Adjust stock
  static async adjustStock(id: string, adjustment: number, reason?: string): Promise<Inventory> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/adjust-stock`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ adjustment, reason }),
      });
      
      const item = await this.handleResponse<InventoryResponseDTO>(response);
      
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        warehouseLocation: item.warehouseLocation,
        lastUpdated: item.lastUpdated,
        available: item.available,
        reserved: item.reserved,
        isLowStock: item.isLowStock,
        isOutOfStock: item.isOutOfStock,
        availableQuantity: item.availableQuantity,
        stockStatus: item.stockStatus,
      };
    } catch (error) {
      console.error('Error adjusting stock:', error);
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
      
      const groupedData = await this.handleResponse<Record<string, InventoryResponseDTO[]>>(response);
      return this.flattenInventoryResponse(groupedData);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  // Search inventory
  static async searchInventory(query: string): Promise<Inventory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const groupedData = await this.handleResponse<Record<string, InventoryResponseDTO[]>>(response);
      return this.flattenInventoryResponse(groupedData);
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  }

  // Bulk delete
  static async bulkDelete(ids: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk-delete`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to bulk delete: ${response.status}`);
      }
    } catch (error) {
      console.error('Error bulk deleting inventory:', error);
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
      
      const groupedData = await this.handleResponse<Record<string, InventoryResponseDTO[]>>(response);
      return this.flattenInventoryResponse(groupedData);
    } catch (error) {
      console.error('Error fetching inventory by warehouse:', error);
      throw error;
    }
  }
}