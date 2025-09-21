import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createTopupPointPayment = async (token: string, points: number) : Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/api/topup-point`, { points }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.client_secret; // คืน client_secret ของ stripe
  } catch (error: any) {
    console.error("❌ สร้าง topup payment ไม่สำเร็จ:", error.message);
    throw error;
  }
};