import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PendingWithdrawalsResponse {
  withdrawals: {
    store_withdrawals_id: number;
    shop_id: number;
    points: number;
    status: string;
    requested_at: string;
    store: {
      shop_name: string;
      stripe_account_id: string;
    };
  }[];
}

export const getPendingWithdrawals = async (token: string): Promise<PendingWithdrawalsResponse> => {
  try {
    const response = await axios.get(`${API_URL}/api/pending-withdrawals`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ Fetch pending withdrawals error:", error.response?.data || error.message);
    throw error;
  }
};
