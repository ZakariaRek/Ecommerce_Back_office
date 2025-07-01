import React from 'react';
import { InventoryProvider } from '../../../context/InventoryContext';
import { InventoryStats } from './InventoryStats';
import { InventoryFilters } from './InventoryFilters';
import { InventoryTable1 } from './InventoryTable';
import { InventoryActions } from './InventoryActions';
import { InventoryModals } from './InventoryModals';

/**
 * Main Inventory Management Component
 * 
 * This component orchestrates all inventory-related functionality using 
 * a context-based architecture for better separation of concerns.
 * 
 * Features:
 * - Real-time inventory statistics
 * - Advanced filtering and searching
 * - Bulk operations with confirmation
 * - Inline editing and stock adjustments
 * - CSV export functionality
 * - Responsive design with dark mode support
 */
const InventoryList: React.FC = () => {
  return (
    <InventoryProvider>
      <div className="space-y-6">
        {/* Statistics Overview */}
        <InventoryStats />

        {/* Search, Filters, and Actions */}
        <InventoryFilters />

        {/* Bulk Actions Bar (only shows when items are selected) */}
        <InventoryActions />

        {/* Main Inventory Table */}
        <InventoryTable1 />

        {/* All Modals (Edit, Create, Adjust Stock, Bulk Confirmations) */}
        <InventoryModals />
      </div>
    </InventoryProvider>
  );
};

export default InventoryList;

/**
 * Individual component exports for granular usage
 * 
 * You can also use these components individually if needed:
 * 
 * @example
 * // Use only the statistics component
 * <InventoryProvider>
 *   <InventoryStats />
 * </InventoryProvider>
 * 
 * @example
 * // Use only the table component
 * <InventoryProvider>
 *   <InventoryTable />
 * </InventoryProvider>
 */
export {
  InventoryProvider,
  InventoryStats,
  InventoryFilters,
  InventoryTable1,
  InventoryActions,
  InventoryModals
};

/**
 * Hook exports for custom implementations
 * 
 * You can use these hooks to build your own components:
 * 
 * @example
 * import { useInventory, useInventoryStats } from '../contexts/InventoryContext';
 * 
 * function CustomInventoryComponent() {
 *   const { inventory, loading } = useInventory();
 *   const { stats } = useInventoryStats();
 *   
 *   return (
 *     <div>
 *       <p>Total Products: {stats.totalProducts}</p>
 *       {inventory.map(item => <div key={item.id}>{item.product.name}</div>)}
 *     </div>
 *   );
 * }
 */
// export {
//     useInventory,
//     useInventoryStats,
//     useInventoryFilters,
//     useInventorySelection,
//     useInventoryModals
//   } from '../../../contexts/InventoryContext';
/**
 * Component Architecture Overview:
 * 
 * InventoryProvider (Context)
 * ├── InventoryStats (Statistics Cards)
 * ├── InventoryFilters (Search, Filters, Sort, Export)
 * ├── InventoryActions (Bulk Operations Bar)
 * ├── InventoryTable (Main Data Table)
 * └── InventoryModals (All Modal Dialogs)
 *     ├── EditInventoryModal
 *     ├── StockAdjustmentModal
 *     ├── CreateInventoryModal
 *     └── BulkActionModal
 * 
 * Each component is responsible for a specific aspect of inventory management
 * and communicates through the shared context providers.
 */

/**
 * Context Architecture:
 * 
 * InventoryContext - Main inventory data and operations
 * ├── inventory: Inventory[]
 * ├── loading: boolean
 * ├── error: string | null
 * ├── fetchInventory()
 * ├── updateInventory()
 * └── adjustStock()
 * 
 * InventoryStatsContext - Statistics calculations
 * ├── stats: InventoryStatsType
 * └── calculateStats()
 * 
 * InventoryFiltersContext - Filtering and sorting
 * ├── searchTerm, filterStatus, sortBy, sortOrder
 * ├── filteredAndSortedInventory: Inventory[]
 * └── setters for all filter properties
 * 
 * InventorySelectionContext - Multi-select functionality
 * ├── selectedItems: Set<string>
 * ├── handleSelectAll()
 * ├── handleSelectItem()
 * └── clearSelection()
 * 
 * InventoryModalsContext - Modal state management
 * ├── editingInventory, adjustingInventory
 * ├── showCreateModal, showBulkModal
 * └── setters for all modal states
 */