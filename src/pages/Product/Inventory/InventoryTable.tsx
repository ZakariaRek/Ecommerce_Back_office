// src/pages/Inventory/InventoryPage.tsx
import React from 'react';
import InventoryManagement from '../../../components/tables/Product/InventoryTable';
import { InventoryProvider } from '../../../context/InventoryContext';
import ComponentCard from '../../../components/common/ComponentCard';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';

const InventoryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          
          {/* Breadcrumb */}
          <PageBreadcrumb pageTitle="Inventory List" />


        </div>

        {/* Main Content */}
        <ComponentCard title="Inventory Table ">

        <InventoryProvider>

        <InventoryManagement />

        </InventoryProvider>
        </ComponentCard>
      </div>
    </div>
  );
};

export default InventoryPage;