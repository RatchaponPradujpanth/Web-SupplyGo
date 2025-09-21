import axios from 'axios';
import type { GroupBuying } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loadgroupbuy = async (): Promise<GroupBuying[]> => {
  try {
    const response = await axios.get<{ groups: GroupBuying[] }>(`${API_URL}/api/loadgroup`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ GroupBuying fetched:", response.data);
    return response.data.groups; // ✅ ตรงกับ backend key 'groups'

  } catch (error) {
    console.error("Load group buying error:", error);
    throw error;
  }
};
