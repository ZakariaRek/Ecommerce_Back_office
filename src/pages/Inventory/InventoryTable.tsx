import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import InventoryList from "../../components/tables/Product/InventoryList";

export default function InventoryTable() {
  
  return (
    <>
      <PageMeta
        title="Inventory Table | TailAdmin - Next.js Admin Dashboard Template"
        description="Inventory Table - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Inventory Tables" />
      <div className="space-y-6">
        <ComponentCard title="Inventory Table">
          <InventoryList /> {/* Now includes all dashboard functionality */}
        </ComponentCard>
      </div>
    </>
  );
}
