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
  available : boolean ;
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

// Custom error class for inventory operations
export class InventoryError extends Error {
  constructor(
    message: string,
    public type: 'CONFLICT' | 'NOT_FOUND' | 'VALIDATION' | 'SERVER_ERROR' = 'SERVER_ERROR',
    public details?: unknown | null
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}

export class InventoryService {
  private static baseUrl = `${Inventory_Service_URL}`;

  // Enhanced error handling
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorType: 'CONFLICT' | 'NOT_FOUND' | 'VALIDATION' | 'SERVER_ERROR' = 'SERVER_ERROR';
      let errorDetails: unknown = null;

      try {
        const errorData = await response.json();
        
        // Handle structured error responses from backend
        if (errorData.error) {
          errorMessage = errorData.message || errorData.error;
          
          // Map backend error types to frontend types
          switch (errorData.error) {
            case 'CONFLICT':
            case 'INVENTORY_ALREADY_EXISTS':
              errorType = 'CONFLICT';
              break;
            case 'INVALID_INPUT':
              errorType = 'VALIDATION';
              break;
            case 'NOT_FOUND':
              errorType = 'NOT_FOUND';
              break;
            default:
              errorType = 'SERVER_ERROR';
          }
          
          errorDetails = errorData;
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (parseError) {
        // If we can't parse the error response, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (textError) {
          // Use the default HTTP error message
        }
      }

      // Handle specific HTTP status codes
      switch (response.status) {
        case 404:
          errorType = 'NOT_FOUND';
          if (!errorDetails) {
            errorMessage = 'Inventory item not found';
          }
          break;
        case 409:
          errorType = 'CONFLICT';
          break;
        case 400:
          errorType = 'VALIDATION';
          break;
      }

      throw new InventoryError(errorMessage, errorType, errorDetails);
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

  // Get inventory by product ID
  
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

  // Enhanced delete inventory with better error handling
  static async deleteInventory(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      await this.handleResponse<void>(response);
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

  // Enhanced bulk delete with better error handling
  static async bulkDelete(ids: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk-delete`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ids }),
      });
      
      await this.handleResponse<void>(response);
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