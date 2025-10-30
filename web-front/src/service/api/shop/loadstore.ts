import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loadstorename = async (
  token: string
): Promise<{
  shop_name: string | null;
  shop_id: number | null;
  stripe_account_id?: string | null;
  points: number;
}> => {
  try {
    console.log("📦 Loading store with token:", token);
    
    const response = await axios.get<{
      shop_name: string | null;
      shop_id: number | null;
      stripe_account_id?: string | null;
      points: number;
    }>(`${API_URL}/api/loadstorename`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Store data loaded:", response.data);
    
    return response.data;
  } catch (error: any) {
    console.error("❌ Load store name error:", error);
    
    // ถ้า error เป็น 404 หรือ ไม่มีร้าน = return null data
    if (error.response?.status === 404 || error.response?.data?.message === 'Store not found') {
      console.log("⚠️ Store not registered yet");
      return {
        shop_name: null,
        shop_id: null,
        stripe_account_id: null,
        points: 0,
      };
    }
    
    throw error;
  }
};