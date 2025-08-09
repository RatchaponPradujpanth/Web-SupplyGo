import axios from 'axios';
import type { CheckoutItem , CheckoutSummary} from '@/types/type';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getCartSummary = async (token: string): Promise<CheckoutSummary> => {
  try {
    const response = await axios.get<CheckoutSummary>(`${API_URL}/api/cartsummary`, {
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