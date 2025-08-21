import axios from 'axios';
import type { CreateOrderPayload, CreateOrderResponse } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createOrder = async (
  token: string,
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> => {
  try {
    console.log("🚀 ส่ง createOrder payload:", payload);
    
    // Log แต่ละ cartItem เพื่อ debug
    payload.cartItems.forEach((item, index) => {
      console.log(`📦 Cart Item ${index + 1}:`, {
        productId: item.productId,
        quantity: item.quantity,
        shopId: item.shopId,
        variant_id: item.variant_id,
        variant_option_ids: item.variant_option_ids,
        total_price: item.total_price
      });
    });

    const response = await axios.post<CreateOrderResponse>(
      `${API_URL}/api/create-order`, 
      payload, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ createOrder response data:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ สร้างคำสั่งซื้อไม่สำเร็จ:", error.message);
    
    if (error.response) {
      console.error("📄 Response data:", error.response.data);
      console.error("🔢 Response status:", error.response.status);
      console.error("📋 Response headers:", error.response.headers);
      
      // Log specific error details
      if (error.response.data?.message) {
        console.error("💬 Error message:", error.response.data.message);
      }
    }
    
    if (error.request) {
      console.error("📡 Request was made but no response received:", error.request);
    }
    
    throw error;
  }
};