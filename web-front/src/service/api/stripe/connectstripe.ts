import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const confirmStripeConnect = async (
  acct_id: string,
  token: string
): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/api/connect`, {
      params: { acct_id },
      headers: {
        Authorization: `Bearer ${token}` // ✅ ส่ง token ไปที่ backend
      }
    });

    return response.data; // เช่น "เชื่อมบัญชี Stripe สำเร็จ"
  } catch (error: any) {
    console.error("❌ Stripe connect confirm error:", error.message);
    throw error;
  }
};
