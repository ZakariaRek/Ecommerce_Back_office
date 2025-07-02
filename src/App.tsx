// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AddProductForm from "./pages/Product/Product/ProductForm";
import ProductList from "./pages/Product/Product/ProductList";
import UserList from "./pages/users/UserList";
import SupplierForm from "./pages/Product/Supplier/CreateSupplier";
import CategoryCreateForm from "./pages/Product/Categorie/CategoryCreateForm";
import CategoryList from "./pages/Product/Categorie/CategoryList";
import SupplierList from "./pages/Product/Supplier/SupplierList";
import InventoryTable from "./pages/Product/Inventory/InventoryTable";
import CreateInventoryPage from "./pages/Product/Inventory/CreateInventoryPage";
import EditInventoryPage from "./pages/Product/Inventory/EditInventoryPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route index path="/" element={<SignIn />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/dashboard" element={<Home />} />

             {/* Users */}
            <Route path="/user-list" element={<UserList />} />

            {/* Product */}
            <Route path="/product" element={<ProductList />} />
            <Route path="/Categorie" element={<CategoryList />} />
            <Route path="/Supplier" element={<SupplierList />} />
            <Route path="/product-form" element={<AddProductForm />} />
            <Route path="/Supplier-form" element={<SupplierForm/>} />
            <Route path="/Categorie-form" element={<CategoryCreateForm/>} />
            
            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />  

            {/* Products */}

            <Route path="/inventory" element={<InventoryTable />} />
            <Route path="/inventory/create" element={<CreateInventoryPage />} />
            <Route path="/inventory/edit/:id" element={<EditInventoryPage />} />


            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}