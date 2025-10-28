import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// interface ให้ตรงกับ backend
interface ConfirmPaymentResponse {
  success: boolean;
  status: string;
}

export const updatePaymentStatus = async (
  token: string,
  orderId: number
): Promise<ConfirmPaymentResponse> => {
  if (!token) throw new Error("No token provided");

  try {
    const response = await axios.post(
      `${API_URL}/api/confirm-payment/${orderId}`,
      {}, // body ว่าง
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data: ConfirmPaymentResponse = response.data;
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    } else {
      console.error("Unexpected error:", error);
      throw new Error("Unexpected error");
    }
  }
};
