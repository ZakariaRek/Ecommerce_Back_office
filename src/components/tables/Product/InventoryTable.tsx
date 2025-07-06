import { useState, useEffect } from "react";
import { InventoryService, Inventory, InventoryError, CreateInventoryRequest, UpdateInventoryRequest } from "../../../services/inventory.service";
import { ProductService, ProductResponseDTO } from "../../../services/Product.service";

// Modern styles with orange theme
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #f97316, #ea580c);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #ea580c, #dc2626);
  }
  .floating-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
  }
  .dark .floating-card {
    background: linear-gradient(145deg, #1f2937, #111827);
    box-shadow: 20px 20px 60px #0f172a, -20px -20px 60px #374151;
  }
  .glass-effect {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .dark .glass-effect {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .inventory-gradient {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%);
  }
  .stock-gradient {
    background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(3deg); }
  }
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out;
  }
  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
  @keyframes slide-out-right {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
  .animate-slide-out-right {
    animation: slide-out-right 0.3s ease-out;
  }
`;

// Toast notification component
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-[20%] h-full ">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 animate-slide-in-right ${
            toast.type === 'success' ? 'border-l-4 border-green-500' :
            toast.type === 'error' ? 'border-l-4 border-red-500' :
            toast.type === 'warning' ? 'border-l-4 border-yellow-500' :
            'border-l-4 border-blue-500'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === 'success' && (
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{toast.title}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{toast.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => removeToast(toast.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const getStockStatus = (quantity: number, lowThreshold: number) => {
  if (quantity === 0) {
    return { 
      label: 'Out of Stock', 
      color: 'bg-red-500', 
      variant: 'error' as const,
      icon: '❌'
    };
  } else if (quantity <= lowThreshold) {
    return { 
      label: 'Low Stock', 
      color: 'bg-yellow-500', 
      variant: 'warning' as const,
      icon: '⚠️'
    };
  } else {
    return { 
      label: 'In Stock', 
      color: 'bg-green-500', 
      variant: 'success' as const,
      icon: '✅'
    };
  }
};

const getWarehouseDisplayName = (location: string): string => {
  return location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Badge component
const Badge = ({ 
  children, 
  variant = 'default',
  size = 'sm' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'orange';
  size?: 'sm' | 'md';
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

export default function InventoryList() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<ProductResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form states
  const [editForm, setEditForm] = useState<UpdateInventoryRequest>({
    id: '',
    productId: '',
    quantity: 0,
    lowStockThreshold: 0,
    warehouseLocation: '',
    reserved: 0
  });

  const [createForm, setCreateForm] = useState<CreateInventoryRequest>({
    productId: '',
    quantity: 0,
    available: true,
    lowStockThreshold: 10,
    warehouseLocation: 'MAIN_WAREHOUSE',
    reserved: 0
  });

  const [stockAdjustForm, setStockAdjustForm] = useState({
    adjustment: 0,
    operation: 'add' as 'add' | 'subtract' | 'set',
    reason: ''
  });

  // Warehouse options
  const warehouseOptions = [
    'MAIN_WAREHOUSE',
    'SECONDARY_WAREHOUSE',
    'DISTRIBUTION_CENTER',
    'RETAIL_STORE',
    'ONLINE_FULFILLMENT'
  ];

  // Toast functions
  const addToast = (type: Toast['type'], title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = modernStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await InventoryService.getAllInventory();
      setInventory(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast('error', 'Error', `Failed to fetch inventory: ${errorMessage}`);
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await ProductService.getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      addToast('error', 'Error', 'Failed to fetch products for selection');
    }
  };

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStockFilter('all');
    setWarehouseFilter('all');
    setShowAdvancedFilters(false);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || stockFilter !== 'all' || warehouseFilter !== 'all';

  const filteredInventory = inventory.filter(item => {
    // Add null checks for all properties that might be null or undefined
    const matchesSearch = searchTerm === '' || (
      (item.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.productSku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (getWarehouseDisplayName(item.warehouseLocation || '')?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'in_stock' && !item.isLowStock && !item.isOutOfStock) ||
                        (stockFilter === 'low_stock' && item.isLowStock && !item.isOutOfStock) ||
                        (stockFilter === 'out_of_stock' && item.isOutOfStock);
    
    const matchesWarehouse = warehouseFilter === 'all' || item.warehouseLocation === warehouseFilter;
    
    return matchesSearch && matchesStock && matchesWarehouse;
  });

  // Get available products for inventory creation (products that don't have inventory yet)
  const availableProducts = products.filter(product => 
    !inventory.some(inv => inv.productId === product.id)
  );

  // Inventory statistics
  const stats = {
    total: inventory.length,
    inStock: inventory.filter(item => !item.isLowStock && !item.isOutOfStock).length,
    lowStock: inventory.filter(item => item.isLowStock && !item.isOutOfStock).length,
    outOfStock: inventory.filter(item => item.isOutOfStock).length,
    totalValue: inventory.reduce((sum, item) => sum + (item.quantity * 50), 0), // Assume avg price of $50
    totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0)
  };

  // Inventory actions
  const handleInventoryClick = (item: Inventory) => {
    setSelectedInventory(item);
    setShowDetailModal(true);
  };

  const handleEdit = (e: React.MouseEvent, item: Inventory) => {
    e.stopPropagation();
    setEditingInventory(item);
    setEditForm({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
      warehouseLocation: item.warehouseLocation,
      reserved: item.reserved
    });
    setShowEditModal(true);
  };

  const handleStockAdjust = (e: React.MouseEvent, item: Inventory) => {
    e.stopPropagation();
    setSelectedInventory(item);
    setStockAdjustForm({
      adjustment: 0,
      operation: 'add',
      reason: ''
    });
    setShowStockAdjustModal(true);
  };

  const handleUpdateInventory = async () => {
    if (!editingInventory) return;

    setIsUpdating(true);

    try {
      const updatedInventory = await InventoryService.updateInventory(editForm, editingInventory.productId);
      
      setInventory(prev => prev.map(item => 
        item.id === editingInventory.id ? updatedInventory : item
      ));

      setShowEditModal(false);
      setEditingInventory(null);
      addToast('success', 'Success', 'Inventory updated successfully!');

    } catch (error) {
      console.error('Error updating inventory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addToast('error', 'Update Failed', `Failed to update inventory: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedInventory) return;

    setIsAdjustingStock(true);

    try {
      let newQuantity = selectedInventory.quantity;
      
      switch (stockAdjustForm.operation) {
        case 'add':
          newQuantity += stockAdjustForm.adjustment;
          break;
        case 'subtract':
          newQuantity = Math.max(0, newQuantity - stockAdjustForm.adjustment);
          break;
        case 'set':
          newQuantity = Math.max(0, stockAdjustForm.adjustment);
          break;
      }

      const updateData: UpdateInventoryRequest = {
        id: selectedInventory.id,
        productId: selectedInventory.productId,
        quantity: newQuantity,
        lowStockThreshold: selectedInventory.lowStockThreshold,
        warehouseLocation: selectedInventory.warehouseLocation,
        reserved: selectedInventory.reserved
      };

      const updatedInventory = await InventoryService.updateInventory(updateData, selectedInventory.productId);
      
      setInventory(prev => prev.map(item => 
        item.id === selectedInventory.id ? updatedInventory : item
      ));

      setShowStockAdjustModal(false);
      setSelectedInventory(null);
      
      const operationText = stockAdjustForm.operation === 'add' ? 'increased' : 
                           stockAdjustForm.operation === 'subtract' ? 'decreased' : 'set';
      addToast('success', 'Stock Updated', `Stock ${operationText} successfully!`);

    } catch (error) {
      console.error('Error adjusting stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addToast('error', 'Adjustment Failed', `Failed to adjust stock: ${errorMessage}`);
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const handleCreateInventory = async () => {
    if (!createForm.productId) {
      addToast('warning', 'Missing Product', 'Please select a product');
      return;
    }

    setIsCreating(true);

    try {
      const newInventory = await InventoryService.createInventory(createForm);
      
      setInventory(prev => [...prev, newInventory]);
      setShowCreateModal(false);
      setCreateForm({
        productId: '',
        quantity: 0,
        available: true,
        lowStockThreshold: 10,
        warehouseLocation: 'MAIN_WAREHOUSE',
        reserved: 0
      });
      addToast('success', 'Success', 'Inventory created successfully!');

    } catch (error) {
      console.error('Error creating inventory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof InventoryError && error.type === 'CONFLICT') {
        addToast('warning', 'Already Exists', 'Inventory for this product already exists');
      } else {
        addToast('error', 'Creation Failed', `Failed to create inventory: ${errorMessage}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: Inventory) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete inventory for "${item.productName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(item.id);
    
    try {
      await InventoryService.deleteInventory(item.productId);

      setInventory(prev => prev.filter(i => i.id !== item.id));
      addToast('success', 'Deleted', 'Inventory deleted successfully!');
    } catch (error) {
      console.error('Error deleting inventory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addToast('error', 'Delete Failed', `Failed to delete inventory: ${errorMessage}`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Modal close handlers
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedInventory(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingInventory(null);
  };

  const closeStockAdjustModal = () => {
    setShowStockAdjustModal(false);
    setSelectedInventory(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({
      productId: '',
      quantity: 0,
      available: true,
      lowStockThreshold: 10,
      warehouseLocation: 'MAIN_WAREHOUSE',
      reserved: 0
    });
  };

  // Get selected product info for create form
  const selectedProduct = products.find(p => p.id === createForm.productId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="inventory-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Inventory Management</h1>
                <p className="text-xl text-white/80">Loading your inventory data...</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Loading inventory...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 relative overflow-hidden">
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Error Loading Inventory</h1>
                <p className="text-xl text-white/80">Something went wrong while fetching data</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-6 text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Failed to Load Inventory</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="max-w-7xl mx-auto">
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl animate-fade-in-up">
          {/* Header Section */}
          <div className="inventory-gradient text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '3s'}}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h1 className="text-4xl font-bold">Inventory Management</h1>
                  </div>
                  <p className="text-xl text-white/80">Monitor and manage your stock levels</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">{stats.total} Items</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">{stats.totalQuantity} Total Units</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-4 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Total Items</p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
                    📦
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">In Stock</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.inStock}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white text-lg">
                    ✅
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Low Stock</p>
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.lowStock}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-white text-lg">
                    ⚠️
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-1">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">{stats.outOfStock}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white text-lg">
                    ❌
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Units</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.totalQuantity.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white text-lg">
                    📊
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Est. Value</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{formatCurrency(stats.totalValue)}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white text-lg">
                    💰
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              {/* Main Filters Row */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by product name, SKU, or warehouse..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                  
                  <select
                    value={warehouseFilter}
                    onChange={(e) => setWarehouseFilter(e.target.value)}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    <option value="all">All Warehouses</option>
                    {warehouseOptions.map(warehouse => (
                      <option key={warehouse} value={warehouse}>
                        {getWarehouseDisplayName(warehouse)}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
                  </button>
                  
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowCreateModal(true)}
                    disabled={availableProducts.length === 0}
                    className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                    title={availableProducts.length === 0 ? "All products already have inventory" : "Add new inventory"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Inventory
                  </button>
                  
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                      {filteredInventory.length} of {inventory.length}
                    </span>
                    {hasActiveFilters && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="p-6">
            {filteredInventory.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    {hasActiveFilters ? (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {hasActiveFilters ? 'No inventory matches your filters' : 'No inventory found'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {hasActiveFilters 
                      ? 'Try adjusting your search criteria or clearing some filters' 
                      : 'Start by adding your first inventory item'}
                  </p>
                  {hasActiveFilters ? (
                    <button
                      onClick={clearAllFilters}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      Clear All Filters
                    </button>
                  ) : (
                    availableProducts.length > 0 && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                      >
                        Add First Inventory Item
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item.quantity, item.lowStockThreshold);
                  
                  return (
                    <div 
                      key={item.id} 
                      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                      onClick={() => handleInventoryClick(item)}
                    >
                      {/* Header */}
                      <div className="relative h-32 bg-gradient-to-br from-orange-400 to-red-500">
                        {/* Action Buttons */}
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleEdit(e, item)}
                              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                              title="Edit inventory"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleStockAdjust(e, item)}
                              className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                              title="Adjust stock"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, item)}
                              disabled={isDeleting === item.id}
                              className="w-8 h-8 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                              title="Delete inventory"
                            >
                              {isDeleting === item.id ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Stock Status Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.icon} {stockStatus.label}
                          </Badge>
                        </div>

                        {/* Quantity Display */}
                        <div className="absolute bottom-3 left-3">
                          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-3 py-1">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {item.quantity} units
                            </span>
                          </div>
                        </div>

                        {/* Reserved Badge */}
                        {item.reserved > 0 && (
                          <div className="absolute bottom-3 right-3">
                            <div className="bg-yellow-500 text-white text-xs font-bold rounded-full px-2 py-1">
                              {item.reserved} reserved
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1">
                            {item.productName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            SKU: {item.productSku}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {/* Warehouse and Thresholds */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Warehouse</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {getWarehouseDisplayName(item.warehouseLocation)}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Low Stock Alert</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.lowStockThreshold} units
                              </span>
                            </div>
                          </div>

                          {/* Available vs Reserved */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                {item.availableQuantity || (item.quantity - item.reserved)}
                              </span>
                            </div>
                            {item.reserved > 0 && (
                              <div className="flex flex-col text-right">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Reserved</span>
                                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                  {item.reserved}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Last Updated */}
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Updated: {formatDate(item.lastUpdated)}</span>
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ID: {item.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showStockAdjustModal && selectedInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="stock-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Adjust Stock</h2>
                    <p className="text-white/80">Update stock for {selectedInventory.productName}</p>
                  </div>
                  <button
                    onClick={closeStockAdjustModal}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                {/* Current Stock Display */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current Stock</span>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedInventory.quantity} units</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {selectedInventory.availableQuantity || (selectedInventory.quantity - selectedInventory.reserved)} units
                      </p>
                    </div>
                  </div>
                </div>

                {/* Operation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Operation Type *
                  </label>
                  <select
                    value={stockAdjustForm.operation}
                    onChange={(e) => setStockAdjustForm(prev => ({ ...prev, operation: e.target.value as 'add' | 'subtract' | 'set' }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="add">Add Stock (+)</option>
                    <option value="subtract">Remove Stock (-)</option>
                    <option value="set">Set Exact Amount (=)</option>
                  </select>
                </div>

                {/* Adjustment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {stockAdjustForm.operation === 'set' ? 'New Stock Amount *' : 'Adjustment Amount *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockAdjustForm.adjustment}
                    onChange={(e) => setStockAdjustForm(prev => ({ ...prev, adjustment: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    placeholder="Enter amount"
                  />
                  {stockAdjustForm.operation !== 'set' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stockAdjustForm.operation === 'add' 
                        ? `New stock will be: ${selectedInventory.quantity + stockAdjustForm.adjustment}` 
                        : `New stock will be: ${Math.max(0, selectedInventory.quantity - stockAdjustForm.adjustment)}`}
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={stockAdjustForm.reason}
                    onChange={(e) => setStockAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    placeholder="Enter reason for stock adjustment..."
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeStockAdjustModal}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStockAdjustment}
                    disabled={isAdjustingStock || stockAdjustForm.adjustment < 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isAdjustingStock ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {stockAdjustForm.operation === 'add' ? 'Add Stock' : 
                         stockAdjustForm.operation === 'subtract' ? 'Remove Stock' : 'Set Stock'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Inventory Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="inventory-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Create Inventory</h2>
                    <p className="text-white/80">Add inventory for an existing product</p>
                  </div>
                  <button
                    onClick={closeCreateModal}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Product *
                  </label>
                  <select
                    required
                    value={createForm.productId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="">Choose a product...</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                  {availableProducts.length === 0 && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                      All products already have inventory. Create a new product first to add inventory.
                    </p>
                  )}
                </div>

                {/* Selected Product Info */}
                {selectedProduct && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Selected Product</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">Name:</span>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{selectedProduct.name}</p>
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">SKU:</span>
                        <p className="font-mono text-blue-800 dark:text-blue-200">{selectedProduct.sku}</p>
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">Price:</span>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{formatCurrency(selectedProduct.price)}</p>
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">Status:</span>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{selectedProduct.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Initial Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={createForm.quantity}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Low Stock Threshold *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={createForm.lowStockThreshold}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Warehouse Location *
                    </label>
                    <select
                      value={createForm.warehouseLocation}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, warehouseLocation: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    >
                      {warehouseOptions.map(warehouse => (
                        <option key={warehouse} value={warehouse}>
                          {getWarehouseDisplayName(warehouse)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reserved Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={createForm.quantity}
                      value={createForm.reserved}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, reserved: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateInventory}
                    disabled={isCreating || !createForm.productId || availableProducts.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-orange-300 disabled:to-red-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Create Inventory
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {showEditModal && editingInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Edit Inventory</h2>
                    <p className="text-white/80">Update inventory information</p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product ID
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editForm.productId}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Warehouse Location *
                    </label>
                    <select
                      value={editForm.warehouseLocation}
                      onChange={(e) => setEditForm(prev => ({ ...prev, warehouseLocation: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    >
                      {warehouseOptions.map(warehouse => (
                        <option key={warehouse} value={warehouse}>
                          {getWarehouseDisplayName(warehouse)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Low Stock Threshold *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editForm.lowStockThreshold}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reserved Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editForm.quantity}
                    value={editForm.reserved}
                    onChange={(e) => setEditForm(prev => ({ ...prev, reserved: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateInventory}
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Update Inventory
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="inventory-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{selectedInventory.productName}</h2>
                    <p className="text-white/80">Inventory Details & Stock Information</p>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                {/* Stock Overview */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    Stock Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="font-semibold text-orange-700 dark:text-orange-300">Total Stock:</span>
                      <p className="text-2xl font-bold text-orange-800 dark:text-orange-200 mt-1">{selectedInventory.quantity}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-orange-700 dark:text-orange-300">Available:</span>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {selectedInventory.availableQuantity || (selectedInventory.quantity - selectedInventory.reserved)}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-orange-700 dark:text-orange-300">Reserved:</span>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{selectedInventory.reserved}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant={getStockStatus(selectedInventory.quantity, selectedInventory.lowStockThreshold).variant} size="md">
                      {getStockStatus(selectedInventory.quantity, selectedInventory.lowStockThreshold).icon} {getStockStatus(selectedInventory.quantity, selectedInventory.lowStockThreshold).label}
                    </Badge>
                  </div>
                </div>

                {/* Product Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Product Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">Product Name:</span>
                      <p className="text-blue-800 dark:text-blue-200 mt-1">{selectedInventory.productName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">SKU:</span>
                      <p className="text-blue-800 dark:text-blue-200 mt-1 font-mono">{selectedInventory.productSku}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">Product ID:</span>
                      <p className="text-blue-800 dark:text-blue-200 mt-1 font-mono text-sm">{selectedInventory.productId}</p>
                    </div>
                  </div>
                </div>

              {/* Warehouse & Settings */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    Warehouse & Settings
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">Warehouse:</span>
                      <p className="text-purple-800 dark:text-purple-200 mt-1">{getWarehouseDisplayName(selectedInventory.warehouseLocation)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">Low Stock Threshold:</span>
                      <p className="text-purple-800 dark:text-purple-200 mt-1">{selectedInventory.lowStockThreshold} units</p>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">Stock Status:</span>
                      <p className="text-purple-800 dark:text-purple-200 mt-1">{selectedInventory.stockStatus?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Timeline
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Last Updated:</span>
                      <p className="text-gray-800 dark:text-gray-200 mt-1">{formatDate(selectedInventory.lastUpdated)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Inventory ID:</span>
                      <p className="text-gray-800 dark:text-gray-200 mt-1 font-mono text-sm">{selectedInventory.id}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDetailModal();
                      handleEdit(e, selectedInventory);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDetailModal();
                      handleStockAdjust(e, selectedInventory);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Adjust Stock
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDetailModal();
                      handleDelete(e, selectedInventory);
                    }}
                    disabled={isDeleting === selectedInventory.id}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {isDeleting === selectedInventory.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}