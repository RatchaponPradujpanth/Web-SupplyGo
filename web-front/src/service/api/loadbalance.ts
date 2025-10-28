import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loadbalance = async (token: string): Promise<number> => {
  try {
    const response = await axios.get<number>(`${API_URL}/api/loadbalance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // response.data เป็น number
  } catch (error) {
    console.error("❌ Load balance error:", error);
    throw error;
  }
};
