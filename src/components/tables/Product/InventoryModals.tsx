import React, { useState, useEffect } from 'react';
import { Inventory, UpdateInventoryRequest } from '../../../services/inventory.service';
import { useInventory, useInventoryModals, useInventorySelection } from '../../../context/InventoryContext';

// Bulk Action Modal Component
interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  selectedCount: number;
}

const BulkActionModal: React.FC<BulkActionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  selectedCount 
}) => {
  if (!isOpen) return null;

  const getActionText = () => {
    switch (action) {
      case 'delete':
        return 'Delete';
      case 'export':
        return 'Export';
      case 'update':
        return 'Update';
      default:
        return 'Process';
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Bulk Action
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to {action} {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}?
          </p>
          {action === 'delete' && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">
              This action cannot be undone.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${getActionColor()}`}
          >
            {getActionText()}
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Inventory Modal
interface EditInventoryModalProps {
  inventory: Inventory | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateInventoryRequest) => void;
}

const EditInventoryModal: React.FC<EditInventoryModalProps> = ({ inventory, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    quantity: 0,
    lowStockThreshold: 0,
    warehouseLocation: ''
  });

  useEffect(() => {
    if (inventory) {
      setFormData({
        quantity: inventory.quantity,
        lowStockThreshold: inventory.lowStockThreshold!,
        warehouseLocation: inventory.warehouseLocation
      });
    }
  }, [inventory]);

  if (!isOpen || !inventory) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: inventory.id,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Inventory
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{inventory.productName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {inventory.productSku}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({...formData, lowStockThreshold: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Warehouse Location
            </label>
            <input
              type="text"
              value={formData.warehouseLocation}
              onChange={(e) => setFormData({...formData, warehouseLocation: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stock Adjustment Modal
interface StockAdjustmentModalProps {
  inventory: Inventory | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjust: (productId: string, adjustment: number) => void;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ inventory, isOpen, onClose, onAdjust }) => {
  const [adjustment, setAdjustment] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setAdjustment(0);
      setReason('');
      setAdjustmentType('add');
    }
  }, [isOpen]);

  if (!isOpen || !inventory) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAdjustment = adjustmentType === 'add' ? adjustment : -adjustment;
    onAdjust(inventory.productId, finalAdjustment);
  };

  const newQuantity = inventory.quantity + (adjustmentType === 'add' ? adjustment : -adjustment);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Adjust Stock
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{inventory.productName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Current Stock: <span className="font-medium text-gray-900 dark:text-white">{inventory.quantity}</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adjustment Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`flex-1 px-3 py-2 rounded-md border transition-colors ${
                  adjustmentType === 'add'
                    ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('subtract')}
                className={`flex-1 px-3 py-2 rounded-md border transition-colors ${
                  adjustmentType === 'subtract'
                    ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-400'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Remove Stock
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity to {adjustmentType === 'add' ? 'Add' : 'Remove'}
            </label>
            <input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min="1"
              max={adjustmentType === 'subtract' ? inventory.quantity : undefined}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason (Optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a reason...</option>
              <option value="restock">Restock</option>
              <option value="sold">Sold</option>
              <option value="damaged">Damaged/Lost</option>
              <option value="returned">Customer Return</option>
              <option value="transfer">Warehouse Transfer</option>
              <option value="audit">Inventory Audit</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className={`p-3 rounded-md ${
            newQuantity < 0 
              ? 'bg-red-50 dark:bg-red-900/30' 
              : newQuantity <= inventory.lowStockThreshold!
                ? 'bg-yellow-50 dark:bg-yellow-900/30' 
                : 'bg-blue-50 dark:bg-blue-900/30'
          }`}>
            <p className={`text-sm ${
              newQuantity < 0 
                ? 'text-red-700 dark:text-red-400' 
                : newQuantity <= inventory.lowStockThreshold! 
                  ? 'text-yellow-700 dark:text-yellow-400' 
                  : 'text-blue-700 dark:text-blue-400'
            }`}>
              New Stock: {Math.max(0, newQuantity)}
              {newQuantity < 0 && ' (Cannot be negative)'}
              {newQuantity <= inventory.lowStockThreshold! && newQuantity >= 0 && ' (Below threshold)'}
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={newQuantity < 0 || adjustment === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Inventory Modal (simplified version)
interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInventoryCreated: () => void;
}

const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onInventoryCreated
}) => {
  if (!isOpen) return null;

  const handleCreate = () => {
    // This would handle the actual creation logic
    onInventoryCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Inventory Entry
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This would contain your existing CreateInventoryForm component.
          </p>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Replace this placeholder with your actual form component that includes:
            </p>
            <ul className="text-sm text-gray-500 dark:text-gray-400 mt-2 list-disc list-inside">
              <li>Product selection</li>
              <li>Initial quantity</li>
              <li>Low stock threshold</li>
              <li>Warehouse location</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Entry
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Modals Container Component
export const InventoryModals: React.FC = () => {
  const {
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
  } = useInventoryModals();

  const { updateInventory, adjustStock, fetchInventory } = useInventory();
  const { selectedItems, clearSelection } = useInventorySelection();

  const handleUpdateInventory = async (data: UpdateInventoryRequest) => {
    try {
      await updateInventory(data);
    } catch (err) {
      console.error('Error updating inventory:', err);
    }
  };

  const handleStockAdjustment = async (productId: string, adjustment: number) => {
    try {
      await adjustStock(productId, adjustment);
    } catch (err) {
      console.error('Error adjusting stock:', err);
    }
  };

  const handleBulkConfirm = async () => {
    try {
      console.log(`Performing ${bulkAction} on items:`, Array.from(selectedItems));
      
      // Here you would implement the actual bulk operations
      // For example:
      // if (bulkAction === 'delete') {
      //   for (const itemId of selectedItems) {
      //     await InventoryService.deleteInventory(itemId);
      //   }
      // }
      
      clearSelection();
      setShowBulkModal(false);
      setBulkAction('');
      await fetchInventory();
    } catch (err) {
      console.error('Error performing bulk action:', err);
    }
  };

  return (
    <>
      {/* Edit Inventory Modal */}
      <EditInventoryModal
        inventory={editingInventory}
        isOpen={!!editingInventory}
        onClose={() => setEditingInventory(null)}
        onSave={handleUpdateInventory}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        inventory={adjustingInventory}
        isOpen={!!adjustingInventory}
        onClose={() => setAdjustingInventory(null)}
        onAdjust={handleStockAdjustment}
      />

      {/* Create Inventory Modal */}
      <CreateInventoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onInventoryCreated={fetchInventory}
      />

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkConfirm}
        action={bulkAction}
        selectedCount={selectedItems.size}
      />
    </>
  );
};