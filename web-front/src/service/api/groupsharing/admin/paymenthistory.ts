import axios, { AxiosError } from "axios";
import type { PaymentHistoryResponse, PaymentHistoryOrder } from "@/types/type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const paymentHistory = async (token : string): Promise<PaymentHistoryOrder[]> => {
  try {
    const response = await axios.get<PaymentHistoryResponse>(`${API_URL}/api/payment-history`, {
       headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
    });

    if (!response.data.success) {
      throw new Error("Failed to fetch payment history");
    }

    console.log("✅ Payment history fetched:", response.data.data);
    return response.data.data; // คืน array ของ order
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Failed to load payment history";

    console.error("Error fetching payment history:", errorMsg);
    throw new Error(errorMsg);
  }
};
