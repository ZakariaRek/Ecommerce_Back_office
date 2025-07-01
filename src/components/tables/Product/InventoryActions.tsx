import React from 'react';
import {  useInventoryModals, useInventorySelection } from '../../../context/InventoryContext';


export const InventoryActions: React.FC = () => {
  const { selectedItems, clearSelection } = useInventorySelection();
  const { 
    setBulkAction, 
    setShowBulkModal 
  } = useInventoryModals();
  // const { fetchInventory } = useInventory();

  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const handleBulkExport = () => {
    // This would export only selected items
    console.log('Exporting selected items:', Array.from(selectedItems));
    // Implementation would be similar to the main export but filtered to selected items
  };

  const handleBulkStockUpdate = () => {
    // This would open a modal to update stock for multiple items
    console.log('Bulk stock update for:', Array.from(selectedItems));
    // Implementation would show a modal with stock adjustment options
  };

  // Don't render if no items are selected
  if (selectedItems.size === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose an action to apply to selected items
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              title="Export selected items"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            <button
              onClick={handleBulkStockUpdate}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
              title="Update stock for selected items"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4z" />
              </svg>
              Update Stock
            </button>

            <button
              onClick={() => handleBulkAction('delete')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              title="Delete selected items"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* Clear Selection */}
          <button
            onClick={clearSelection}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Clear selection"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Advanced Bulk Actions (expandable section) */}
      <details className="mt-3">
        <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none">
          More actions...
        </summary>
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => handleBulkAction('updateThreshold')}
              className="flex items-center gap-2 px-3 py-2 text-xs text-left bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-colors dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Update Thresholds
            </button>

            <button
              onClick={() => handleBulkAction('moveWarehouse')}
              className="flex items-center gap-2 px-3 py-2 text-xs text-left bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Move Warehouse
            </button>

            <button
              onClick={() => handleBulkAction('generateReport')}
              className="flex items-center gap-2 px-3 py-2 text-xs text-left bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </button>

            <button
              onClick={() => handleBulkAction('archive')}
              className="flex items-center gap-2 px-3 py-2 text-xs text-left bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
              </svg>
              Archive Items
            </button>
          </div>
        </div>
      </details>
    </div>
  );
};

// Bulk Action Confirmation Modal
interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  selectedCount: number;
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  selectedCount 
}) => {
  if (!isOpen) return null;

  const getActionDetails = (action: string) => {
    const actionMap: Record<string, { title: string; description: string; color: string; icon: React.ReactElement }> = {
      delete: {
        title: 'Delete Items',
        description: 'This will permanently remove the selected inventory items and cannot be undone.',
        color: 'red',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )
      },
      updateThreshold: {
        title: 'Update Low Stock Thresholds',
        description: 'This will update the low stock threshold for all selected items.',
        color: 'yellow',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      },
      moveWarehouse: {
        title: 'Move to Different Warehouse',
        description: 'This will change the warehouse location for all selected items.',
        color: 'purple',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        )
      },
      archive: {
        title: 'Archive Items',
        description: 'This will move the selected items to the archive. They can be restored later.',
        color: 'gray',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
          </svg>
        )
      }
    };

    return actionMap[action] || actionMap.delete;
  };

  const actionDetails = getActionDetails(action);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            actionDetails.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
            actionDetails.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
            actionDetails.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {actionDetails.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {actionDetails.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {actionDetails.description}
        </p>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              actionDetails.color === 'red' ? 'bg-red-600 hover:bg-red-700 text-white' :
              actionDetails.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
              actionDetails.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
              'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            Confirm {actionDetails.title}
          </button>
        </div>
      </div>
    </div>
  );
};