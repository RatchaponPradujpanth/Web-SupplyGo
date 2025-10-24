// @/service/api/shop/grouporder.ts

import axios from "axios";
import type { GroupOrderUI } from "@/types/type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getGrouporder = async (token: string): Promise<GroupOrderUI[]> => { 
  try {
    const response = await axios.get<{ message: string; data: GroupOrderUI[] }>(
      `${API_URL}/api/group-order`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
        //console.log(JSON.stringify(response.data.data, null, 2));

    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching group orders:", error);
    throw error;
  }
};
