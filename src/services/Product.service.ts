import { Product_Service_URL } from "../lib/apiEndPoints";

// Enums
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED'
}

// Interfaces
export interface ProductRequestDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  weight?: number;
  dimensions?: string;
  images?: string[];
  status?: ProductStatus;
  categoryIds?: string[];
  supplierIds?: string[];
}

export interface ProductResponseDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  weight: number;
  dimensions: string;
  images: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummaryDTO {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  category: string;
  isActive: boolean;
  supplierNames: string[];
}

// Add the missing ProductOption interface
export interface ProductOption {
  value: string;
  label: string;
  sku: string;
  price?: number;
  stock?: number;
  status?: ProductStatus;
}

export interface CreateProductWithImagesResponse {
  product: ProductResponseDTO;
  imagesUploaded: number;
  imageUrls: string[];
  message: string;
}

export interface UpdateProductWithImagesResponse {
  product: ProductResponseDTO;
  totalImages: number;
  newImagesAdded: number;
  imagesReplaced: boolean;
  message: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  // Try to get token from cookies first
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

// Helper function to create request headers for JSON requests
const getRequestHeaders = (): HeadersInit => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to create request headers for multipart requests
const getMultipartHeaders = (): HeadersInit => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  return {
    'Authorization': `Bearer ${token}`
    // Note: Don't set Content-Type for multipart requests - let the browser set it
  };
};

// Base URL for product endpoints
const PRODUCT_BASE_URL = `${Product_Service_URL}/products`;

export class ProductService {
  
  // Get base URL for constructing image URLs
  static getBaseUrl(): string {
    return PRODUCT_BASE_URL;
  }

