import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryService, Inventory, UpdateInventoryRequest } from '../services/inventory.service';

// Main Inventory Context
interface InventoryContextType {
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  fetchInventory: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  updateInventory: (data: UpdateInventoryRequest) => Promise<void>;
  adjustStock: (productId: string, adjustment: number) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

// Statistics Context
interface InventoryStatsType {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  inStock: number;
}

interface InventoryStatsContextType {
  stats: InventoryStatsType;
  calculateStats: (inventory: Inventory[]) => void;
}

const InventoryStatsContext = createContext<InventoryStatsContextType | undefined>(undefined);

export const useInventoryStats = () => {
  const context = useContext(InventoryStatsContext);
  if (!context) {
    throw new Error('useInventoryStats must be used within an InventoryProvider');
  }
  return context;
};

// Filters Context
interface InventoryFiltersContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock';
  setFilterStatus: (status: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock') => void;
  sortBy: 'name' | 'quantity' | 'lastRestocked';
  setSortBy: (sort: 'name' | 'quantity' | 'lastRestocked') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  filteredAndSortedInventory: Inventory[];
}

const InventoryFiltersContext = createContext<InventoryFiltersContextType | undefined>(undefined);

export const useInventoryFilters = () => {
  const context = useContext(InventoryFiltersContext);
  if (!context) {
    throw new Error('useInventoryFilters must be used within an InventoryProvider');
  }
  return context;
};

// Selection Context
interface InventorySelectionContextType {
  selectedItems: Set<string>;
  setSelectedItems: (items: Set<string>) => void;
  handleSelectAll: () => void;
  handleSelectItem: (itemId: string) => void;
  clearSelection: () => void;
}

const InventorySelectionContext = createContext<InventorySelectionContextType | undefined>(undefined);

export const useInventorySelection = () => {
  const context = useContext(InventorySelectionContext);
  if (!context) {
    throw new Error('useInventorySelection must be used within an InventoryProvider');
  }
  return context;
};

// Modals Context
interface InventoryModalsContextType {
  editingInventory: Inventory | null;
  setEditingInventory: (inventory: Inventory | null) => void;
  adjustingInventory: Inventory | null;
  setAdjustingInventory: (inventory: Inventory | null) => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showBulkModal: boolean;
  setShowBulkModal: (show: boolean) => void;
  bulkAction: string;
  setBulkAction: (action: string) => void;
}

const InventoryModalsContext = createContext<InventoryModalsContextType | undefined>(undefined);

export const useInventoryModals = () => {
  const context = useContext(InventoryModalsContext);
  if (!context) {
    throw new Error('useInventoryModals must be used within an InventoryProvider');
  }
  return context;
};

// Main Provider Component
interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  // Main inventory state
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Stats state
  const [stats, setStats] = useState<InventoryStatsType>({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    inStock: 0
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'lastRestocked'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Modal state
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [adjustingInventory, setAdjustingInventory] = useState<Inventory | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');

  // Main inventory functions
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InventoryService.getAllInventory();
      setInventory(data);
      calculateStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const updateInventory = async (data: UpdateInventoryRequest) => {
    try {
      await InventoryService.updateInventory(data);
      setEditingInventory(null);
      await fetchInventory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inventory';
      console.error('Error updating inventory:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const adjustStock = async (productId: string, adjustment: number) => {
    try {
      await InventoryService.adjustStock(productId, adjustment);
      setAdjustingInventory(null);
      await fetchInventory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust stock';
      console.error('Error adjusting stock:', err);
      setError(errorMessage);
      throw err;
    }
  };

  // Stats functions
  const calculateStats = (inventoryData: Inventory[]) => {
    const newStats = inventoryData.reduce((acc, item) => {
      acc.totalProducts++;
      
      if (item.quantity === 0) {
        acc.outOfStock++;
      } else if (item.quantity <= item.lowStockThreshold!) {
        acc.lowStock++;
      } else {
        acc.inStock++;
      }
      
      return acc;
    }, {
      totalProducts: 0,
      lowStock: 0,
      outOfStock: 0,
      inStock: 0
    });
    
    setStats(newStats);
  };

  // Filter functions - memoized calculation
  const filteredAndSortedInventory = React.useMemo(() => {
    return inventory
      .filter(item => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesName = item.productName?.toLowerCase().includes(searchLower) ?? false;
          const matchesSku = item.productSku?.toLowerCase().includes(searchLower) ?? false;
          const matchesLocation = item.warehouseLocation?.toLowerCase().includes(searchLower) ?? false;
          
          if (!matchesName && !matchesSku && !matchesLocation) {
            return false;
          }
        }
        
        // Status filter
        switch (filterStatus) {
          case 'out_of_stock':
            return item.quantity === 0;
          case 'low_stock':
            return item.quantity > 0 && item.quantity <= item.lowStockThreshold!;
          case 'in_stock':
            return item.quantity > item.lowStockThreshold!;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        let aValue: string | number, bValue: string | number;
        
        switch (sortBy) {
          case 'quantity':
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case 'lastRestocked':
            aValue = a.lastRestocked ? new Date(a.lastRestocked).getTime() : 0;
            bValue = b.lastRestocked ? new Date(b.lastRestocked).getTime() : 0;
            break;
          default: // name
            aValue = (a.productName || '').toLowerCase();
            bValue = (b.productName || '').toLowerCase();
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [inventory, searchTerm, filterStatus, sortBy, sortOrder]);

  // Selection functions
  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedInventory.length && filteredAndSortedInventory.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedInventory.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Clear selection when filters change and selected items are no longer visible
  useEffect(() => {
    if (selectedItems.size > 0) {
      const visibleItemIds = new Set(filteredAndSortedInventory.map(item => item.id));
      const newSelection = new Set(Array.from(selectedItems).filter(id => visibleItemIds.has(id)));
      
      if (newSelection.size !== selectedItems.size) {
        setSelectedItems(newSelection);
      }
    }
  }, [filteredAndSortedInventory, selectedItems]);

  // Load data on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  // Context values
  const inventoryValue: InventoryContextType = {
    inventory,
    loading,
    error,
    refreshing,
    fetchInventory,
    handleRefresh,
    updateInventory,
    adjustStock
  };

  const statsValue: InventoryStatsContextType = {
    stats,
    calculateStats
  };

  const filtersValue: InventoryFiltersContextType = {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedInventory
  };

  const selectionValue: InventorySelectionContextType = {
    selectedItems,
    setSelectedItems,
    handleSelectAll,
    handleSelectItem,
    clearSelection
  };

  const modalsValue: InventoryModalsContextType = {
    editingInventory,
    setEditingInventory,
    adjustingInventory,
    setAdjustingInventory,
    showCreateModal,
    setShowCreateModal,
    showBulkModal,
    setShowBulkModal,
    bulkAction,
    setBulkAction
  };

  return (
    <InventoryContext.Provider value={inventoryValue}>
      <InventoryStatsContext.Provider value={statsValue}>
        <InventoryFiltersContext.Provider value={filtersValue}>
          <InventorySelectionContext.Provider value={selectionValue}>
            <InventoryModalsContext.Provider value={modalsValue}>
              {children}
            </InventoryModalsContext.Provider>
          </InventorySelectionContext.Provider>
        </InventoryFiltersContext.Provider>
      </InventoryStatsContext.Provider>
    </InventoryContext.Provider>
  );
};