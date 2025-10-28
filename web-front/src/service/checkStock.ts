import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CheckStockItem {
  productId: number;
  quantity: number;
  variantId?: number | null;
}

export interface InsufficientStockItem {
  product_id: number;
  variant_id: number | null;
  product_name: string;
  requested_quantity: number;
  available_stock: number;
  variant_info?: string;
}

export interface CheckStockResponse {
  available: boolean;
  message: string;
  insufficientItems?: InsufficientStockItem[];
}

/**
 * เช็คว่าสินค้าในตะกร้ามีสต็อกเพียงพอหรือไม่
 */
export const checkStock = async (
  token: string,
  cartItems: CheckStockItem[]
): Promise<CheckStockResponse> => {
  try {
    const response = await axios.post<CheckStockResponse>(
      `${API_URL}/api/check-stock`,
      { cartItems },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Stock check failed:", error);
    
    throw error;
  }
};