// src/types/inventory.ts

// Core inventory item interface
export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  lowStockThreshold: number;
  warehouseLocation: string;
  lastRestocked: string | null;
  price?: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

// Request interfaces for API calls
export interface CreateInventoryRequest {
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  warehouseLocation: string;
}

export interface UpdateInventoryRequest {
  id: string;
  quantity?: number;
  lowStockThreshold?: number;
  warehouseLocation?: string;
}

// Statistics interface
export interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

// Filter types
export type FilterStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

// Warehouse location options
export const WAREHOUSE_LOCATIONS = [
  { value: 'MAIN_WAREHOUSE', label: 'Main Warehouse' },
  { value: 'SECONDARY_WAREHOUSE', label: 'Secondary Warehouse' },
  { value: 'DISTRIBUTION_CENTER', label: 'Distribution Center' },
  { value: 'RETAIL_STORE', label: 'Retail Store' },
] as const;

// Stock status types
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

// Utility function to get stock status
export const getStockStatus = (quantity: number, lowStockThreshold: number): StockStatus => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
};

// Utility function to get status color
export const getStatusColor = (status: StockStatus) => {
  switch (status) {
    case 'in_stock':
      return 'green';
    case 'low_stock':
      return 'yellow';
    case 'out_of_stock':
      return 'red';
    default:
      return 'gray';
  }
};

// Error interface for API responses
export interface InventoryError {
  message: string;
  code?: string;
  field?: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: InventoryError;
  message?: string;
}

// Sorting options
export interface SortOption {
  field: keyof Inventory;
  direction: 'asc' | 'desc';
}

// Common sort fields
export const SORT_FIELDS = [
  { value: 'productName', label: 'Product Name' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'lowStockThreshold', label: 'Threshold' },
  { value: 'warehouseLocation', label: 'Warehouse' },
  { value: 'lastRestocked', label: 'Last Restocked' },
] as const;