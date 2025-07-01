import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import {
  useInventory,
  useInventoryFilters,
  useInventorySelection,
  useInventoryModals
} from '../../../context/InventoryContext';

// Updated interface to match backend response
interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  available: boolean;
  warehouseLocation: string;
  reserved: number;
  lastRestocked: string | null;
  
  // Product information (flat properties from backend)
  productName: string | null;
  productSku: string | null;
  productPrice?: number | null;
  productStatus?: string | null;
  
  // Stock information
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockStatus: string;
  availableQuantity: number;
  
  // Warehouse information
  warehouseCode?: string | null;
  warehouseName?: string | null;
  warehouseRegion?: string | null;
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

// Helper function to get stock status
const getStockStatus = (quantity: number, lowStockThreshold: number) => {
  if (quantity === 0) return { status: 'OUT_OF_STOCK', color: 'error' as const };
  if (quantity <= lowStockThreshold) return { status: 'LOW_STOCK', color: 'warning' as const };
  return { status: 'IN_STOCK', color: 'success' as const };
};

// Helper function to safely get product name
const getProductDisplayName = (item: InventoryItem): string => {
  return item.productName || item.productSku || `Product ${item.productId.substring(0, 8)}...`;
};

// Helper function to safely get product SKU
const getProductDisplaySku = (item: InventoryItem): string => {
  return item.productSku || 'NO-SKU';
};

export const InventoryTable1: React.FC = () => {
  const { loading, error, refreshing, handleRefresh } = useInventory();
  const { filteredAndSortedInventory } = useInventoryFilters();
  const { 
    selectedItems, 
    handleSelectAll, 
    handleSelectItem 
  } = useInventorySelection();
  const { 
    setEditingInventory, 
    setAdjustingInventory 
  } = useInventoryModals();

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm dark:border-white/[0.08] dark:bg-gray-900/40">
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
      <div className="overflow-hidden rounded-2xl border border-red-200/60 bg-white shadow-sm dark:border-red-500/20 dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-red-600 dark:text-red-400 font-medium">Error loading inventory</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={handleRefresh} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-gray-900/40">
      {/* Table Header */}
      <div className="px-6 py-5 border-b border-gray-200/60 dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredAndSortedInventory.length} products displayed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <svg 
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Live Data</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02]">
            <TableRow className="border-b border-gray-200/60 dark:border-white/[0.08]">
              <TableCell isHeader className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredAndSortedInventory.length && filteredAndSortedInventory.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Product
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Stock Status
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Quantity
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Warehouse
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Last Restocked
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-200/60 dark:divide-white/[0.08]">
            {filteredAndSortedInventory.map((item) => {
              const stockStatus = getStockStatus(item.quantity || 0, item.lowStockThreshold || 0);
              
              return (
                <TableRow 
                  key={item.id} 
                  className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150 ${
                    selectedItems.has(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <TableCell className="px-6 py-5">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
{item?.productName || item?.productSku || `Product ${item?.productId?.substring(0, 8)}...`}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        SKU: {item.productSku || 'NO-SKU'}
                      </p>
                      {/* Additional product info if available */}
                      {item.productPrice && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          ${item.productPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <Badge size="sm" color={stockStatus.color}>
                        {stockStatus.status.replace('_', ' ')}
                      </Badge>
                      {/* Enhanced status indicators */}
                      {item.isLowStock && !item.isOutOfStock && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Low Stock
                        </span>
                      )}
                      {!item.available && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.quantity.toLocaleString()}
                        </span>
                        {item.quantity <= (item.lowStockThreshold ?? 0) && item.quantity > 0 && (
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {item.quantity === 0 && (
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Threshold: {item.lowStockThreshold}
                      </div>
                      {/* Available quantity display */}
                      {item.availableQuantity !== item.quantity && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Available: {item.availableQuantity}
                        </div>
                      )}
                      {/* Reserved quantity display */}
                      {item.reserved > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          Reserved: {item.reserved}
                        </div>
                      )}
                      {/* Stock level progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-300 ${
                            item.quantity === 0 
                              ? 'bg-red-500' 
                              : item.quantity <= (item.lowStockThreshold ?? 0)
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((item.quantity / ((item.lowStockThreshold ?? 10) * 2)) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {item.warehouseLocation}
                        </span>
                        {/* Enhanced warehouse info */}
                        {item.warehouseRegion && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {item.warehouseRegion.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item?.lastRestocked ? formatDate(item.lastRestocked) : (
                        <span className="italic">Never restocked</span>
                      )}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAdjustingInventory({ ...item, lastUpdated: new Date().toISOString() })}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        title="Adjust stock quantity"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => setEditingInventory({ ...item, lastUpdated: new Date().toISOString() })}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        title="Edit inventory details"
                      >
                        Edit
                      </button>
                      {/* Quick restock button for low stock items */}
                      {item.isLowStock && !item.isOutOfStock && (
                        <button
                          onClick={() => {
                            // You can integrate with your restock functionality here
                            console.log('Quick restock for:', item.id);
                          }}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                          title="Quick restock"
                        >
                          Restock
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {filteredAndSortedInventory.length === 0 && !loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              No inventory found matching your criteria
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try adjusting your search or filter settings
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Footer with Statistics */}
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/[0.08]">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>In Stock: {filteredAndSortedInventory.filter(item => !item.isLowStock && !item.isOutOfStock).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Low Stock: {filteredAndSortedInventory.filter(item => item.isLowStock && !item.isOutOfStock).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Out of Stock: {filteredAndSortedInventory.filter(item => item.isOutOfStock).length}</span>
          </div>
          <div className="ml-auto">
            <span>Total Inventory Value: {filteredAndSortedInventory.reduce((sum, item) => {
              return sum + (item.quantity * (item.productPrice || 0));
            }, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};