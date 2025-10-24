import axios from 'axios';
import type { Category , Product  } from '../../types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await axios.get<Category[]>(`${API_URL}/api/categories`);
    return response.data;
  } catch (error) {
    console.error("❌ ดึง category ไม่สำเร็จ:", error);
    return [];
  }
};

export const getProductsByCategory = async (
  categoryName: string,
  page?: number,
  sort?: string
): Promise<Product[]> => {
  try {
    // ✅ Decode URI component ก่อนส่งไป backend (กรณีที่มาจาก URL)
    const decodedCategoryName = decodeURIComponent(categoryName);
    
    console.log("📤 Fetching products for category:", decodedCategoryName);
    
    const response = await axios.get<Product[]>(`${API_URL}/api/products`, {
      params: {
        category: decodedCategoryName,
        page,
        sort,
      },
    });

    console.log("✅ Received response:", response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Error fetching products by category:", errorMessage);
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
      console.error("Status code:", error.response?.status);
    }
    throw error;
  }
};


