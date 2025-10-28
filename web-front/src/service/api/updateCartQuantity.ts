import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UpdateCartQuantityRequest {
  cart_item_id: number;
  quantity: number;
}

export interface UpdateCartQuantityResponse {
  message: string;
  cart_item: {
    cart_item_id: number;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    product_name: string;
  };
}

export const updateCartQuantity = async (
  token: string,
  data: UpdateCartQuantityRequest
): Promise<UpdateCartQuantityResponse> => {
  try {
    const response = await axios.put<UpdateCartQuantityResponse>(
      `${API_URL}/api/update-cart-quantity`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปเดตจำนวนสินค้า";
    console.error("❌ อัปเดตจำนวนสินค้าไม่สำเร็จ:", errorMessage);
    throw error;
  }
};