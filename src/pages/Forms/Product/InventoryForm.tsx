import { useState, useEffect } from "react";
import { InventoryService, CreateInventoryRequest } from "../../../services/inventory.service";

interface Product {
  id: string;
  name: string;
  sku: string;
  status: string;
}

interface CreateInventoryFormProps {
  onInventoryCreated?: () => void;
  onClose?: () => void;
}

export default function CreateInventoryForm({ onInventoryCreated, onClose }: CreateInventoryFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateInventoryRequest>({
    productId: '',
    quantity: 0,
    lowStockThreshold: 10,
    warehouseLocation: ''
  });

  // Token management utilities (same as in inventory service)
  const getCookie = (name: string): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, ...cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue.join('=') || null;
      }
    }
    return null;
  };

  const getAuthToken = (): string | null => {
    let tokenFromCookie = getCookie('token') || getCookie('auth-token') || getCookie('userservice');
    
    if (tokenFromCookie) {
      tokenFromCookie = decodeURIComponent(tokenFromCookie);
      if (tokenFromCookie.startsWith('"') && tokenFromCookie.endsWith('"')) {
        tokenFromCookie = tokenFromCookie.slice(1, -1);
      }
      return tokenFromCookie;
    }
    
    try {
      const tokenFromStorage = localStorage.getItem('auth-token');
      return tokenFromStorage;
    } catch {
      return null;
    }
  };

  // Fetch products that might not have inventory yet
  const fetchProducts = async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${import.meta.env.VITE_API_GATEWAY_BASE_URL || 'http://localhost:8099/api'}/products/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await InventoryService.createInventory(formData);
      setSuccess('Inventory created successfully!');
      
      // Reset form
      setFormData({
        productId: '',
        quantity: 0,
        lowStockThreshold: 10,
        warehouseLocation: ''
      });

      // Call callback functions
      if (onInventoryCreated) {
        onInventoryCreated();
      }

      // Close form after a short delay to show success message
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateInventoryRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Create New Inventory Entry
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product *
          </label>
          <select
            value={formData.productId}
            onChange={(e) => handleInputChange('productId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Initial Quantity *
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Low Stock Threshold *
          </label>
          <input
            type="number"
            value={formData.lowStockThreshold}
            onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            min="0"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Alert when stock falls below this number
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warehouse Location *
          </label>
          <input
            type="text"
            value={formData.warehouseLocation}
            onChange={(e) => handleInputChange('warehouseLocation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Warehouse A, Section B-12"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Inventory'}
          </button>
        </div>
      </form>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleInputChange('lowStockThreshold', 5)}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Low threshold (5)
          </button>
          <button
            onClick={() => handleInputChange('lowStockThreshold', 20)}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            High threshold (20)
          </button>
          <button
            onClick={() => handleInputChange('warehouseLocation', 'Main Warehouse')}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Main Warehouse
          </button>
          <button
            onClick={() => handleInputChange('warehouseLocation', 'Storage Room A')}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Storage Room A
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal wrapper version for use in modals
interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInventoryCreated?: () => void;
}

export function CreateInventoryModal({ isOpen, onClose, onInventoryCreated }: CreateInventoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <CreateInventoryForm 
            onClose={onClose} 
            onInventoryCreated={onInventoryCreated}
          />
        </div>
      </div>
    </div>
  );
}