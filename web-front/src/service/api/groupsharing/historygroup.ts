import axios from "axios";
import type { GroupBuying } from '@/types/GroupBuying';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const historygroup = async (token:string):Promise<GroupBuying[]> =>{
    try {
        const response = await axios.get(`${API_URL}/api/history-group`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        console.log('API Response (raw):', data);

        // Normalize response: backend may return { groups: [...] } or [...]
        if (Array.isArray(data)) {
          return data as GroupBuying[];
        }

        if (data && Array.isArray((data as any).groups)) {
          return (data as any).groups as GroupBuying[];
        }

        console.warn('Unexpected history-group response shape, returning empty array');
        return [];

  } catch (error) {
    console.error("Load history group buying error:", error);
    throw error;
    }
}