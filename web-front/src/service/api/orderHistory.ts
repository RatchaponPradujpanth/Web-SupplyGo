import axios, { AxiosError } from 'axios';
import type { OrderHistoryResponse } from '@/types/type'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

export const getOrderHistory = async (token: string): Promise<OrderHistoryResponse> => {
  try {
    const response = await axios.get<OrderHistoryResponse>(`${API_URL}/api/orderhistory`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ:", error.message);
    throw error;
  }
};