import axios, { AxiosError } from 'axios';
import type { Product } from '@/types/type';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 1️⃣ สำหรับผู้ใช้ทั่วไป (public)
export const loadPublicProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/loaduserproduct`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching public products:", error);
    return [];
  }
};

// 2️⃣ สำหรับผู้ขายหรือแอดมินที่ล็อกอินแล้ว
export const loadShopProducts = async (token: string): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/loaduserproduct`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching shop products:", error);
    return [];
  }
};
