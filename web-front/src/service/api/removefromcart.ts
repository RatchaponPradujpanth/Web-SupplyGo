import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function removefromcart(
  product_id: number,
  variant_id?: number,
  variant_option_ids?: number[]
) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token is missing");
    }

    const response = await axios.delete(
      `${API_URL}/api/remove-cart`, 
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        data: {
          product_id,
          variant_id,
          variant_option_ids,
        }
      }
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;

    console.error("🔴 Remove cart error:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Remove from cart failed");
  }
}
