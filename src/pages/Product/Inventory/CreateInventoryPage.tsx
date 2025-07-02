// src/pages/Inventory/CreateInventoryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { ProductService, ProductOption } from '../../services/product.service';
import { InventoryService, CreateInventoryRequest } from '../../../services/inventory.service';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import { ProductService, ProductOption } from '../../../services/Product.service';
const CreateInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<CreateInventoryRequest>({
    productId: '',
    quantity: 0,
    available : true ,
    lowStockThreshold: 10,
    warehouseLocation: 'MAIN_WAREHOUSE',
    reserved: 0,
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

  // Warehouse options
  const warehouseOptions = [
    { value: 'MAIN_WAREHOUSE', label: 'Main Warehouse' },
    { value: 'SECONDARY_WAREHOUSE', label: 'Secondary Warehouse' },
    { value: 'DISTRIBUTION_CENTER', label: 'Distribution Center' },
    { value: 'RETAIL_STORE', label: 'Retail Store' },
  ];

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError(null);
        const productOptions = await ProductService.getProductNOOptions();
        // console.log(productOptions);
        setProducts(productOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Handle product selection
  const handleProductChange = (productId: string) => {
    const selected = products.find(p => p.value === productId);
    setSelectedProduct(selected || null);
    setFormData(prev => ({ ...prev, productId }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId) {
      setError('Please select a product');
      return;
    }

    setLoading(true);
    setError(null);

    console.log(formData);

    try {
      await InventoryService.createInventory(formData);
      navigate('/inventory', { 
        state: { message: 'Inventory item created successfully!' }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inventory');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (field: keyof CreateInventoryRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          
          {/* Breadcrumb */}
          <PageBreadcrumb pageTitle="Add New Inventory" />

        </div>

        {/* Main Content */}
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
              {/* Product Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                {loadingProducts ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Loading products...</span>
                    </div>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a product...</option>
                    {products.map((product) => (
                      <option key={product.value} value={product.value}>
                        {product.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Selected Product Info */}
                {selectedProduct && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          Selected Product Details
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          SKU: {selectedProduct.sku}
                        </p>
                        {selectedProduct.price && (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Price: ${selectedProduct.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter initial quantity"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  The initial stock quantity for this product
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
                  placeholder="Enter low stock threshold"
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
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select the warehouse where this inventory will be stored
                </p>
              </div>

              {/* Reserved Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reserved Quantity (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.quantity}
                  value={formData.reserved || 0}
                  onChange={(e) => handleInputChange('reserved', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter reserved quantity"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Quantity reserved for pending orders
                </p>
              </div>
            </div>

            {/* Stock Status Preview */}
            {formData.quantity > 0 && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Stock Status Preview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Quantity:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {formData.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Available:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {formData.quantity - (formData.reserved || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      formData.quantity === 0 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : formData.quantity <= formData.lowStockThreshold
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {formData.quantity === 0 
                        ? 'Out of Stock'
                        : formData.quantity <= formData.lowStockThreshold
                          ? 'Low Stock'
                          : 'In Stock'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                disabled={loading || loadingProducts || !formData.productId}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Inventory'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInventoryPage;