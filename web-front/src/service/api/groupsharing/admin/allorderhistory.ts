import axios, { AxiosError } from "axios";
import type { AdminOrderHistoryOrder, AdminOrderHistoryResponse } from "@/types/type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const allOrderHistory = async (token: string): Promise<AdminOrderHistoryOrder[]> => {
  try {
    const response = await axios.get<AdminOrderHistoryResponse>(`${API_URL}/api/all-orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data.success) {
      throw new Error("Failed to fetch all orders");
    }

    return response.data.data; // คืน array ของ order
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Failed to load all orders";

    console.error("Error fetching all orders:", errorMsg);
    throw new Error(errorMsg);
  }
};
