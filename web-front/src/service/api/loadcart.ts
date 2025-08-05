import axios, { AxiosError } from 'axios';
import type { CartResponse,CartItem } from '@/types/type';



const API_URL = process.env.NEXT_PUBLIC_API_URL ;

export const cartUser = async (token: string): Promise<CartResponse> => {
  try {
    const response = await axios.get<CartResponse>(`${API_URL}/api/cart`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ต้องใส่ token
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ โหลดตะกร้าไม่ได้:", error.message);
    throw error;
  }
};