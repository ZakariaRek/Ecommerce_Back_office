import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function ListProducts() {
  return (
    <>
      <PageMeta
        title="Product List "
        description=" Product List "
      />
      <PageBreadcrumb pageTitle="Product List" />
      <div className="space-y-6">
        <ComponentCard title="Product List">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
