// src/pages/Inventory/EditInventoryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InventoryService, UpdateInventoryRequest, Inventory } from '../../../services/inventory.service';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import { ProductService, ProductOption } from '../../../services/Product.service';


const EditInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState<UpdateInventoryRequest>({
    id: '',
    productId : id || '',
    quantity: 0,
    lowStockThreshold: 10,
    warehouseLocation: 'MAIN_WAREHOUSE',
    reserved: 0,
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Warehouse options
  const warehouseOptions = [
    { value: 'MAIN_WAREHOUSE', label: 'Main Warehouse' },
    { value: 'SECONDARY_WAREHOUSE', label: 'Secondary Warehouse' },
    { value: 'DISTRIBUTION_CENTER', label: 'Distribution Center' },
    { value: 'RETAIL_STORE', label: 'Retail Store' },
  ];

  // Load inventory item on component mount
  useEffect(() => {
    const loadInventory = async () => {
      if (!id) {
        setError('No inventory ID provided');
        setLoadingInventory(false);
        return;
      }

      try {
        setLoadingInventory(true);
        setError(null);
        const inventoryItem = await InventoryService.getInventoryById(id);
        console.log(inventoryItem);
        setInventory(inventoryItem);
        setFormData({
          id : inventoryItem.id,
          productId: inventoryItem.productId,
          quantity: inventoryItem.quantity,
          lowStockThreshold: inventoryItem.lowStockThreshold,
          warehouseLocation: inventoryItem.warehouseLocation,
          reserved: inventoryItem.reserved,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory item');
      } finally {
        setLoadingInventory(false);
      }
    };

    loadInventory();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      await InventoryService.updateInventory(formData, formData.id);
      navigate('/inventory', { 
        state: { message: 'Inventory item updated successfully!' }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (field: keyof UpdateInventoryRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle stock adjustment
  const handleStockAdjustment = async (adjustment: number, reason?: string) => {
    if (!inventory) return;
    
    try {
      setLoading(true);
      const updatedInventory = await InventoryService.adjustStock(inventory.id, adjustment, reason);
      setInventory(updatedInventory);
      setFormData(prev => ({ ...prev, quantity: updatedInventory.quantity }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loadingInventory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading inventory item...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !inventory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">Error loading inventory item</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
                <button 
                  onClick={() => navigate('/inventory')}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
       
        <div className="mb-8">
          
          {/* Breadcrumb */}
          <PageBreadcrumb pageTitle={`Edit Inventory ${inventory?.productName}`} />

        </div>
        {/* Product Information Card */}
        {inventory && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Product Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Product Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {inventory.productName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    SKU
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white font-mono">
                    {inventory.productSku}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Current Status
                  </label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    inventory.isOutOfStock
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : inventory.isLowStock
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {inventory.stockStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Inventory Details
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Available: {(formData.quantity || 0) - (formData.reserved || 0)} units
                </p>
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Low Stock Threshold <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Alert when stock falls below this level
                </p>
              </div>

              {/* Warehouse Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Warehouse Location <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.warehouseLocation}
                  onChange={(e) => handleInputChange('warehouseLocation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {warehouseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reserved Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reserved Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.quantity}
                  value={formData.reserved || 0}
                  onChange={(e) => handleInputChange('reserved', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Quantity reserved for pending orders
                </p>
              </div>
            </div>

            {/* Quick Stock Adjustment */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Quick Stock Adjustment
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStockAdjustment(10)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleStockAdjustment(5)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => handleStockAdjustment(1)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleStockAdjustment(-1)}
                  disabled={(formData.quantity || 0) <= 1}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => handleStockAdjustment(-5)}
                  disabled={(formData.quantity || 0) <= 5}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleStockAdjustment(-10)}
                  disabled={(formData.quantity || 0) <= 10}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  -10
                </button>
              </div>
            </div>

            {/* Stock Status Preview */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Updated Stock Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Quantity:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {formData.quantity || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Available:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {(formData.quantity || 0) - (formData.reserved || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    (formData.quantity || 0) === 0 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : (formData.quantity || 0) <= (formData.lowStockThreshold || 0)
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {(formData.quantity || 0) === 0 
                      ? 'Out of Stock'
                      : (formData.quantity || 0) <= (formData.lowStockThreshold || 0)
                        ? 'Low Stock'
                        : 'In Stock'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Inventory'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditInventoryPage;