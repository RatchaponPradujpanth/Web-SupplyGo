import axios from "axios";
import type { GroupBuying } from '@/types/type';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const historygroup = async (token:string):Promise<GroupBuying[]> =>{
    try {
        const response = await axios.get<{ groups: GroupBuying[] }>(`${API_URL}/api/history-group`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("history GroupBuying fetched:", response.data);
    return response.data.groups; // ✅ ตรงกับ backend key 'groups'

  } catch (error) {
    console.error("Load history group buying error:", error);
    throw error;
    }
}