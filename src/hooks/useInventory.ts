// src/hooks/useInventory.ts
import { useState, useEffect, useCallback } from 'react';
import { InventoryService, Inventory } from '../services/inventory.service';
import React from 'react';

// Custom hook for inventory operations
export const useInventoryOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      if (successMessage) {
        // You could integrate with a toast notification system here
        console.log(successMessage);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Operation failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeOperation,
    clearError,
  };
};

// Custom hook for inventory list with filtering
export const useInventoryList = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

  // Load inventory
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InventoryService.getAllInventory();
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = inventory;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.productName?.toLowerCase().includes(searchLower) ||
        item.productSku?.toLowerCase().includes(searchLower) ||
        item.warehouseLocation?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (statusFilter) {
          case 'in_stock':
            return !item.isLowStock && !item.isOutOfStock;
          case 'low_stock':
            return item.isLowStock && !item.isOutOfStock;
          case 'out_of_stock':
            return item.isOutOfStock;
          default:
            return true;
        }
      });
    }

    // Warehouse filter
    if (warehouseFilter !== 'all') {
      filtered = filtered.filter(item => item.warehouseLocation === warehouseFilter);
    }

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, statusFilter, warehouseFilter]);

  // Get unique warehouses for filter dropdown
  const warehouses = React.useMemo(() => {
    const uniqueWarehouses = [...new Set(inventory.map(item => item.warehouseLocation))];
    return uniqueWarehouses.map(warehouse => ({
      value: warehouse,
      label: warehouse.replace(/_/g, ' ')
    }));
  }, [inventory]);

  // Calculate stats
  const stats = React.useMemo(() => {
    return {
      total: inventory.length,
      inStock: inventory.filter(item => !item.isLowStock && !item.isOutOfStock).length,
      lowStock: inventory.filter(item => item.isLowStock && !item.isOutOfStock).length,
      outOfStock: inventory.filter(item => item.isOutOfStock).length,
    //   totalValue: inventory.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0),
    };
  }, [inventory]);

  // Load data on mount
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    // Data
    inventory,
    filteredInventory,
    stats,
    warehouses,
    
    // State
    loading,
    error,
    
    // Filters
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    warehouseFilter,
    setWarehouseFilter,
    
    // Actions
    fetchInventory,
    setError,
  };
};

// Custom hook for selection management
export const useSelection = <T extends { id: string }>(items: T[]) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedItems.size === items.length && items.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  }, [selectedItems.size, items]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedItems.has(id), [selectedItems]);

  const isAllSelected = selectedItems.size === items.length && items.length > 0;
  const hasSelection = selectedItems.size > 0;

  // Clear selection when items change (e.g., after filtering)
  useEffect(() => {
    const validIds = new Set(items.map(item => item.id));
    const filteredSelection = new Set(Array.from(selectedItems).filter(id => validIds.has(id)));
    
    if (filteredSelection.size !== selectedItems.size) {
      setSelectedItems(filteredSelection);
    }
  }, [items, selectedItems]);

  return {
    selectedItems,
    selectItem,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    hasSelection,
    selectedCount: selectedItems.size,
  };
};

// Custom hook for async operations with optimistic updates
export const useOptimisticUpdate = <T extends { id: string }>(
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>
) => {
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  const executeWithOptimisticUpdate = useCallback(async <R>(
    itemId: string,
    optimisticUpdate: (items: T[]) => T[],
    operation: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: Error) => void
  ) => {
    // Add to pending operations
    setPendingOperations(prev => new Set(prev).add(itemId));
    
    // Apply optimistic update
    const originalItems = items;
    setItems(optimisticUpdate(items));

    try {
      const result = await operation();
      onSuccess?.(result);
      return result;
    } catch (error) {
      // Revert optimistic update on error
      setItems(originalItems);
      onError?.(error as Error);
      throw error;
    } finally {
      // Remove from pending operations
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [items, setItems]);

  const isPending = useCallback((itemId: string) => pendingOperations.has(itemId), [pendingOperations]);

  return {
    executeWithOptimisticUpdate,
    isPending,
    hasPendingOperations: pendingOperations.size > 0,
  };
};

// Custom hook for debounced search
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for localStorage with inventory data
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};