// @/service/api/shop/grouporder.ts

import axios from "axios";
import type { GroupOrderResponse } from "@/types/type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getGrouporder = async (token: string): Promise<GroupOrderResponse[]> => { 
  try {
    const response = await axios.get<{ message: string; data: GroupOrderResponse[] }>(
      `${API_URL}/api/group-order`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching group orders:", error);
    throw error;
  }
};
