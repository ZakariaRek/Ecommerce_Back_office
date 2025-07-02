// src/components/InventoryTable.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InventoryService, Inventory, InventoryError } from '../../../services/inventory.service';

// Stats Component
const InventoryStats: React.FC<{ inventory: Inventory[] }> = ({ inventory }) => {
  const stats = React.useMemo(() => {
    return {
      total: inventory.length,
      inStock: inventory.filter(item => !item.isLowStock && !item.isOutOfStock).length,
      lowStock: inventory.filter(item => item.isLowStock && !item.isOutOfStock).length,
      outOfStock: inventory.filter(item => item.isOutOfStock).length,
    };
  }, [inventory]);

  const statCards = [
    { title: 'Total Products', value: stats.total, color: 'blue', icon: '📦' },
    { title: 'In Stock', value: stats.inStock, color: 'green', icon: '✅' },
    { title: 'Low Stock', value: stats.lowStock, color: 'yellow', icon: '⚠️' },
    { title: 'Out of Stock', value: stats.outOfStock, color: 'red', icon: '❌' },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
      yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
      red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${getColorClasses(card.color)}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Message Component for both success and error messages
const MessageAlert: React.FC<{ 
  message: string; 
  type: 'success' | 'error' | 'warning'; 
  onClose: () => void 
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-200',
          icon: 'text-green-400'
        };
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-400'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-400'
        };
      default:
        return {
          container: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-blue-400'
        };
    }
  };

  const styles = getTypeStyles();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`mb-6 p-4 border rounded-lg ${styles.container}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={styles.icon}>
            {getIcon()}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm ${styles.text}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className={`${styles.icon} hover:opacity-75`}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Filters Component
const InventoryFilters: React.FC<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  selectedItems: Set<string>;
  onBulkDelete: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  selectedItems,
  onBulkDelete,
  onExport,
  onClearSelection
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by product name, SKU, or warehouse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {selectedItems.size > 0 && (
            <>
              <button
                onClick={onBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete ({selectedItems.size})
              </button>
              <button
                onClick={onClearSelection}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </>
          )}

          <button
            onClick={onExport}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            📄 Export CSV
          </button>

          <button
            onClick={() => navigate('/inventory/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Add Inventory
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal - Hidden as requested
const DeleteConfirmationModal: React.FC<{
  item: Inventory | null;
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}> = ({ item, show, onClose, onConfirm, loading }) => {
  // Modal is hidden as requested
  return null;
};

// Main Table Component
const MainInventoryTable: React.FC<{
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  selectedItems: Set<string>;
  onSelectItem: (id: string) => void;
  onSelectAll: () => void;
  onDeleteSuccess: (message: string) => void;
  onDeleteError: (message: string, type?: 'error' | 'warning') => void;
  isDeleteMode: boolean;
  onSetDeleteMode: (mode: boolean) => void;
}> = ({ 
  inventory, 
  loading, 
  error, 
  onRefresh, 
  selectedItems, 
  onSelectItem, 
  onSelectAll,
  onDeleteSuccess,
  onDeleteError,
  isDeleteMode,
  onSetDeleteMode
}) => {
  const navigate = useNavigate();
  const [deletingItem, setDeletingItem] = useState<Inventory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEdit = (item: Inventory) => {
    navigate(`/inventory/edit/${item.id}`);
  };

  const handleDeleteClick = async (item: Inventory) => {
    // Check if item has stock
    if (item.quantity > 0) {
      onDeleteError(
        `Cannot delete ${item.productName}: This inventory item has ${item.quantity} units remaining. You must transfer or reduce the stock to zero before deletion.`,
        'warning'
      );
      return;
    }

    // Set delete mode and blur other components
    onSetDeleteMode(true);
    setDeletingItem(item);
    setDeleteLoading(true);

    try {
      await InventoryService.deleteInventory(item.id);
      onDeleteSuccess(`Successfully deleted ${item.productName}`);
      onRefresh();
    } catch (error) {
      if (error instanceof InventoryError) {
        switch (error.type) {
          case 'CONFLICT':
            onDeleteError(
              `Cannot delete ${item.productName}: ${error.message}`,
              'warning'
            );
            break;
          case 'NOT_FOUND':
            onDeleteError(
              `${item.productName} was not found. It may have been already deleted.`,
              'warning'
            );
            break;
          default:
            onDeleteError(
              `Failed to delete ${item.productName}: ${error.message}`,
              'error'
            );
        }
      } else {
        onDeleteError(
          `Failed to delete ${item.productName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error'
        );
      }
    } finally {
      setDeleteLoading(false);
      setDeletingItem(null);
      onSetDeleteMode(false);
    }
  };

  const getStatusBadge = (item: Inventory) => {
    if (item.isOutOfStock) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Out of Stock</span>;
    }
    if (item.isLowStock) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">In Stock</span>;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
              <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">Error loading inventory</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
            <button 
              onClick={onRefresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isDeleteMode ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Inventory ({inventory.length})
            </h3>
            <button
              onClick={onRefresh}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              disabled={isDeleteMode}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === inventory.length && inventory.length > 0}
                    onChange={onSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={isDeleteMode}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => onSelectItem(item.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      disabled={isDeleteMode}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.productSku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(item)}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.quantity}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Threshold: {item.lowStockThreshold}
                      </div>
                      {item.reserved > 0 && (
                        <div className="text-sm text-orange-600 dark:text-orange-400">
                          Reserved: {item.reserved}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {item.warehouseLocation.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.lastUpdated)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        disabled={isDeleteMode}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                        disabled={isDeleteMode || deleteLoading}
                      >
                        {deleteLoading && deletingItem?.id === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {inventory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No inventory items found</p>
              <button
                onClick={() => navigate('/inventory/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isDeleteMode}
              >
                Add Your First Item
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Processing overlay */}
      {isDeleteMode && deleteLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-900 dark:text-white">
                Deleting {deletingItem?.productName}...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden modal as requested */}
      <DeleteConfirmationModal
        item={deletingItem}
        show={false}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {}}
        loading={deleteLoading}
      />
    </>
  );
};

// Main Component
const InventoryManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  // Load inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InventoryService.getAllInventory();
      setInventory(data);
    } catch (err) {
      if (err instanceof InventoryError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter inventory
  useEffect(() => {
    const filtered = inventory.filter(item => {
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

    setFilteredInventory(filtered);
    // Clear selection when filters change
    setSelectedItems(new Set());
  }, [inventory, searchTerm, filterStatus]);

  // Handle selection
  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredInventory.length && filteredInventory.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredInventory.map(item => item.id)));
    }
  };

  // Handle bulk delete with enhanced error handling
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0 || isDeleteMode) return;
    
    const selectedInventory = filteredInventory.filter(item => selectedItems.has(item.id));
    const itemsWithStock = selectedInventory.filter(item => item.quantity > 0);
    
    // Check if any selected items have stock
    if (itemsWithStock.length > 0) {
      const itemNames = itemsWithStock.map(item => item.productName).join(', ');
      setErrorMessage(
        `Cannot delete ${itemsWithStock.length} item(s) with remaining stock: ${itemNames}. Please transfer or reduce stock to zero first.`
      );
      setMessageType('warning');
      return;
    }

    if (confirm(`Delete ${selectedItems.size} selected items? This action cannot be undone.`)) {
      setIsDeleteMode(true);
      try {
        await InventoryService.bulkDelete(Array.from(selectedItems));
        setSelectedItems(new Set());
        setSuccessMessage(`Successfully deleted ${selectedItems.size} inventory items`);
        setMessageType('success');
        await fetchInventory();
      } catch (err) {
        if (err instanceof InventoryError) {
          setErrorMessage(`Bulk delete failed: ${err.message}`);
        } else {
          setErrorMessage(`Failed to delete items: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        setMessageType('error');
      } finally {
        setIsDeleteMode(false);
      }
    }
  };

  // Handle export
  const handleExport = () => {
    const csvData = [
      ['Product Name', 'SKU', 'Quantity', 'Low Stock Threshold', 'Warehouse', 'Status', 'Last Updated'],
      ...filteredInventory.map(item => [
        item.productName,
        item.productSku,
        item.quantity.toString(),
        item.lowStockThreshold.toString(),
        item.warehouseLocation,
        item.stockStatus.replace('_', ' '),
        item.lastUpdated
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

  // Message handlers
  const handleDeleteSuccess = (message: string) => {
    setSuccessMessage(message);
    setMessageType('success');
  };

  const handleDeleteError = (message: string, type: 'error' | 'warning' = 'error') => {
    setErrorMessage(message);
    setMessageType(type);
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Load data on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  // Show success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setMessageType('success');
      // Clear the state to prevent showing the message again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  return (
    <div className="space-y-6">
      {successMessage && messageType === 'success' && !isDeleteMode && (
        <MessageAlert 
          message={successMessage} 
          type="success"
          onClose={clearMessages} 
        />
      )}
      
      {errorMessage && !isDeleteMode && (
        <MessageAlert 
          message={errorMessage} 
          type={messageType}
          onClose={clearMessages} 
        />
      )}
      
      <div className={`transition-all duration-300 ${isDeleteMode ? 'blur-sm pointer-events-none' : ''}`}>
        <InventoryStats inventory={inventory} />
      </div>
      
      <div className={`transition-all duration-300 ${isDeleteMode ? 'blur-sm pointer-events-none' : ''}`}>
        <InventoryFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          selectedItems={selectedItems}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onClearSelection={() => setSelectedItems(new Set())}
        />
      </div>
      
      <MainInventoryTable
        inventory={filteredInventory}
        loading={loading}
        error={error}
        onRefresh={fetchInventory}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        onDeleteSuccess={handleDeleteSuccess}
        onDeleteError={handleDeleteError}
        isDeleteMode={isDeleteMode}
        onSetDeleteMode={setIsDeleteMode}
      />
    </div>
  );
};

export default InventoryManagement;