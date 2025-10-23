import axios, { AxiosError } from 'axios';
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
      throw new Error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
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
    const err = error as AxiosError<{ message?: string, error?: string }>;
    
    // จัดการกรณี token หมดอายุหรือไม่ถูกต้อง
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("token");
      const tokenError = err.response?.data?.message || "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่";
      console.error("🔐 Token error:", tokenError);
      throw new Error(tokenError);
    }

    // จัดการ error อื่นๆ
    const errorMsg =
      err.response?.data?.error || 
      err.response?.data?.message || 
      err.message || 
      "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้";

    console.error("❌ Add to cart error:", {
      status: err.response?.status,
      message: errorMsg,
      data: err.response?.data
    });
    
    throw new Error(errorMsg);
  }
}
