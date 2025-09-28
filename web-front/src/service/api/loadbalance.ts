import axios from 'axios';
import type { userpoint } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loadbalance = async (token: string): Promise<{ points: number }> => {
  try {
    console.log("📤 Sending request to load balance with token:", token);

    const response = await axios.get<{ points: number }>(`${API_URL}/api/loadbalance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📥 Response from loadbalance API:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ Load balance error:", error.response?.data || error.message);
    throw error;
  }
};
