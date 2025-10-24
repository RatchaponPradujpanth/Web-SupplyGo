import axios from 'axios';
import type { GroupOrderUI } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// type ใหม่: response ของ API คือ { groups: GroupOrderUI[] }
export interface GetGroupOrderHistoryResponse {
  groups: GroupOrderUI[];
}

export const getOrderHistory = async (token: string): Promise<GetGroupOrderHistoryResponse> => {
  try {
    const response = await axios.get<GetGroupOrderHistoryResponse>(`${API_URL}/api/orderhistory`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // log แบบสวย ๆ
    console.log('✅ Order history loaded:', response.data);
    console.log('Raw response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('❌ โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ:', error.message);
    throw error;
  }
};
