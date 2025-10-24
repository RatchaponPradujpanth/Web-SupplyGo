import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface WithdrawResponse {
  success: boolean;
  message: string;
  clientSecret?: string; // ✅ เพิ่มตรงนี้
  withdrawal?: {
    store_withdrawals_id: number;
    shop_id: number;
    points: number;
    status: string;
    approved_at?: string;
    approved_by_user_id?: number;
    stripe_tx?: string;
  };
}


// ฟังก์ชัน approve withdrawal
export const approveWithdrawal = async (
  token: string,
  store_withdrawals_id: number
): Promise<WithdrawResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/approve-withdraw`,
      { store_withdrawals_id }, // body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("✅ Withdrawal approved:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Approve withdrawal error:", error.response?.data || error.message);
    throw error;
  }
};
