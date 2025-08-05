import axios, { AxiosError } from 'axios';
import type { Product } from '@/types/product';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function addtocart(
  product_id: number,
  quantity: number,
  variant_id?: number,
  option_value_id?: number[]
) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token is missing");
    }

    console.log("🔔 API call addtocart with:", { product_id, quantity, variant_id, option_value_id });

    const response = await axios.post(
      `${API_URL}/api/addtocart`, 
      {
        product_id,
        quantity,
        variant_id,
        option_value_id,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Add to cart failed";

    console.error("Add to cart error:", errorMsg);
    throw new Error(errorMsg);
  }
}
