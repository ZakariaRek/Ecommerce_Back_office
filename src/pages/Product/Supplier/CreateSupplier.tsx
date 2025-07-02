import { useState, useEffect } from "react";
import { Product_Service_URL } from "../../../lib/apiEndPoints";

type FormStep = 'basic' | 'contract' | 'products';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  supplierId?: string;
  supplierName?: string;
  categoryId?: string;
  categoryName?: string;
  imageUrl?: string;
  sku?: string;
  stock?: number;
}

interface CreateSupplierProps {
  onSupplierCreated?: (supplier: any) => void;
  onCancel?: () => void;
}

// Modern styles
const modernStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #10b981, #059669);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #059669, #047857);
  }
  .floating-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
  }
  .dark .floating-card {
    background: linear-gradient(145deg, #1f2937, #111827);
    box-shadow: 20px 20px 60px #0f172a, -20px -20px 60px #374151;
  }
  .supplier-gradient {
    background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-bounce-slow {
    animation: bounce-slow 3s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(3deg); }
  }
  @keyframes bounce-slow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
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

// Helper function to get cookie value
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

// Token management
const getAuthToken = (): string | null => {
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

// Simple components
const Label = ({ htmlFor, className, children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={className}>{children}</label>
);

const Input = ({ type, id, value, onChange, placeholder, className, required, min, max, step }: {
  type: string;
  id?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) => (
  <input
    type={type}
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${className}`}
    required={required}
    min={min}
    max={max}
    step={step}
  />
);

const TextArea = ({ rows, value, onChange, placeholder, className }: {
  rows: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <textarea
    rows={rows}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${className}`}
  />
);

const Select = ({ options, placeholder, onChange, className, required, value }: {
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  value?: string;
}) => (
  <select
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${className}`}
    required={required}
  >
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export default function SupplierForm({ onSupplierCreated, onCancel }: CreateSupplierProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Basic supplier information (matching SupplierRequestDTO)
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
    address: '',
    rating: 0.0
  });

  // Contract details as Map<String, Object> structure
  const [contractDetails, setContractDetails] = useState<Record<string, any>>({
    contractType: '',
    startDate: '',
    endDate: '',
    contractValue: 0,
    paymentTerms: '',
    deliveryTerms: '',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    notes: ''
  });

  useEffect(() => {
    // Inject custom styles
    const styleElement = document.createElement('style');
    styleElement.textContent = modernStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const token = getAuthToken();
      
      const response = await fetch(`${Product_Service_URL}/products`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContractChange = (field: string, value: string | number) => {
    setContractDetails(prev => ({ ...prev, [field]: value }));
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      if (newSelected.size >= 100) { // DTO validation limit
        alert('Cannot select more than 100 products');
        return;
      }
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
  };

  const contractTypeOptions = [
    { value: "Standard Supply Agreement", label: "Standard Supply Agreement" },
    { value: "Exclusive Supply Agreement", label: "Exclusive Supply Agreement" },
    { value: "Preferred Supplier Agreement", label: "Preferred Supplier Agreement" },
    { value: "Framework Agreement", label: "Framework Agreement" },
    { value: "Long-term Partnership", label: "Long-term Partnership" }
  ];

  const paymentTermsOptions = [
    { value: "Net 15 days", label: "Net 15 days" },
    { value: "Net 30 days", label: "Net 30 days" },
    { value: "Net 45 days", label: "Net 45 days" },
    { value: "Net 60 days", label: "Net 60 days" },
    { value: "Cash on Delivery", label: "Cash on Delivery" },
    { value: "Advance Payment", label: "Advance Payment" }
  ];

  const deliveryTermsOptions = [
    { value: "FOB Destination", label: "FOB Destination" },
    { value: "FOB Origin", label: "FOB Origin" },
    { value: "CIF", label: "CIF (Cost, Insurance, Freight)" },
    { value: "DDP", label: "DDP (Delivered Duty Paid)" },
    { value: "EXW", label: "EXW (Ex Works)" }
  ];

  const steps = [
    { key: 'basic', title: 'Basic Info', icon: 'building', color: 'from-emerald-500 to-teal-500' },
    { key: 'contract', title: 'Contract', icon: 'document-text', color: 'from-blue-500 to-cyan-500' },
    { key: 'products', title: 'Products', icon: 'cube', color: 'from-purple-500 to-indigo-500' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.key === currentStep);

  const renderStepIcon = (icon: string) => {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case 'building':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'document-text':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'cube':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return <div className={iconClass}></div>;
    }
  };

  // Filter products for display
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const renderStep = () => {
    const currentStepData = steps.find(step => step.key === currentStep);
    
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className={`bg-gradient-to-r ${currentStepData?.color} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {renderStepIcon('building')}
                  </div>
                  <h3 className="text-2xl font-bold">Supplier Information</h3>
                </div>
                <p className="text-white/80">Basic supplier details and contact information</p>
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Supplier Name</Label>
                  <Input 
                    type="text" 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter supplier company name"
                    className="mt-3 text-lg border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Company name must be between 2 and 100 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="contactInfo" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Contact Information</Label>
                  <TextArea
                    rows={4}
                    value={formData.contactInfo}
                    onChange={(value) => handleInputChange('contactInfo', value)}
                    placeholder="Email, phone, website, and other contact details..."
                    className="mt-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Maximum 500 characters for contact information
                  </p>
                </div>

                <div>
                  <Label htmlFor="address" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Business Address</Label>
                  <TextArea
                    rows={3}
                    value={formData.address}
                    onChange={(value) => handleInputChange('address', value)}
                    placeholder="Complete business address including city, state, and postal code..."
                    className="mt-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Maximum 500 characters for address
                  </p>
                </div>

                <div>
                  <Label htmlFor="rating" className="text-gray-700 dark:text-gray-300 font-medium text-lg">Supplier Rating</Label>
                  <div className="mt-3 relative">
                    <Input 
                      type="number" 
                      id="rating" 
                      value={formData.rating}
                      onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                      className="text-lg border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      min="0"
                      max="5"
                      step="0.1"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      / 5.0
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Rate the supplier from 0.0 to 5.0 based on past performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'contract':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className={`bg-gradient-to-r ${currentStepData?.color} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 animate-bounce-slow"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {renderStepIcon('document-text')}
                  </div>
                  <h3 className="text-2xl font-bold">Contract Details</h3>
                </div>
                <p className="text-white/80">Define contract terms and conditions</p>
              </div>
            </div>

            {/* Contract Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Contract Information
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Contract Type</Label>
                  <Select
                    options={contractTypeOptions}
                    placeholder="Select contract type"
                    onChange={(value) => handleContractChange('contractType', value)}
                    value={contractDetails.contractType}
                    className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Contract Value (USD)</Label>
                  <Input
                    type="number"
                    value={contractDetails.contractValue}
                    onChange={(e) => handleContractChange('contractValue', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={contractDetails.startDate}
                    onChange={(e) => handleContractChange('startDate', e.target.value)}
                    className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">End Date</Label>
                  <Input
                    type="datetime-local"
                    value={contractDetails.endDate}
                    onChange={(e) => handleContractChange('endDate', e.target.value)}
                    className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Payment Terms</Label>
                  <Select
                    options={paymentTermsOptions}
                    placeholder="Select payment terms"
                    onChange={(value) => handleContractChange('paymentTerms', value)}
                    value={contractDetails.paymentTerms}
                    className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Delivery Terms</Label>
                  <Select
                    options={deliveryTermsOptions}
                    placeholder="Select delivery terms"
                    onChange={(value) => handleContractChange('deliveryTerms', value)}
                    value={contractDetails.deliveryTerms}
                    className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div className="mt-8">
                <h5 className="text-md font-semibold text-gray-800 dark:text-white mb-4">Primary Contact Person</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">Full Name</Label>
                    <Input
                      type="text"
                      value={contractDetails.contactPersonName}
                      onChange={(e) => handleContractChange('contactPersonName', e.target.value)}
                      placeholder="Contact person name"
                      className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">Email Address</Label>
                    <Input
                      type="email"
                      value={contractDetails.contactPersonEmail}
                      onChange={(e) => handleContractChange('contactPersonEmail', e.target.value)}
                      placeholder="contact@supplier.com"
                      className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">Phone Number</Label>
                    <Input
                      type="tel"
                      value={contractDetails.contactPersonPhone}
                      onChange={(e) => handleContractChange('contactPersonPhone', e.target.value)}
                      placeholder="+1-555-123-4567"
                      className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <Label className="text-gray-700 dark:text-gray-300 font-medium mb-3 block">Additional Notes</Label>
                <TextArea
                  rows={3}
                  value={contractDetails.notes}
                  onChange={(value) => handleContractChange('notes', value)}
                  placeholder="Special terms, preferences, quality requirements, or any other important notes..."
                  className="border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className={`bg-gradient-to-r ${currentStepData?.color} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-1/2 right-0 w-28 h-28 bg-white/5 rounded-full -mr-14 animate-float"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {renderStepIcon('cube')}
                  </div>
                  <h3 className="text-2xl font-bold">Product Assignment</h3>
                </div>
                <p className="text-white/80">Assign products to this supplier ({selectedProductIds.size}/100 selected)</p>
              </div>
            </div>

            {/* Product Assignment */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Available Products</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select up to 100 products to assign to this supplier
                  </p>
                </div>
                {loadingProducts && (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                )}
              </div>

              {/* Product Search */}
              <div className="mb-6">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="Search products by name, description, or SKU..."
                    className="pl-10 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-3">
                {loadingProducts ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                    {productSearchTerm ? 'No products match your search criteria' : 'No products available'}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedProductIds.has(product.id)
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          selectedProductIds.has(product.id)
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedProductIds.has(product.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">{product.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span className="font-medium">${product.price}</span>
                                {product.sku && <span>SKU: {product.sku}</span>}
                                {product.categoryName && <span>Category: {product.categoryName}</span>}
                                {product.stock !== undefined && <span>Stock: {product.stock}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {product.supplierId && product.supplierId !== 'current' && (
                        <div className="text-xs text-orange-500 font-medium">
                          Currently assigned to: {product.supplierName || 'Another supplier'}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Selection Summary */}
              {selectedProductIds.size > 0 && (
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-purple-800 dark:text-purple-200">
                        {selectedProductIds.size} products selected
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        {100 - selectedProductIds.size} more products can be added
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedProductIds(new Set())}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactInfo: '',
      address: '',
      rating: 0.0
    });
    setContractDetails({
      contractType: '',
      startDate: '',
      endDate: '',
      contractValue: 0,
      paymentTerms: '',
      deliveryTerms: '',
      contactPersonName: '',
      contactPersonEmail: '',
      contactPersonPhone: '',
      notes: ''
    });
    setSelectedProductIds(new Set());
    setCurrentStep('basic');
  };

  const handleSubmit = async () => {
    if (currentStep !== 'products') {
      console.log('Not on final step, preventing submission');
      return;
    }

    if (!showPreview) {
      setShowPreview(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare the request payload matching SupplierRequestDTO
      const supplierData = {
        name: formData.name,
        contactInfo: formData.contactInfo,
        address: formData.address,
        rating: formData.rating,
        contractDetails: contractDetails, // Already a Map<String, Object>
        productIds: Array.from(selectedProductIds) // Convert Set to List<UUID>
      };

      const response = await fetch(`${Product_Service_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supplierData)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Supplier created:', responseData);
        
        setShowPreview(false);
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
          resetForm();
          if (onSupplierCreated) {
            onSupplierCreated(responseData);
          }
        }, 3000);
      } else {
        const errorData = await response.text();
        console.error('Failed to create supplier:', errorData);
        alert(`Failed to create supplier: ${errorData}`);
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert(`Error creating supplier: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'basic' && isStepValid()) {
      setCurrentStep('contract');
    } else if (currentStep === 'contract' && isStepValid()) {
      setCurrentStep('products');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'contract') setCurrentStep('basic');
    else if (currentStep === 'products') setCurrentStep('contract');
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.length >= 2 && formData.name.length <= 100 && 
               formData.contactInfo.length > 0 && formData.contactInfo.length <= 500 &&
               formData.address.length > 0 && formData.address.length <= 500 &&
               formData.rating >= 0 && formData.rating <= 5;
      case 'contract':
        return true; // Contract details are optional
      case 'products':
        return !isSubmitting; // Products are optional, just need to not be submitting
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-purple-50 dark:from-gray-900 dark:via-emerald-900 dark:to-purple-900">
      <div className="max-w-12xl mx-auto p-6">
        <div className="floating-card rounded-3xl overflow-hidden backdrop-blur-xl">
          {/* Header Section */}
          <div className="supplier-gradient text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-float" style={{animationDelay: '3s'}}></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-bounce-slow"></div>
            <div className="relative text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-3">Add New Supplier</h1>
              <p className="text-xl text-white/80">Onboard suppliers with comprehensive details and product assignments</p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="bg-white dark:bg-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted = index < getCurrentStepIndex();
                const isAccessible = index <= getCurrentStepIndex();
                
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <button
                        type="button"
                        className={`relative flex items-center justify-center w-12 h-12 rounded-2xl font-bold transition-all duration-300 ${
                          isActive
                            ? `bg-gradient-to-r ${step.color} text-white shadow-lg transform scale-110`
                            : isCompleted
                              ? 'bg-emerald-500 text-white shadow-md'
                              : isAccessible
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (isAccessible) setCurrentStep(step.key as FormStep);
                        }}
                        disabled={!isAccessible}
                      >
                        {isCompleted ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          renderStepIcon(step.icon)
                        )}
                        {isActive && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-2xl opacity-30 animate-pulse"></div>
                        )}
                      </button>
                      <span className={`mt-3 text-sm font-medium transition-colors duration-300 text-center ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCompleted
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-4 rounded-full transition-all duration-300 ${
                        index < getCurrentStepIndex()
                          ? 'bg-gradient-to-r from-emerald-500 to-purple-500'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div>
              <div className="transition-all duration-500 transform">
                {renderStep()}
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {currentStep === 'products' && (
                    <span className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Review all details before submission</span>
                    </span>
                  )}
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                      currentStep === 'basic'
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                    onClick={handlePreviousStep}
                    disabled={currentStep === 'basic'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                  {currentStep === 'products' ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className={`px-8 py-3 bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center space-x-2 ${
                        !isStepValid() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!isStepValid() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Create Supplier</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`px-8 py-3 bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2 ${
                        !isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={handleNextStep}
                      disabled={!isStepValid()}
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            {/* Preview Header */}
            <div className="supplier-gradient text-white p-8 text-center">
              <h3 className="text-3xl font-bold mb-2">Supplier Preview</h3>
              <p className="text-white/80">Review all details before creating the supplier</p>
            </div>
            
            {/* Preview Content */}
            <div className="p-8 space-y-8">
              {/* Basic Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <h4 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Supplier Name:</span>
                    <p className="text-emerald-800 dark:text-emerald-200 mt-1">{formData.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Rating:</span>
                    <p className="text-emerald-800 dark:text-emerald-200 mt-1">{formData.rating}/5.0</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Contact Info:</span>
                    <p className="text-emerald-800 dark:text-emerald-200 mt-1 leading-relaxed">{formData.contactInfo}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Address:</span>
                    <p className="text-emerald-800 dark:text-emerald-200 mt-1 leading-relaxed">{formData.address}</p>
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              {Object.values(contractDetails).some(value => value) && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                  <h4 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    Contract Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contractDetails.contractType && (
                      <div>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Contract Type:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1">{contractDetails.contractType}</p>
                      </div>
                    )}
                    {contractDetails.contractValue > 0 && (
                      <div>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Contract Value:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1">${contractDetails.contractValue}</p>
                      </div>
                    )}
                    {contractDetails.paymentTerms && (
                      <div>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Payment Terms:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1">{contractDetails.paymentTerms}</p>
                      </div>
                    )}
                    {contractDetails.deliveryTerms && (
                      <div>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Delivery Terms:</span>
                        <p className="text-blue-800 dark:text-blue-200 mt-1">{contractDetails.deliveryTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Products */}
              {selectedProductIds.size > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    Selected Products ({selectedProductIds.size})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto custom-scrollbar">
                    {Array.from(selectedProductIds).map(productId => {
                      const product = products.find(p => p.id === productId);
                      return product ? (
                        <div key={productId} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                          <p className="font-medium text-purple-800 dark:text-purple-200 text-sm">{product.name}</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">${product.price}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-8 py-6 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-300"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-3 bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Creating Supplier...</span>
                  </div>
                ) : (
                  'Confirm & Create Supplier'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-6 rounded-2xl shadow-2xl transform transition-all duration-500 animate-fade-in-up">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold">Supplier Created Successfully!</p>
                <p className="text-emerald-100">Your supplier and product assignments are now in the system</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}