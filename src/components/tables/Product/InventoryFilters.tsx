import React from 'react';
import { useInventoryFilters, useInventorySelection, useInventoryModals } from '../../../context/InventoryContext';

export const InventoryFilters: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedInventory
  } = useInventoryFilters();

  const { selectedItems, clearSelection } = useInventorySelection();
  const { setShowCreateModal } = useInventoryModals();

  const exportInventory = () => {
    const csvContent = [
      ['Product Name', 'SKU', 'Quantity', 'Low Stock Threshold', 'Warehouse Location', 'Last Restocked'],
      ...filteredAndSortedInventory.map(item => [
        item.productName,
        item.productSku,
        item.quantity.toString(),
        item.lowStockThreshold?.toString(),
        item.warehouseLocation,
        item.lastRestocked || 'Never'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  const getSortDisplayName = (sort: string, order: string) => {
    const sortNames: { [key: string]: string } = {
      name: 'Name',
      quantity: 'Quantity',
      lastRestocked: 'Last Restocked'
    };
    
    const orderName = order === 'asc' ? 'A-Z' : 'Z-A';
    return `${sortNames[sort] || sort} ${orderName}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Main Filters Row */}
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
              placeholder="Search by product name, SKU, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'low_stock' | 'out_of_stock' | 'in_stock')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-32"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Sort Control */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'name' | 'quantity' | 'lastRestocked');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-40"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="quantity-asc">Quantity Low-High</option>
            <option value="quantity-desc">Quantity High-Low</option>
            <option value="lastRestocked-desc">Recently Restocked</option>
            <option value="lastRestocked-asc">Oldest Restocked</option>
          </select>

          {/* Action Buttons */}
          <button
            onClick={exportInventory}
            disabled={filteredAndSortedInventory.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export inventory data to CSV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Add new inventory item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Inventory
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || filterStatus !== 'all' || sortBy !== 'name' || sortOrder !== 'asc') && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
          
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              Search: "{searchTerm}"
              <button 
                onClick={() => setSearchTerm('')} 
                className="ml-1 hover:text-blue-600"
                aria-label="Remove search filter"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filterStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
              Status: {getStatusDisplayName(filterStatus)}
              <button 
                onClick={() => setFilterStatus('all')} 
                className="ml-1 hover:text-green-600"
                aria-label="Remove status filter"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {(sortBy !== 'name' || sortOrder !== 'asc') && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full">
              Sort: {getSortDisplayName(sortBy, sortOrder)}
              <button 
                onClick={() => { setSortBy('name'); setSortOrder('asc'); }} 
                className="ml-1 hover:text-purple-600"
                aria-label="Reset sort to default"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setSortBy('name');
              setSortOrder('asc');
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>
          Showing {filteredAndSortedInventory.length} result{filteredAndSortedInventory.length !== 1 ? 's' : ''}
          {(searchTerm || filterStatus !== 'all') && (
            <span className="ml-1">
              (filtered)
            </span>
          )}
        </span>
        
        {selectedItems.size > 0 && (
          <span className="text-blue-600 dark:text-blue-400">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            <button
              onClick={clearSelection}
              className="ml-2 text-xs underline hover:no-underline"
            >
              Clear selection
            </button>
          </span>
        )}
      </div>
    </div>
  );
};