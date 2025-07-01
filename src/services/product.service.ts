import { Auth_URL } from '../lib/apiEndPoints';
import myAxios from "../lib/axios.config";

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
    categoryIds?: string[];
    supplierIds?: string[];
  }

  
  export const getProducts = async (): Promise<Product[]> => {
    try {
      const response = await myAxios.get(Auth_URL + '/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  };