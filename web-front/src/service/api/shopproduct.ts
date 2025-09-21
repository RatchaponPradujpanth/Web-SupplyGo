import axios, { AxiosError } from 'axios';
import type { Product } from "@/types/product";



const API_URL = process.env.NEXT_PUBLIC_API_URL ;

export const loadproduct = async (token: string): Promise<Product[]> => {
  if (!token) throw new Error("No token provided");
  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/manageproducts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Products fetched:", response.data);
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Failed to load products";

    if (errorMsg === "No products found") {
      console.warn("⚠️ No products found, returning empty list.");
      return [];
    }

    console.error("Error fetching products:", errorMsg);
    throw new Error(errorMsg);
  }
};
