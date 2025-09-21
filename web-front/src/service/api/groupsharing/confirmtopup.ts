import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ConfirmTopupResponse {
  success: boolean;
  status: string;
  pointsAdded?: number;
  message?: string;
}

export const updateTopupStatus = async (
  token: string,
  transactionId: string // ต้องเป็น string เพราะ Stripe transactionId เป็น string
): Promise<ConfirmTopupResponse> => {
  if (!token) throw new Error("No token provided");

  try {
    const response = await axios.post<ConfirmTopupResponse>(
      `${API_URL}/api/confirm-topup/${transactionId}`,
      {}, // body ว่าง
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data; // คืน response.data เพื่อ frontend ใช้งานต่อ
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message);
    } else {
      console.error("Unexpected error:", error);
      throw new Error("Unexpected error");
    }
  }
};
