import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const savetransaction = async (
  token: string,
  shopId: number,
  orderShopId: number,
  paymentIntentId: string
) => {
  try {
    if (!token) {
      throw new Error("Authentication token is missing");
    }

    const response = await axios.post(
      `${API_URL}/api/save-transaction`,
      {
        shopId,
        orderShopId,
        paymentIntentId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "save transaction failed";

    console.error("save transaction error:", errorMsg);
    throw new Error(errorMsg);
  }
};
