import axios from 'axios';
import type { CreateOrderPayload, CreateOrderResponse } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createOrder = async (
  token: string,
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> => {
  try {
    const response = await axios.post<CreateOrderResponse>(
      `${API_URL}/api/create-order`, 
      payload, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ สร้างคำสั่งซื้อไม่สำเร็จ:", error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown; status?: number } };
      console.error("📄 Response data:", axiosError.response?.data);
      console.error("🔢 Response status:", axiosError.response?.status);
    }
    
    throw error;
  }
};