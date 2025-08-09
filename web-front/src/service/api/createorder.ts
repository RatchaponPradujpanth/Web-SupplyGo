import axios from 'axios';
import type { CreateOrderPayload, CreateOrderResponse } from '@/types/type'; // type สำหรับ request/response

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createOrder = async (
  token: string,
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> => {
  try {
    console.log("🚀 ส่ง createOrder payload:", payload);

    const response = await axios.post<CreateOrderResponse>(`${API_URL}/api/create-order`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ createOrder response data:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ สร้างคำสั่งซื้อไม่สำเร็จ:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
};
