import { useState, useEffect } from "react";
import { 
  DiscountService, 
  DiscountType, 
  DiscountRequestDTO, 
  DiscountSummaryDTO, 
  PricingResponseDTO 
} from "../../../services/Discount.service"
import { ProductService,ProductRequestDTO,ProductResponseDTO,ProductStatus } from "../../../services/Product.service";
import { Product_Service_URL } from "../../../lib/apiEndPoints";

// Helper function to construct image UR
const getImageUrl = (imagePath: string): string => {
  // Get server base URL: "http://localhost:8099"
  const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
  
  if (imagePath.startsWith('/api/')) {
    // For "/api/products/images/file.png"
    // Result: "http://localhost:8099" + "/api/products/images/file.png"
    // = "http://localhost:8099/api/products/images/file.png" ✅
    return `${serverBaseUrl}${imagePath}`;
  }
};

// Use ProductResponseDTO from service instead of local interface
type Product = ProductResponseDTO;

// Modern styles (same as before)
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3b82f6, #1d4ed8);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #1d4ed8, #1e40af);
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
  .product-gradient {
    background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #8b5cf6 100%);
  }
  .discount-gradient {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);
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
`;

// Helper functions
const formatCurrency = ProductService.formatCurrency;
const formatDate = ProductService.formatDate;
const getStockStatus = ProductService.getStockStatus;

// Badge component
const Badge = ({ 
  children, 
  variant = 'default',
  size = 'sm' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'discount';
  size?: 'sm' | 'md';
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    discount: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
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

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [discountFilter, setDiscountFilter] = useState<string>('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<string>('all');
  const [minDiscountValue, setMinDiscountValue] = useState<string>('');
  const [maxDiscountValue, setMaxDiscountValue] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDiscountListModal, setShowDiscountListModal] = useState(false);
  const [showEditDiscountModal, setShowEditDiscountModal] = useState(false); // New state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [replaceImages, setReplaceImages] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  
  // Discount states
  const [productDiscounts, setProductDiscounts] = useState<Record<string, DiscountSummaryDTO[]>>({});
  const [productPricing, setProductPricing] = useState<Record<string, PricingResponseDTO>>({});
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<Product | null>(null);
  const [loadingDiscounts, setLoadingDiscounts] = useState<Record<string, boolean>>({});
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);
  const [isUpdatingDiscount, setIsUpdatingDiscount] = useState(false); // New state
  const [editingDiscount, setEditingDiscount] = useState<DiscountSummaryDTO | null>(null); // New state

  // Edit form state
  const [editForm, setEditForm] = useState<ProductRequestDTO>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    weight: 0,
    dimensions: '',
    status: ProductStatus.ACTIVE,
    images: []
  });

  // Discount form state
  const [discountForm, setDiscountForm] = useState<DiscountRequestDTO>({
    discountType: DiscountType.PERCENTAGE,
    discountValue: 0,
    startDate: new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16), // 5 minutes in the future
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString().slice(0, 16), // 30 days + 5 minutes
    minPurchaseAmount: undefined,
    maxDiscountAmount: undefined
  });

  // Edit discount form state (New)
  const [editDiscountForm, setEditDiscountForm] = useState<DiscountRequestDTO>({
    discountType: DiscountType.PERCENTAGE,
    discountValue: 0,
    startDate: new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    minPurchaseAmount: undefined,
    maxDiscountAmount: undefined
  });

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
    fetchProducts();
  }, []);

  // Fetch products with pricing and discounts
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ProductService.getAllProducts();
      setProducts(data);
      
      // Fetch discounts and pricing for each product
      await Promise.all(data.map((product: Product) => fetchProductDiscountsAndPricing(product.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch discounts and pricing for a specific product
  const fetchProductDiscountsAndPricing = async (productId: string) => {
    try {
      setLoadingDiscounts(prev => ({ ...prev, [productId]: true }));
      
      const [discounts, pricing] = await Promise.all([
        DiscountService.getDiscountsByProductId(productId),
        DiscountService.calculatePricing(productId).catch(() => null)
      ]);

      setProductDiscounts(prev => ({ ...prev, [productId]: discounts }));
      if (pricing) {
        setProductPricing(prev => ({ ...prev, [productId]: pricing }));
      }
    } catch (error) {
      console.error(`Error fetching discounts for product ${productId}:`, error);
    } finally {
      setLoadingDiscounts(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDiscountFilter('all');
    setDiscountTypeFilter('all');
    setMinDiscountValue('');
    setMaxDiscountValue('');
    setShowAdvancedFilters(false);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || discountFilter !== 'all' || 
                          discountTypeFilter !== 'all' || minDiscountValue || maxDiscountValue;
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    // Discount filtering
    const discounts = productDiscounts[product.id] || [];
    const activeDiscounts = discounts.filter(d => DiscountService.isDiscountActive(d));
    const hasActiveDiscounts = activeDiscounts.length > 0;
    
    let matchesDiscountFilter = true;
    if (discountFilter === 'with-discounts') {
      matchesDiscountFilter = hasActiveDiscounts;
    } else if (discountFilter === 'without-discounts') {
      matchesDiscountFilter = !hasActiveDiscounts;
    } else if (discountFilter === 'expired-discounts') {
      const hasExpiredDiscounts = discounts.some(d => !DiscountService.isDiscountActive(d));
      matchesDiscountFilter = hasExpiredDiscounts;
    }
    
    // Discount type filtering
    let matchesDiscountType = true;
    if (discountTypeFilter !== 'all' && hasActiveDiscounts) {
      matchesDiscountType = activeDiscounts.some(d => d.discountType === discountTypeFilter);
    } else if (discountTypeFilter !== 'all' && !hasActiveDiscounts) {
      matchesDiscountType = false;
    }
    
    // Discount value filtering
    let matchesDiscountValue = true;
    if ((minDiscountValue || maxDiscountValue) && hasActiveDiscounts) {
      const minVal = parseFloat(minDiscountValue) || 0;
      const maxVal = parseFloat(maxDiscountValue) || Infinity;
      
      matchesDiscountValue = activeDiscounts.some(d => {
        const value = d.discountValue;
        return value >= minVal && value <= maxVal;
      });
    } else if ((minDiscountValue || maxDiscountValue) && !hasActiveDiscounts) {
      matchesDiscountValue = false;
    }
    
    return matchesSearch && matchesStatus && matchesDiscountFilter && matchesDiscountType && matchesDiscountValue;
  });

  const getStockStatus = (stock: number) => {
    return ProductService.getStockStatus(stock);
  };

  // Product actions
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleEdit = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      weight: product.weight,
      dimensions: product.dimensions,
      status: product.status,
      images: product.images || [] // Ensure images is always an array
    });
    // Reset image upload state
    setSelectedFiles(null);
    setReplaceImages(false);
    setImagePreviewUrls([]);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    setIsUpdating(true);

    try {
      let updatedProduct: ProductResponseDTO;

      // Use updateProductWithImages if files are selected, otherwise use regular update
      if (selectedFiles && selectedFiles.length > 0) {
        // Validate files before uploading
        const validation = ProductService.validateImageFiles(selectedFiles);
        if (!validation.valid) {
          alert(`Image validation failed:\n${validation.errors.join('\n')}`);
          return;
        }

        const response = await ProductService.updateProductWithImages(
          editingProduct.id, 
          editForm, 
          selectedFiles, 
          replaceImages
        );
        updatedProduct = response.product;
        
        // Show success message with image info
        const imageMessage = replaceImages 
          ? `Product updated successfully! Replaced all images with ${response.newImagesAdded} new images.`
          : `Product updated successfully! Added ${response.newImagesAdded} new images (total: ${response.totalImages}).`;
        alert(imageMessage);
      } else {
        // Regular update without images
        updatedProduct = await ProductService.updateProduct(editingProduct.id, editForm);
        alert('Product updated successfully!');
      }

      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? updatedProduct : p
      ));

      setShowEditModal(false);
      setEditingProduct(null);
      setSelectedFiles(null);
      setReplaceImages(false);
      setImagePreviewUrls([]);

    } catch (error) {
      console.error('Error updating product:', error);
      alert(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(product.id);
    
    try {
      await ProductService.deleteProduct(product.id);

      setProducts(prev => prev.filter(p => p.id !== product.id));
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Discount actions
  const handleManageDiscounts = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProductForDiscount(product);
    setShowDiscountListModal(true);
  };

  const handleCreateDiscount = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProductForDiscount(product);
    setDiscountForm({
      discountType: DiscountType.PERCENTAGE,
      discountValue: 0,
      startDate: new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16), // 5 minutes in the future
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      minPurchaseAmount: undefined,
      maxDiscountAmount: undefined
    });
    setShowDiscountModal(true);
  };

  // New function to handle edit discount
  const handleEditDiscount = async (discount: DiscountSummaryDTO, productId: string) => {
    try {
      // Fetch full discount details
      const fullDiscount = await DiscountService.getDiscountById(discount.id);
      
      setEditingDiscount(discount);
      setSelectedProductForDiscount(products.find(p => p.id === productId) || null);
      
      // Pre-populate the edit form
      setEditDiscountForm({
        discountType: fullDiscount.discountType,
        discountValue: fullDiscount.discountValue,
        startDate: new Date(fullDiscount.startDate).toISOString().slice(0, 16),
        endDate: new Date(fullDiscount.endDate).toISOString().slice(0, 16),
        minPurchaseAmount: fullDiscount.minPurchaseAmount,
        maxDiscountAmount: fullDiscount.maxDiscountAmount
      });
      
      setShowEditDiscountModal(true);
    } catch (error) {
      console.error('Error fetching discount details:', error);
      alert(`Failed to load discount details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmitDiscount = async () => {
    if (!selectedProductForDiscount) return;

    // Client-side validation
    const now = new Date();
    const startDate = new Date(discountForm.startDate);
    const endDate = new Date(discountForm.endDate);

    console.log('Discount form data:', {
      ...discountForm,
      startDateParsed: startDate.toISOString(),
      endDateParsed: endDate.toISOString(),
      nowParsed: now.toISOString()
    });

    if (startDate <= now) {
      alert('Start date must be in the future');
      return;
    }

    if (endDate <= startDate) {
      alert('End date must be after start date');
      return;
    }

    if (discountForm.discountValue <= 0) {
      alert('Discount value must be greater than 0');
      return;
    }

    if (discountForm.discountType === DiscountType.PERCENTAGE && discountForm.discountValue > 100) {
      alert('Percentage discount cannot exceed 100%');
      return;
    }

    if (discountForm.minPurchaseAmount && discountForm.minPurchaseAmount < 0) {
      alert('Minimum purchase amount cannot be negative');
      return;
    }

    if (discountForm.maxDiscountAmount && discountForm.maxDiscountAmount < 0) {
      alert('Maximum discount amount cannot be negative');
      return;
    }

    setIsCreatingDiscount(true);

    try {
      // Prepare the data to be sent to the backend
      const discountData = {
        ...discountForm,
        // Ensure we're sending ISO strings
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      console.log('Sending discount data:', discountData);

      await DiscountService.createDiscount(selectedProductForDiscount.id, discountData);
      
      // Refresh discounts and pricing for this product
      await fetchProductDiscountsAndPricing(selectedProductForDiscount.id);
      
      setShowDiscountModal(false);
      setSelectedProductForDiscount(null);
      alert('Discount created successfully!');
    } catch (error) {
      console.error('Error creating discount:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create discount: ${errorMessage}`);
    } finally {
      setIsCreatingDiscount(false);
    }
  };

  // New function to handle discount update
  const handleUpdateDiscount = async () => {
    if (!editingDiscount || !selectedProductForDiscount) return;

    // Client-side validation
    const now = new Date();
    const startDate = new Date(editDiscountForm.startDate);
    const endDate = new Date(editDiscountForm.endDate);

    if (endDate <= startDate) {
      alert('End date must be after start date');
      return;
    }

    if (editDiscountForm.discountValue <= 0) {
      alert('Discount value must be greater than 0');
      return;
    }

    if (editDiscountForm.discountType === DiscountType.PERCENTAGE && editDiscountForm.discountValue > 100) {
      alert('Percentage discount cannot exceed 100%');
      return;
    }

    if (editDiscountForm.minPurchaseAmount && editDiscountForm.minPurchaseAmount < 0) {
      alert('Minimum purchase amount cannot be negative');
      return;
    }

    if (editDiscountForm.maxDiscountAmount && editDiscountForm.maxDiscountAmount < 0) {
      alert('Maximum discount amount cannot be negative');
      return;
    }

    setIsUpdatingDiscount(true);

    try {
      const discountData = {
        ...editDiscountForm,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      await DiscountService.updateDiscount(editingDiscount.id, discountData);
      
      // Refresh discounts and pricing for this product
      await fetchProductDiscountsAndPricing(selectedProductForDiscount.id);
      
      setShowEditDiscountModal(false);
      setEditingDiscount(null);
      setSelectedProductForDiscount(null);
      alert('Discount updated successfully!');
    } catch (error) {
      console.error('Error updating discount:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to update discount: ${errorMessage}`);
    } finally {
      setIsUpdatingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (discountId: string, productId: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) {
      return;
    }

    try {
      await DiscountService.deleteDiscount(discountId);
      
      // Refresh discounts and pricing for this product
      await fetchProductDiscountsAndPricing(productId);
      
      alert('Discount deleted successfully!');
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert(`Failed to delete discount: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Modal close handlers
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProduct(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setSelectedFiles(null);
    setReplaceImages(false);
    setImagePreviewUrls([]);
  };

  const closeDiscountModal = () => {
    setShowDiscountModal(false);
    setSelectedProductForDiscount(null);
  };

  const closeDiscountListModal = () => {
    setShowDiscountListModal(false);
    setSelectedProductForDiscount(null);
  };

  // New function to close edit discount modal
  const closeEditDiscountModal = () => {
    setShowEditDiscountModal(false);
    setEditingDiscount(null);
    setSelectedProductForDiscount(null);
  };

  // Form handlers
  const handleImageChange = (index: number, value: string) => {
    const currentImages = editForm.images || [];
    const newImages = [...currentImages];
    newImages[index] = value;
    setEditForm(prev => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    const currentImages = editForm.images || [];
    setEditForm(prev => ({ ...prev, images: [...currentImages, ''] }));
  };

  const removeImageField = (index: number) => {
    const currentImages = editForm.images || [];
    if (index < 0 || index >= currentImages.length) return;
    
    const newImages = currentImages.filter((_, i) => i !== index);
    setEditForm(prev => ({ ...prev, images: newImages }));
    
    console.log('Removing image at index:', index);
    console.log('Current images:', currentImages);
    console.log('New images:', newImages);
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setSelectedFiles(null);
      setImagePreviewUrls([]);
      return;
    }

    // Validate files
    const validation = ProductService.validateImageFiles(files);
    if (!validation.valid) {
      alert(`Please fix the following issues:\n${validation.errors.join('\n')}`);
      event.target.value = ''; // Clear the input
      return;
    }

    setSelectedFiles(files);

    // Create preview URLs
    const previews: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          previews.push(e.target.result as string);
          if (previews.length === files.length) {
            setImagePreviewUrls([...previews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const clearSelectedFiles = () => {
    setSelectedFiles(null);
    setImagePreviewUrls([]);
    setReplaceImages(false);
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
        <div className="max-w-12xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="product-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-5 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Product Inventory</h1>
                <p className="text-xl text-white/80">Loading your product catalog...</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Loading products...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 relative overflow-hidden">
              <div className="relative text-center">
                <h1 className="text-4xl font-bold mb-3">Error Loading Products</h1>
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
                  <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Failed to Load Products</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl animate-fade-in-up">
          {/* Header Section */}
          <div className="product-gradient text-white p-8 relative overflow-hidden">
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
                    <h1 className="text-4xl font-bold">Product Inventory</h1>
                  </div>
                  <p className="text-xl text-white/80">Manage products and their discounts</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">{products.length} Products</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">
                      {Object.values(productDiscounts).reduce((acc, discounts) => 
                        acc + discounts.filter(d => DiscountService.isDiscountActive(d)).length, 0
                      )} Active Discounts
                    </span>
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
                      placeholder="Search products by name, SKU, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value={ProductStatus.ACTIVE}>Active</option>
                    <option value={ProductStatus.INACTIVE}>Inactive</option>
                    <option value={ProductStatus.DISCONTINUED}>Discontinued</option>
                  </select>
                  
                  <select
                    value={discountFilter}
                    onChange={(e) => setDiscountFilter(e.target.value)}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    <option value="all">All Products</option>
                    <option value="with-discounts">With Active Discounts</option>
                    <option value="without-discounts">Without Discounts</option>
                    <option value="expired-discounts">With Expired Discounts</option>
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
                  
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      {filteredProducts.length} of {products.length}
                    </span>
                    {hasActiveFilters && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
                  
                  {searchTerm && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      <span>Search: "{searchTerm}"</span>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {statusFilter !== 'all' && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                      <span>Status: {statusFilter}</span>
                      <button
                        onClick={() => setStatusFilter('all')}
                        className="w-4 h-4 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center hover:bg-green-300 dark:hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {discountFilter !== 'all' && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                      <span>
                        {discountFilter === 'with-discounts' ? 'With Active Discounts' :
                         discountFilter === 'without-discounts' ? 'Without Discounts' :
                         discountFilter === 'expired-discounts' ? 'With Expired Discounts' : discountFilter}
                      </span>
                      <button
                        onClick={() => setDiscountFilter('all')}
                        className="w-4 h-4 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {discountTypeFilter !== 'all' && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                      <span>Type: {discountTypeFilter.replace('_', ' ')}</span>
                      <button
                        onClick={() => setDiscountTypeFilter('all')}
                        className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {(minDiscountValue || maxDiscountValue) && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                      <span>
                        Value: {minDiscountValue || '0'} - {maxDiscountValue || '∞'}
                      </span>
                      <button
                        onClick={() => {
                          setMinDiscountValue('');
                          setMaxDiscountValue('');
                        }}
                        className="w-4 h-4 rounded-full bg-pink-200 dark:bg-pink-800 flex items-center justify-center hover:bg-pink-300 dark:hover:bg-pink-700 transition-colors"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 animate-fade-in-up">
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    Discount Filters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Discount Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                        Discount Type
                      </label>
                      <select
                        value={discountTypeFilter}
                        onChange={(e) => setDiscountTypeFilter(e.target.value)}
                        className="w-full px-4 py-3 border border-orange-300 dark:border-orange-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      >
                        <option value="all">All Types</option>
                        <option value={DiscountType.PERCENTAGE}>Percentage</option>
                        <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount</option>
                        <option value={DiscountType.BUY_ONE_GET_ONE}>Buy One Get One</option>
                      </select>
                    </div>
                    
                    {/* Min Discount Value */}
                    <div>
                      <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                        Min Discount Value
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g., 10"
                        value={minDiscountValue}
                        onChange={(e) => setMinDiscountValue(e.target.value)}
                        className="w-full px-4 py-3 border border-orange-300 dark:border-orange-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      />
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        For % discounts: enter percentage value
                      </p>
                    </div>
                    
                    {/* Max Discount Value */}
                    <div>
                      <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                        Max Discount Value
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g., 50"
                        value={maxDiscountValue}
                        onChange={(e) => setMaxDiscountValue(e.target.value)}
                        className="w-full px-4 py-3 border border-orange-300 dark:border-orange-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      />
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        For $ discounts: enter dollar amount
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Filter Buttons */}
                  <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-700">
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-3">Quick Filters:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setDiscountFilter('with-discounts');
                          setDiscountTypeFilter(DiscountType.PERCENTAGE);
                          setMinDiscountValue('20');
                          setMaxDiscountValue('');
                        }}
                        className="px-3 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        High % Discounts (20%+)
                      </button>
                      <button
                        onClick={() => {
                          setDiscountFilter('with-discounts');
                          setDiscountTypeFilter(DiscountType.FIXED_AMOUNT);
                          setMinDiscountValue('10');
                          setMaxDiscountValue('');
                        }}
                        className="px-3 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        $10+ Off
                      </button>
                      <button
                        onClick={() => {
                          setDiscountFilter('with-discounts');
                          setDiscountTypeFilter(DiscountType.BUY_ONE_GET_ONE);
                          setMinDiscountValue('');
                          setMaxDiscountValue('');
                        }}
                        className="px-3 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        BOGO Deals
                      </button>
                      <button
                        onClick={() => {
                          setDiscountFilter('all');
                          setDiscountTypeFilter('all');
                          setMinDiscountValue('');
                          setMaxDiscountValue('');
                        }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="p-6">
              {filteredProducts.length === 0 ? (
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
                      {hasActiveFilters ? 'No products match your filters' : 'No products found'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {hasActiveFilters 
                        ? 'Try adjusting your search criteria or clearing some filters' 
                        : searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria' 
                        : 'Start by adding your first product to the inventory'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const discounts = productDiscounts[product.id] || [];
                  const pricing = productPricing[product.id];
                  const activeDiscounts = discounts.filter(d => DiscountService.isDiscountActive(d));
                  const hasActiveDiscounts = activeDiscounts.length > 0;
                  
                  return (
                    <div 
                      key={product.id} 
                      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="fallback-icon absolute inset-0 flex items-center justify-center" style={{ display: product.images?.length > 0 ? 'none' : 'flex' }}>
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleEdit(e, product)}
                              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                              title="Edit product"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleCreateDiscount(e, product)}
                              className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                              title="Add discount"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleManageDiscounts(e, product)}
                              className="w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                              title="Manage discounts"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m4 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3m0 2v2m0 0V9m2 3h4m0 0V9m0 3v3" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, product)}
                              disabled={isDeleting === product.id}
                              className="w-8 h-8 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                              title="Delete product"
                            >
                              {isDeleting === product.id ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge
                            variant={ProductService.getStatusColor(product.status) as 'success' | 'warning' | 'error'}
                          >
                            {ProductService.getStatusDisplayName(product.status)}
                          </Badge>
                        </div>

                        {/* Discount Badge */}
                        {hasActiveDiscounts && (
                          <div className="absolute top-12 right-3">
                            <Badge variant="discount" size="sm">
                              {activeDiscounts.length} Discount{activeDiscounts.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}

                        {/* Stock Status */}
                        <div className="absolute bottom-3 left-3">
                          <div className="flex items-center gap-2 px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full">
                            <div className={`w-2 h-2 rounded-full ${stockStatus.color}`}></div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {product.stock} in stock
                            </span>
                          </div>
                        </div>

                        {/* Savings Badge */}
                        {pricing && pricing.savings > 0 && (
                          <div className="absolute bottom-3 right-3">
                            <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                              Save {formatCurrency(pricing.savings)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {/* Price and SKU */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              {pricing && pricing.finalPrice < product.price ? (
                                <>
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(pricing.finalPrice)}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                    {formatCurrency(product.price)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(product.price)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {product.sku}
                            </div>
                          </div>

                          {/* Active Discounts */}
                          {activeDiscounts.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {activeDiscounts.slice(0, 2).map((discount) => (
                                <Badge key={discount.id} variant="discount" size="sm">
                                  {DiscountService.formatDiscountValue(discount.discountType, discount.discountValue)}
                                </Badge>
                              ))}
                              {activeDiscounts.length > 2 && (
                                <Badge variant="discount" size="sm">
                                  +{activeDiscounts.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Product Details */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500 dark:text-gray-400">
                              <span className="font-medium">Weight:</span> {product.weight}kg
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              <span className="font-medium">ID:</span> {product.id.slice(0, 8)}...
                            </div>
                          </div>

                          {/* Updated Date */}
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Updated: {formatDate(product.updatedAt)}</span>
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDate(product.createdAt)}
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

      {/* Create Discount Modal */}
      {showDiscountModal && selectedProductForDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="discount-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Create Discount</h2>
                    <p className="text-white/80">Add a new discount for {selectedProductForDiscount.name}</p>
                  </div>
                  <button
                    onClick={closeDiscountModal}
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
                      Discount Type *
                    </label>
                    <select
                      value={discountForm.discountType}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, discountType: e.target.value as DiscountType }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    >
                      <option value={DiscountType.PERCENTAGE}>Percentage</option>
                      <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount</option>
                      <option value={DiscountType.BUY_ONE_GET_ONE}>Buy One Get One</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step={discountForm.discountType === DiscountType.PERCENTAGE ? "0.01" : "0.01"}
                      max={discountForm.discountType === DiscountType.PERCENTAGE ? "100" : undefined}
                      value={discountForm.discountValue}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder={discountForm.discountType === DiscountType.PERCENTAGE ? "0.01-100" : "0.01"}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {discountForm.discountType === DiscountType.PERCENTAGE 
                        ? "Enter percentage (0.01 - 100)" 
                        : discountForm.discountType === DiscountType.FIXED_AMOUNT
                        ? "Enter amount in dollars"
                        : "Value for BOGO discount"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // 1 minute from now
                      value={discountForm.startDate}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be in the future</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      min={discountForm.startDate || new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      value={discountForm.endDate}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be after start date</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Purchase Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountForm.minPurchaseAmount || ''}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, minPurchaseAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Discount Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountForm.maxDiscountAmount || ''}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeDiscountModal}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitDiscount}
                    disabled={isCreatingDiscount}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-orange-300 disabled:to-red-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isCreatingDiscount ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Create Discount
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Discount Modal */}
      {showEditDiscountModal && editingDiscount && selectedProductForDiscount && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="discount-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Edit Discount</h2>
                    <p className="text-white/80">Update discount for {selectedProductForDiscount.name}</p>
                  </div>
                  <button
                    onClick={closeEditDiscountModal}
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
                      Discount Type *
                    </label>
                    <select
                      value={editDiscountForm.discountType}
                      onChange={(e) => setEditDiscountForm(prev => ({ ...prev, discountType: e.target.value as DiscountType }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    >
                      <option value={DiscountType.PERCENTAGE}>Percentage</option>
                      <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount</option>
                      <option value={DiscountType.BUY_ONE_GET_ONE}>Buy One Get One</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step={editDiscountForm.discountType === DiscountType.PERCENTAGE ? "0.01" : "0.01"}
                      max={editDiscountForm.discountType === DiscountType.PERCENTAGE ? "100" : undefined}
                      value={editDiscountForm.discountValue}
                      onChange={(e) => setEditDiscountForm(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder={editDiscountForm.discountType === DiscountType.PERCENTAGE ? "0.01-100" : "0.01"}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {editDiscountForm.discountType === DiscountType.PERCENTAGE 
                        ? "Enter percentage (0.01 - 100)" 
                        : editDiscountForm.discountType === DiscountType.FIXED_AMOUNT
                        ? "Enter amount in dollars"
                        : "Value for BOGO discount"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editDiscountForm.startDate}
                      onChange={(e) => setEditDiscountForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      min={editDiscountForm.startDate}
                      value={editDiscountForm.endDate}
                      onChange={(e) => setEditDiscountForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be after start date</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Purchase Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editDiscountForm.minPurchaseAmount || ''}
                      onChange={(e) => setEditDiscountForm(prev => ({ ...prev, minPurchaseAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Discount Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editDiscountForm.maxDiscountAmount || ''}
                      onChange={(e) => setEditDiscountForm(prev => ({ ...prev, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeEditDiscountModal}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateDiscount}
                    disabled={isUpdatingDiscount}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-orange-300 disabled:to-red-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isUpdatingDiscount ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Update Discount
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount List Modal - Updated with Edit functionality */}
      {showDiscountListModal && selectedProductForDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="discount-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Manage Discounts</h2>
                    <p className="text-white/80">Discounts for {selectedProductForDiscount.name}</p>
                  </div>
                  <button
                    onClick={closeDiscountListModal}
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
              {productDiscounts[selectedProductForDiscount.id]?.length > 0 ? (
                <div className="space-y-4">
                  {productDiscounts[selectedProductForDiscount.id].map((discount) => (
                    <div key={discount.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge
                              variant={DiscountService.isDiscountActive(discount) ? "success" : "error"}
                            >
                              {DiscountService.isDiscountActive(discount) ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="discount">
                              {discount.discountType}
                            </Badge>
                            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                              {DiscountService.formatDiscountValue(discount.discountType, discount.discountValue)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Ends:</span> {DiscountService.formatDate(discount.endDate)}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {discount.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditDiscount(discount, selectedProductForDiscount.id)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                            title="Edit discount"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDiscount(discount.id, selectedProductForDiscount.id)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                            title="Delete discount"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No discounts found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">This product doesn't have any discounts yet.</p>
                  <button
                    onClick={() => {
                      closeDiscountListModal();
                      handleCreateDiscount(new MouseEvent('click') as any, selectedProductForDiscount);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    Create First Discount
                  </button>
                </div>
              )}
              
              {/* Add New Discount Button */}
              {productDiscounts[selectedProductForDiscount.id]?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      closeDiscountListModal();
                      handleCreateDiscount(new MouseEvent('click') as any, selectedProductForDiscount);
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Another Discount
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Edit Product</h2>
                    <p className="text-white/80">Update product information and specifications</p>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Basic Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="Enter product name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          SKU *
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.sku}
                          onChange={(e) => setEditForm(prev => ({ ...prev, sku: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="Enter SKU"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description *
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="Enter product description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status *
                        </label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as ProductStatus }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                        >
                          <option value={ProductStatus.ACTIVE}>Active</option>
                          <option value={ProductStatus.INACTIVE}>Inactive</option>
                          <option value={ProductStatus.DISCONTINUED}>Discontinued</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      Current Product Images
                    </h3>

                    <div className="space-y-3">
                      {(editForm.images || []).length > 0 ? (
                        (editForm.images || []).map((image, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="url"
                              value={image}
                              onChange={(e) => handleImageChange(index, e.target.value)}
                              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                              placeholder="Enter image URL"
                            />
                            {/* Image preview */}
                            {image && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                <img
                                  src={getImageUrl(image)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeImageField(index);
                              }}
                              className="px-3 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-200 flex-shrink-0"
                              title="Remove this image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          No image URLs added yet
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={addImageField}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors duration-200"
                      >
                        + Add Image URL
                      </button>
                    </div>
                  </div>

                  {/* New Image Upload Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      Upload New Images
                    </h3>

                    <div className="space-y-4">
                      {/* File Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Images to Upload
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Supported formats: JPG, PNG, GIF, WebP. Max size: 10MB per image.
                        </p>
                      </div>

                      {/* Replace Images Option */}
                      {selectedFiles && selectedFiles.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="replaceImages"
                              checked={replaceImages}
                              onChange={(e) => setReplaceImages(e.target.checked)}
                              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="replaceImages" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Replace all existing images
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {replaceImages 
                              ? "All current images will be deleted and replaced with the selected files." 
                              : "Selected images will be added to the existing images."}
                          </p>
                        </div>
                      )}

                      {/* Selected Files Info */}
                      {selectedFiles && selectedFiles.length > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                          <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">
                            Selected Files ({selectedFiles.length})
                          </h4>
                          <div className="space-y-1">
                            {Array.from(selectedFiles).map((file, index) => (
                              <div key={index} className="text-xs text-indigo-600 dark:text-indigo-300">
                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={clearSelectedFiles}
                            className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors duration-200"
                          >
                            Clear Selection
                          </button>
                        </div>
                      )}

                      {/* Image Previews */}
                      {imagePreviewUrls.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {imagePreviewUrls.map((url, index) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      Pricing & Inventory
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stock Quantity *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editForm.stock}
                          onChange={(e) => setEditForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      Specifications
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Weight (kg) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.001"
                          value={editForm.weight}
                          onChange={(e) => setEditForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="0.000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dimensions *
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.dimensions}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dimensions: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          placeholder="e.g. 10cm x 15cm x 5cm"
                        />
                      </div>
                    </div>
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
                      onClick={handleUpdateProduct}
                      disabled={isUpdating}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isUpdating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {selectedFiles && selectedFiles.length > 0 ? 'Uploading Images...' : 'Updating...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {selectedFiles && selectedFiles.length > 0 
                            ? `Update Product + Upload ${selectedFiles.length} Images` 
                            : 'Update Product'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="product-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{selectedProduct.name}</h2>
                    <p className="text-white/80">Product Details & Pricing</p>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Images */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Gallery</h3>
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <div className="space-y-4">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img
                            src={getImageUrl(selectedProduct.images[0])}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-2xl flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        {selectedProduct.images.length > 1 && (
                          <div className="grid grid-cols-3 gap-3">
                            {selectedProduct.images.slice(1, 4).map((image, index) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img
                                  src={getImageUrl(image)}
                                  alt={`${selectedProduct.name} ${index + 2}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-square rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Details with Pricing */}
                <div className="space-y-6">
                  {/* Pricing & Discounts */}
                  {productPricing[selectedProduct.id] ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        Pricing with Discounts
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold text-green-700 dark:text-green-300">Original Price:</span>
                          <p className="text-lg text-green-800 dark:text-green-200 mt-1">{formatCurrency(productPricing[selectedProduct.id].originalPrice)}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-green-700 dark:text-green-300">Final Price:</span>
                          <p className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">{formatCurrency(productPricing[selectedProduct.id].finalPrice)}</p>
                        </div>
                        {productPricing[selectedProduct.id].savings > 0 && (
                          <>
                            <div>
                              <span className="font-semibold text-green-700 dark:text-green-300">You Save:</span>
                              <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(productPricing[selectedProduct.id].savings)}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-green-700 dark:text-green-300">Discount:</span>
                              <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{productPricing[selectedProduct.id].discountPercentage.toFixed(1)}%</p>
                            </div>
                          </>
                        )}
                      </div>
                      {productPricing[selectedProduct.id].appliedDiscounts.length > 0 && (
                        <div className="mt-4">
                          <span className="font-semibold text-green-700 dark:text-green-300">Applied Discounts:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {productPricing[selectedProduct.id].appliedDiscounts.map((discount) => (
                              <Badge key={discount.id} variant="discount" size="sm">
                                {DiscountService.formatDiscountValue(discount.discountType, discount.discountValue)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        Pricing & Inventory
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold text-green-700 dark:text-green-300">Price:</span>
                          <p className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">{formatCurrency(selectedProduct.price)}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-green-700 dark:text-green-300">Stock:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-3 h-3 rounded-full ${getStockStatus(selectedProduct.stock).color}`}></div>
                            <p className="text-green-800 dark:text-green-200 font-semibold">{selectedProduct.stock} units</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">SKU:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1 font-mono">{selectedProduct.sku}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Description:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1 leading-relaxed">{selectedProduct.description}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Status:</span>
                        <div className="mt-2">
                          <Badge
                            variant={ProductService.getStatusColor(selectedProduct.status) as 'success' | 'warning' | 'error'}
                          >
                            {ProductService.getStatusDisplayName(selectedProduct.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      Specifications
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-purple-700 dark:text-purple-300">Weight:</span>
                        <p className="text-purple-800 dark:text-purple-200 mt-1">{selectedProduct.weight} kg</p>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-700 dark:text-purple-300">Dimensions:</span>
                        <p className="text-purple-800 dark:text-purple-200 mt-1">{selectedProduct.dimensions}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-700 dark:text-purple-300">Product ID:</span>
                        <p className="text-purple-800 dark:text-purple-200 mt-1 font-mono text-sm">{selectedProduct.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
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
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Created:</span>
                        <p className="text-gray-800 dark:text-gray-200 mt-1">{formatDate(selectedProduct.createdAt)}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Last Updated:</span>
                        <p className="text-gray-800 dark:text-gray-200 mt-1">{formatDate(selectedProduct.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDetailModal();
                        handleEdit(e, selectedProduct);
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Product
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDetailModal();
                        handleCreateDiscount(e, selectedProduct);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Add Discount
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDetailModal();
                        handleDelete(e, selectedProduct);
                      }}
                      disabled={isDeleting === selectedProduct.id}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      {isDeleting === selectedProduct.id ? (
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
        </div>
      )}
    </div>
  );
}