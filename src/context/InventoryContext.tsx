// src/context/InventoryContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryService, Inventory, CreateInventoryRequest, UpdateInventoryRequest } from '../services/inventory.service';

// Types
interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface InventoryContextType {
  // Data
  inventory: Inventory[];
  filteredInventory: Inventory[];
  stats: InventoryStats;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Filters and search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  setFilterStatus: (status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
  
  // Selection
  selectedItems: Set<string>;
  setSelectedItems: (items: Set<string>) => void;
  
  // Modals
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  editingItem: Inventory | null;
  setEditingItem: (item: Inventory | null) => void;
  
  // Actions
  fetchInventory: () => Promise<void>;
  createInventory: (data: CreateInventoryRequest) => Promise<void>;
  updateInventory: (data: UpdateInventoryRequest) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  adjustStock: (id: string, adjustment: number) => Promise<void>;
  
  // Utilities
  selectAll: () => void;
  clearSelection: () => void;
  exportToCSV: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  // State
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  
  // Selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);

  // Calculate filtered inventory
  const filteredInventory = React.useMemo(() => {
    return inventory.filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          item.productName?.toLowerCase().includes(searchLower) ||
          item.productSku?.toLowerCase().includes(searchLower) ||
          item.warehouseLocation?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
        // Status filter
      switch (filterStatus) {
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
  }, [inventory, searchTerm, filterStatus]);

  // Calculate stats
  const stats: InventoryStats = React.useMemo(() => {
    return {
      total: inventory.length,
      inStock: inventory.filter(item => !item.isLowStock && !item.isOutOfStock).length,
      lowStock: inventory.filter(item => item.isLowStock && !item.isOutOfStock).length,
      outOfStock: inventory.filter(item => item.isOutOfStock).length,
    };
  }, [inventory]);

  // Fetch inventory
  const fetchInventory = async () => {
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
  };

  // Create inventory
  const createInventory = async (data: CreateInventoryRequest) => {
    try {
      await InventoryService.createInventory(data);
      await fetchInventory();
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inventory');
      throw err;
    }
  };

  // Update inventory
  const updateInventory = async (data: UpdateInventoryRequest) => {
    try {
      await InventoryService.updateInventory(data , data.id);
      await fetchInventory();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inventory');
      throw err;
    }
  };

  // Delete inventory
  const deleteInventory = async (id: string) => {
    try {
      await InventoryService.deleteInventory(id);
      await fetchInventory();
      setShowDeleteModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inventory');
      throw err;
    }
  };

  // Bulk delete
  const bulkDelete = async (ids: string[]) => {
    try {
      await InventoryService.bulkDelete(ids);
      await fetchInventory();
      clearSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete inventory');
      throw err;
    }
  };

  // Adjust stock
  // const adjustStock = async (id: string, adjustment: number) => {
  //   try {
  //     await InventoryService.adjustStock(id, adjustment);
  //     await fetchInventory();
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to adjust stock');
  //     throw err;
  //   }
  // };

  // Select all visible items
  const selectAll = () => {
    if (selectedItems.size === filteredInventory.length && filteredInventory.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredInventory.map(item => item.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvData = [
      ['Product Name', 'SKU', 'Quantity', 'Low Stock Threshold', 'Warehouse', 'Status'],
      ...filteredInventory.map(item => [
        item.productName,
        item.productSku,
        item.quantity.toString(),
        item.lowStockThreshold.toString(),
        item.warehouseLocation,
        item.isOutOfStock ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Load data on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  // Clear selection when filters change
  useEffect(() => {
    clearSelection();
  }, [searchTerm, filterStatus]);

  const value: InventoryContextType = {
    inventory,
    filteredInventory,
    stats,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    selectedItems,
    setSelectedItems,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    showDeleteModal,
    setShowDeleteModal,
    editingItem,
    setEditingItem,
    fetchInventory,
    createInventory,
    updateInventory,
    deleteInventory,
    bulkDelete,
    // adjustStock,
    selectAll,
    clearSelection,
    exportToCSV,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};