// @/service/api/shop/grouporder.ts

import axios from "axios";
import { GroupOrderUI } from "@/types/type"; // ✅ เปลี่ยนเป็น GroupOrderUI
import { data } from "framer-motion/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getGrouporder = async (token: string): Promise<GroupOrderUI[]> => { // ✅ เปลี่ยน type
  try {
    const response = await axios.get<{ message: string; data: GroupOrderUI[] }>( // ✅ เปลี่ยน type
      `${API_URL}/api/group-order`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(response.data.data)
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching group orders:", error);
    throw error;
  }
};