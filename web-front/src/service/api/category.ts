import axios, { AxiosError } from 'axios';
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
  console.log("📤 Sending request to getProductsByCategory with:", {
    categoryName,
    page,
    sort,
  });

  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/products`, {
      params: {
        category: categoryName,
        page,
        sort,
      },
    });

    console.log("✅ Received response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error fetching products by category:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};


