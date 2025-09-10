import axios, { AxiosError } from 'axios';
import type { Product } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loaduserproduct = async (): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/loaduserproduct`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Products fetched:", response.data);
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Failed to load products";

    console.error("Error fetching products:", errorMsg);
    throw new Error(errorMsg);
  }
};