  // Add the missing getProductOptions method
  static async getProductOptions(): Promise<ProductOption[]> {
    try {
      const products = await this.getAllProducts();
      
      // Filter only active products and convert to ProductOption format
      return products
        .filter(product => product.status === ProductStatus.ACTIVE)
        .map(product => ({
          value: product.id,
          label: `${product.name} (${product.sku})`,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          status: product.status
        }));
    } catch (error) {
      console.error('Error fetching product options:', error);
      throw error;
    }
  }
  static async getProductNOOptions(): Promise<ProductOption[]> {
    try {
      const products = await this.getNoInventory();
      console.log('Products from getNoInventory:', products);
      
      // Option 1: Remove status filter entirely (include all products regardless of status)
      return products.map(product => ({
        value: product.id,
        label: `${product.name} (${product.sku})`,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        status: product.status
      }));
      
      
    } catch (error) {
      console.error('Error fetching product options:', error);
      throw error;
    }
  }
  
  
  // Get all products
  static async getAllProducts(): Promise<ProductResponseDTO[]> {
    try {
      const response = await fetch(`${PRODUCT_BASE_URL}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
  static async getNoInventory(): Promise<ProductResponseDTO[]> {
    try {
      const response = await fetch(`http://localhost:8099/api/products/products/no-inventory`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
       return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get product by ID
  static async getProductById(id: string): Promise<ProductResponseDTO> {
    try {
      const response = await fetch(`${PRODUCT_BASE_URL}/${id}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  // Get products by status
  static async getProductsByStatus(status: ProductStatus): Promise<ProductResponseDTO[]> {
    try {
      const response = await fetch(`${PRODUCT_BASE_URL}/status/${status}`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products by status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching products by status:', error);
      throw error;
    }
  }

  // Create product (JSON only)
  static async createProduct(productData: ProductRequestDTO): Promise<ProductResponseDTO> {
    try {
      const response = await fetch(`${PRODUCT_BASE_URL}`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          if (errorData?.errors && errorData.errors.length > 0) {
            const fieldErrors = errorData.errors.map((error: any) => 
              `${error.field}: ${error.defaultMessage || 'Invalid value'}`
            ).join(', ');
            throw new Error(`Validation failed: ${fieldErrors}`);
          }
          throw new Error(`Invalid product data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to create product: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Create product with images (multipart/form-data)
  static async createProductWithImages(
    productData: ProductRequestDTO, 
    images?: FileList | File[]
  ): Promise<CreateProductWithImagesResponse> {
    try {
      const formData = new FormData();
      
      // Add product data as JSON
      formData.append('product', JSON.stringify(productData));
      
      // Add images if provided
      if (images) {
        const imageArray = Array.from(images);
        imageArray.forEach((image, index) => {
          formData.append('images', image);
        });
      }

      const response = await fetch(`${PRODUCT_BASE_URL}/with-images`, {
        method: 'POST',
        headers: getMultipartHeaders(),
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Failed to create product: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to create product with images: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating product with images:', error);
      throw error;
    }
  }

  // Update product (PUT - full update)
  static async updateProduct(id: string, productData: ProductRequestDTO): Promise<ProductResponseDTO> {
    try {
      const response = await fetch(`${PRODUCT_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          if (errorData?.errors && errorData.errors.length > 0) {
            const fieldErrors = errorData.errors.map((error: any) => 
              `${error.field}: ${error.defaultMessage || 'Invalid value'}`
            ).join(', ');
            throw new Error(`Validation failed: ${fieldErrors}`);
          }
          throw new Error(`Invalid product data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to update product: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Update product with images (multipart/form-data)
  static async updateProductWithImages(
    id: string,
    productData: ProductRequestDTO,
    newImages?: FileList | File[],
    replaceImages: boolean = false
  ): Promise<UpdateProductWithImagesResponse> {
    try {
      const formData = new FormData();
      
      // Add product data as JSON string
      formData.append('product', JSON.stringify(productData));
      
      // Add replace images flag
      formData.append('replaceImages', replaceImages.toString());
      
      // Add new images if provided
      if (newImages) {
        const imageArray = Array.from(newImages);
        imageArray.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await fetch(`${PRODUCT_BASE_URL}/${id}/with-images`, {
        method: 'PUT',
        headers: getMultipartHeaders(),
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          throw new Error(`Failed to update product: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to update product with images: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating product with images:', error);
      throw error;
    }
  }

  // Partial update product (PATCH)
  static async updateProductPartial(id: string, productData: Partial<ProductRequestDTO>): Promise<ProductResponseDTO> {
    try {
      const response = await fetch(`${PRODUCT_BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: getRequestHeaders(),
        credentials: 'include',
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          if (errorData?.errors && errorData.errors.length > 0) {
            const fieldErrors = errorData.errors.map((error: any) => 
              `${error.field}: ${error.defaultMessage || 'Invalid value'}`
            ).join(', ');
            throw new Error(`Validation failed: ${fieldErrors}`);
          }
          throw new Error(`Invalid product data: ${errorData?.message || 'Bad Request'}`);
        }
        throw new Error(`Failed to update product: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error partially updating product:', error);
      throw error;
    }
  }

  // Update product status
  static async updateProductStatus(id: string, status: ProductStatus): Promise<ProductResponseDTO> {
    try {
      const response = await fetch(`${PRODUCT_BASE_URL}/${id}/status?status=${status}`, {
        method: 'PATCH',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to update product status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating product status:', error);
      throw error;
    }
  }

  // Delete product
  static async deleteProduct(id: string): Promise<void> {
    try {
      const response = await fetch(`${PRODUCT_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to delete product: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Check if product exists
  static async productExists(id: string): Promise<boolean> {
    try {
      await this.getProductById(id);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        return false;
      }
      throw error; // Re-throw other errors
    }
  }

  // Utility functions
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  static formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  static formatWeight(weight: number): string {
    return `${weight} kg`;
  }

  static getStatusDisplayName(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.ACTIVE:
        return 'Active';
      case ProductStatus.INACTIVE:
        return 'Inactive';
      case ProductStatus.DISCONTINUED:
        return 'Discontinued';
      default:
        return status;
    }
  }

  static getStatusColor(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.ACTIVE:
        return 'success';
      case ProductStatus.INACTIVE:
        return 'warning';
      case ProductStatus.DISCONTINUED:
        return 'error';
      default:
        return 'default';
    }
  }

  static isProductActive(product: ProductResponseDTO): boolean {
    return product.status === ProductStatus.ACTIVE;
  }

  static isProductInStock(product: ProductResponseDTO): boolean {
    return product.stock > 0;
  }

  static getStockStatus(stock: number): { color: string; text: string; level: string } {
    if (stock > 20) return { color: 'bg-green-500', text: 'In Stock', level: 'high' };
    if (stock > 0) return { color: 'bg-yellow-500', text: 'Low Stock', level: 'medium' };
    return { color: 'bg-red-500', text: 'Out of Stock', level: 'low' };
  }

  // Image validation helper
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: `File "${file.name}" is too large. Maximum size is 10MB.` };
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: `File "${file.name}" is not an image.` };
    }

    // Check for empty file
    if (file.size === 0) {
      return { valid: false, error: `File "${file.name}" is empty.` };
    }

    return { valid: true };
  }

  // Validate multiple image files
  static validateImageFiles(files: FileList | File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      const validation = this.validateImageFile(file);
      if (!validation.valid && validation.error) {
        errors.push(validation.error);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  // Helper to create FormData for multipart requests
  static createProductFormData(
    productData: ProductRequestDTO,
    images?: FileList | File[],
    replaceImages?: boolean
  ): FormData {
    const formData = new FormData();
    
    // Add product data
    formData.append('product', JSON.stringify(productData));
    
    // Add replace images flag if specified
    if (replaceImages !== undefined) {
      formData.append('replaceImages', replaceImages.toString());
    }
    
    // Add images
    if (images) {
      const imageArray = Array.from(images);
      imageArray.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    return formData;
  }

  // Search and filter utilities
  static searchProducts(
    products: ProductResponseDTO[], 
    searchTerm: string
  ): ProductResponseDTO[] {
    if (!searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term)
    );
  }

  static filterProductsByStatus(
    products: ProductResponseDTO[], 
    status: ProductStatus | 'all'
  ): ProductResponseDTO[] {
    if (status === 'all') return products;
    return products.filter(product => product.status === status);
  }

  static sortProducts(
    products: ProductResponseDTO[], 
    sortBy: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt',
    order: 'asc' | 'desc' = 'asc'
  ): ProductResponseDTO[] {
    return [...products].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
}