// src/service/api/groupsharing/topuppoint.ts
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // backend URL เช่น http://localhost:5001

/**
 * สร้าง PaymentIntent สำหรับ topup points
 * คืนค่า client_secret ของ Stripe
 */
export const createTopupPointPayment = async (token: string, points: number): Promise<string> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/topup-point`,
      { points }, // body ต้องมี points เท่านั้น
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // คืน client_secret ของ Stripe
    return response.data.client_secret;
  } catch (error) {
    console.error("❌ สร้าง topup payment ไม่สำเร็จ:", error);
    throw error;
  }
};
