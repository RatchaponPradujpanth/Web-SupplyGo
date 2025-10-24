import axios from 'axios';
import type { CheckoutItem , CartSummaryResponse} from '@/types/type';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getCartSummary = async (token: string): Promise<CartSummaryResponse> => {
  try {
    const response = await axios.get<CartSummaryResponse>(`${API_URL}/api/cartsummary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ โหลดข้อมูลสรุปตะกร้าไม่สำเร็จ:", error.message);
    throw error;
  }
};