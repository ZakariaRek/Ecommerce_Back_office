// Core Inventory Types
export interface Inventory {
    id: string;
    product: {
      id: string;
      name: string;
      sku: string;
    };
    quantity: number;
    lowStockThreshold: number;
    lastRestocked: string | null;
    warehouseLocation: string;
  }
  
  export interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string;
    price?: number;
    status: ProductStatus;
    images?: string[];
  }
  
  export enum ProductStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    DISCONTINUED = 'DISCONTINUED'
  }
  
  // Request/Response Types
  export interface CreateInventoryRequest {
    productId: string;
    quantity: number;
    lowStockThreshold: number;
    warehouseLocation: string;
  }
  
  export interface UpdateInventoryRequest {
    id: string;
    quantity?: number;
    lowStockThreshold?: number;
    warehouseLocation?: string;
  }
  
  export interface BulkUpdateRequest {
    productId: string;
    newQuantity: number;
    reason?: string;
  }
  
  // Statistics Types
  export interface InventoryStats {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    inStock: number;
    totalValue?: number;
    averageStock?: number;
  }
  
  export interface WarehouseStats {
    [warehouseLocation: string]: {
      products: number;
      totalStock: number;
      lowStock: number;
      outOfStock: number;
    };
  }
  
  // Alert Types
  export interface InventoryAlert {
    id: string;
    productName: string;
    productSku: string;
    currentQuantity: number;
    threshold: number;
    severity: AlertSeverity;
    message: string;
    warehouseLocation: string;
    lastRestocked?: string;
  }
  
  export enum AlertSeverity {
    LOW = 'low',
    CRITICAL = 'critical',
    OUT = 'out'
  }
  
  // Stock Movement Types
  export interface StockMovement {
    id: string;
    productId: string;
    productName: string;
    previousQuantity: number;
    newQuantity: number;
    change: number;
    timestamp: Date;
    reason: StockMovementReason;
    userId?: string;
    warehouseLocation: string;
  }
  
  export enum StockMovementReason {
    RESTOCK = 'restock',
    SOLD = 'sold',
    DAMAGED = 'damaged',
    RETURNED = 'returned',
    TRANSFER = 'transfer',
    AUDIT = 'audit',
    MANUAL_ADJUSTMENT = 'manual_adjustment',
    OTHER = 'other'
  }
  
  // Filter Types
  export type InventoryFilterStatus = 'all' | 'low_stock' | 'out_of_stock' | 'in_stock';
  export type InventorySortField = 'name' | 'quantity' | 'lastRestocked' | 'warehouseLocation';
  export type SortOrder = 'asc' | 'desc';
  
  export interface InventoryFilters {
    searchTerm: string;
    status: InventoryFilterStatus;
    sortBy: InventorySortField;
    sortOrder: SortOrder;
    warehouseLocation?: string;
    minQuantity?: number;
    maxQuantity?: number;
  }
  
  // Bulk Action Types
  export enum BulkActionType {
    DELETE = 'delete',
    UPDATE_THRESHOLD = 'updateThreshold',
    MOVE_WAREHOUSE = 'moveWarehouse',
    ARCHIVE = 'archive',
    EXPORT = 'export',
    UPDATE_STOCK = 'updateStock',
    GENERATE_REPORT = 'generateReport'
  }
  
  export interface BulkActionRequest {
    action: BulkActionType;
    itemIds: string[];
    parameters?: Record<string, undefined>;
  }
  
  // Report Types
  export interface InventoryReport {
    generatedAt: Date;
    summary: InventoryStats;
    byWarehouse: WarehouseStats;
    alerts: InventoryAlert[];
    reorderSuggestions: ReorderSuggestion[];
    lowStockItems: Inventory[];
    outOfStockItems: Inventory[];
    stockMovements?: StockMovement[];
  }
  
  export interface ReorderSuggestion {
    productId: string;
    productName: string;
    productSku: string;
    currentStock: number;
    lowStockThreshold: number;
    suggestedOrder: number;
    urgency: ReorderUrgency;
    estimatedCost?: number;
    supplierId?: string;
    leadTime?: number;
  }
  
  export enum ReorderUrgency {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
  }
  
  // API Response Types
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
  
  // Context Types
  export interface InventoryContextType {
    inventory: Inventory[];
    loading: boolean;
    error: string | null;
    refreshing: boolean;
    fetchInventory: () => Promise<void>;
    handleRefresh: () => Promise<void>;
    updateInventory: (data: UpdateInventoryRequest) => Promise<void>;
    adjustStock: (productId: string, adjustment: number) => Promise<void>;
    deleteInventory: (inventoryId: string) => Promise<void>;
    createInventory: (data: CreateInventoryRequest) => Promise<void>;
  }
  
  export interface InventoryStatsContextType {
    stats: InventoryStats;
    warehouseStats: WarehouseStats;
    calculateStats: (inventory: Inventory[]) => void;
    generateAlerts: (inventory: Inventory[]) => InventoryAlert[];
    generateReorderSuggestions: (inventory: Inventory[]) => ReorderSuggestion[];
  }
  
  export interface InventoryFiltersContextType {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: InventoryFilterStatus;
    setFilterStatus: (status: InventoryFilterStatus) => void;
    sortBy: InventorySortField;
    setSortBy: (sort: InventorySortField) => void;
    sortOrder: SortOrder;
    setSortOrder: (order: SortOrder) => void;
    filteredAndSortedInventory: Inventory[];
    activeFiltersCount: number;
    clearAllFilters: () => void;
  }
  
  export interface InventorySelectionContextType {
    selectedItems: Set<string>;
    setSelectedItems: (items: Set<string>) => void;
    handleSelectAll: () => void;
    handleSelectItem: (itemId: string) => void;
    clearSelection: () => void;
    isAllSelected: boolean;
    hasSelection: boolean;
  }
  
  export interface InventoryModalsContextType {
    editingInventory: Inventory | null;
    setEditingInventory: (inventory: Inventory | null) => void;
    adjustingInventory: Inventory | null;
    setAdjustingInventory: (inventory: Inventory | null) => void;
    showCreateModal: boolean;
    setShowCreateModal: (show: boolean) => void;
    showBulkModal: boolean;
    setShowBulkModal: (show: boolean) => void;
    bulkAction: BulkActionType | string;
    setBulkAction: (action: BulkActionType | string) => void;
    showReportModal: boolean;
    setShowReportModal: (show: boolean) => void;
  }
  
  // Component Props Types
  export interface InventoryTableProps {
    showActions?: boolean;
    showSelection?: boolean;
    pageSize?: number;
    virtualizedRows?: boolean;
  }
  
  export interface InventoryStatsProps {
    showProgress?: boolean;
    showTrends?: boolean;
    compactView?: boolean;
  }
  
  export interface InventoryFiltersProps {
    showAdvancedFilters?: boolean;
    showExportOptions?: boolean;
    customActions?: React.ReactNode;
  }
  
  export interface InventoryActionsProps {
    enabledActions?: BulkActionType[];
    customActions?: React.ReactNode;
  }
  
  // Form Types
  export interface StockAdjustmentForm {
    adjustment: number;
    adjustmentType: 'add' | 'subtract';
    reason: StockMovementReason;
    notes?: string;
  }
  
  export interface InventoryEditForm {
    quantity: number;
    lowStockThreshold: number;
    warehouseLocation: string;
    notes?: string;
  }
  
  export interface CreateInventoryForm {
    productId: string;
    quantity: number;
    lowStockThreshold: number;
    warehouseLocation: string;
    notes?: string;
  }
  
  // Validation Types
  export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
  }
  
  export interface ValidationError {
    field: string;
    message: string;
    code?: string;
  }
  
  // Export Configuration Types
  export interface ExportConfig {
    format: 'csv' | 'xlsx' | 'pdf';
    includeAlerts?: boolean;
    includeStats?: boolean;
    selectedItemsOnly?: boolean;
    dateRange?: {
      start: Date;
      end: Date;
    };
  }
  
  // Notification Types
  export interface InventoryNotification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
    actionText?: string;
  }
  
  // Theme Types for consistent styling
  export interface InventoryTheme {
    colors: {
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
    };
  }
  
  // Utility Types
  export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };
  
  export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
  
  export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
  
  // Event Types
  export interface InventoryEvent {
    type: 'created' | 'updated' | 'deleted' | 'stock_adjusted';
    inventoryId: string;
    productId: string;
    userId?: string;
    timestamp: Date;
  }
  
  // Configuration Types
  export interface InventoryConfig {
    features: {
      enableBulkOperations: boolean;
      enableStockAdjustments: boolean;
      enableReports: boolean;
      enableNotifications: boolean;
      enableAuditLog: boolean;
    };
    ui: {
      theme: InventoryTheme;
      pageSize: number;
      enableVirtualization: boolean;
      enableDarkMode: boolean;
    };
    
  }
  
  // Default configuration
  export const DEFAULT_INVENTORY_CONFIG: InventoryConfig = {
    features: {
      enableBulkOperations: true,
      enableStockAdjustments: true,
      enableReports: true,
      enableNotifications: true,
      enableAuditLog: false
    },
    ui: {
      theme: {
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem'
        },
        borderRadius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem'
        }
      },
      pageSize: 25,
      enableVirtualization: false,
      enableDarkMode: true
    }
    
  };