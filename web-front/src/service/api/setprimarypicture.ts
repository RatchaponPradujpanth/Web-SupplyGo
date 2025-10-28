import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const primarypicture = async (productId: number, imageId: number): Promise<void> => {
  try {
    // ตรวจสอบ API_URL ก่อน
    if (!API_URL) {
      throw new Error('API_URL is not defined in environment variables');
    }

    // ดึง token จาก localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found. Please login again.');
    }

    await axios.patch(
      `${API_URL}/api/primary-picture`,
      {
        productId,
        imageId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // เพิ่ม Authorization header
        },
        timeout: 30000, // เพิ่มเป็น 30 วินาที
      }
    );

    alert("ตั้งรูปหลักสำเร็จ");

  } catch (error) {
    console.error("❌ Full Error:", error);
    
    if (error instanceof AxiosError) {
      console.error("📊 Error Details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        responseData: error.response?.data
      });
      
      if (error.response?.status === 401) {
        alert('Token หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่');
        // เคลียร์ token และ redirect ไปหน้า login
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert('ไม่มีสิทธิ์ในการดำเนินการนี้');
      } else if (error.code === 'ECONNABORTED') {
        alert('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
      } else if (error.code === 'ERR_NETWORK') {
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else {
        alert(`เกิดข้อผิดพลาด: ${error.response?.data?.error || error.message}`);
      }
    } else if (error instanceof Error) {
      if (error.message.includes('Token not found')) {
        alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        window.location.href = '/login';
      } else {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
      }
    } else {
      alert('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
    }
  }
};