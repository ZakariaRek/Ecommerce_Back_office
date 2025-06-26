import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import API_GATEWAY_BASE_URL from "../../../env";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  weight: number;
  dimensions: string;
  images: string[];
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  createdAt: string;
  updatedAt: string;
}

// Helper function to get cookie value (improved version)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const getCookie = (name: string): string | null => {
//   const cookies = document.cookie.split(';');
//   for (let cookie of cookies) {
//     const [cookieName, ...cookieValue] = cookie.trim().split('=');
//     if (cookieName === name) {
//       return cookieValue.join('=') || null;
//     }
//   }
//   return null;
// };
const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) { // Changed from 'let' to 'const'
    const [cookieName, ...cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue.join('=') || null;
    }
  }
  return null;
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
};

// Token management - consider moving to a separate auth service
const getAuthToken = (): string | null => {
  // Try to get token from cookie first - check multiple possible cookie names
  let tokenFromCookie = getCookie('token') || getCookie('auth-token') || getCookie('userservice');
  
  if (tokenFromCookie) {
    // Decode URL-encoded token and remove extra quotes
    tokenFromCookie = decodeURIComponent(tokenFromCookie);
    
    // Remove surrounding quotes if they exist
    if (tokenFromCookie.startsWith('"') && tokenFromCookie.endsWith('"')) {
      tokenFromCookie = tokenFromCookie.slice(1, -1);
    }
    
    console.log('Token from cookie (cleaned):', tokenFromCookie);
    return tokenFromCookie;
  }
  
  // Fallback to localStorage (if needed)
  try {
    const tokenFromStorage = localStorage.getItem('auth-token');
    console.log('Token from localStorage:', tokenFromStorage);
    return tokenFromStorage;
  } catch {
    return null;
  }
};
export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Temporary fix: Since user-service cookie is HttpOnly and not accessible to JavaScript,
        // we'll use the working JWT token from Postman for testing
        // TODO: Implement proper token management with backend team
        // const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbnVzZXIxMjM0Iiwicm9sZXMiOlsiUk9MRV9BRE1JTiJdLCJpYXQiOjE3NTA5NjUzMTEsImV4cCI6MTc1MTA1MTcxMX0._5S2g_kc0fHqYEPHq5lkad-GAdB2vwmPS-wOfNrPeus';
        const token = getAuthToken();
        console.log("token",token);
        if (!token) {
          throw new Error('Authentication token not found');
        }
        console.log(`${API_GATEWAY_BASE_URL}/users`);

        const response = await fetch(`${API_GATEWAY_BASE_URL}/products/products`, {
          method: 'GET',  
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            // 'Accept': 'application/json',
            // 'Access-Control-Allow-Origin':'*',
            // 'Access-Control-Allow-Methods':'GET'
          },
          // Enable CORS credentials
          credentials: 'include',
          // Prevent redirect following in some cases
          // redirect: 'follow'
          // credentials: 'include',
        });
        console.log("response",response);
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm dark:border-white/[0.08] dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-200/60 bg-white shadow-sm dark:border-red-500/20 dark:bg-gray-900/40">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-red-600 dark:text-red-400 font-medium">Error loading products</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-gray-900/40">
      <div className="px-6 py-5 border-b border-gray-200/60 dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product Inventory</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{products.length} products found</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Live Data</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02]">
            <TableRow className="border-b border-gray-200/60 dark:border-white/[0.08]">
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Product
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                SKU & Status
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Price & Stock
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Details
              </TableCell>
              <TableCell
                isHeader
                className="px-6 py-4 font-semibold text-gray-700 text-start text-xs uppercase tracking-wider dark:text-gray-300"
              >
                Updated
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-200/60 dark:divide-white/[0.08]">
            {products.map((product) => (
              <TableRow 
                key={product.id} 
                className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150"
              >
                <TableCell className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          width={48}
                          height={48}
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="hidden w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1">
                        {product.name}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {product.sku}
                      </span>
                    </div>
                    <Badge
                      size="sm"
                      color={
                        product.status === "ACTIVE"
                          ? "success"
                          : product.status === "INACTIVE"
                          ? "warning"
                          : "error"
                      }
                    >
                      {product.status}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-5">
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {formatCurrency(product.price)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${product.stock > 20 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {product.stock} in stock
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-5">
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <div>Weight: {product.weight}kg</div>
                    <div className="text-xs">
                      ID: {product.id.slice(0, 8)}...
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-5">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(product.updatedAt)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {products.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
          </div>
        </div>
      )}
    </div>
  );
}