import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loadbalance = async (token: string): Promise<number> => {
  try {
    console.log("📤 Sending request to load balance with token:", token);

    const response = await axios.get<number>(`${API_URL}/api/loadbalance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📥 Response from loadbalance API:", response.data);

    return response.data; // response.data เป็น number
  } catch (error: any) {
    console.error("❌ Load balance error:", error.response?.data || error.message);
    throw error;
  }
};
