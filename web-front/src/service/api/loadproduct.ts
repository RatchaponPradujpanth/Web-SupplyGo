import axios, { AxiosError } from 'axios';
import type { Product } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 1️⃣ สำหรับผู้ใช้ทั่วไป (public)
export const loadPublicProducts = async (): Promise<Product[]> => {
  try {
    const url = `${API_URL}/api/loaduserproduct`;


    const response = await axios.get<Product[]>(url);
    console.log("✅ [loadPublicProducts] Data received:", response.data);

    return response.data;
  } catch (error: unknown) {
    console.error("❌ [loadPublicProducts] Error fetching public products:", error);
    return [];
  }
};

// 2️⃣ สำหรับผู้ขายหรือแอดมินที่ล็อกอินแล้ว
export const loadShopProducts = async (token: string): Promise<Product[]> => {
  try {
    const url = `${API_URL}/api/loaduserproduct`;


    const response = await axios.get<Product[]>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ [loadShopProducts] Data received:", response.data);

    return response.data;
  } catch (error: unknown) {
    console.error("❌ [loadShopProducts] Error fetching shop products:", error);

    // Optional: แสดง error response ถ้ามี
    if (axios.isAxiosError(error)) {
      console.error("🧾 Axios error response:", error.response?.data);
    }

    return [];
  }
};
