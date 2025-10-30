import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createStore = async (shop_name: string, address?: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/create-store`,
      { shop_name, address },
      {
        headers: {
          // สมมติว่ามี token อยู่ใน localStorage หรือ context
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    return response.data; // { message, shop }
  } catch (error: any) {
    console.error('❌ Create store API error:', error);
    // throw ขึ้นไปให้ frontend handle
    throw error.response?.data || { message: 'เกิดข้อผิดพลาด' };
  }
};
