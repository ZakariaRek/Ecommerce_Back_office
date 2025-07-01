import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import ProductList from "../../components/tables/Product/ProductList";

export default function ProductTable() {
  return (
    <>
      <PageMeta
        title=" Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Basic Tables" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <ProductList />
        </ComponentCard>
      </div>
    </>
  );
}
