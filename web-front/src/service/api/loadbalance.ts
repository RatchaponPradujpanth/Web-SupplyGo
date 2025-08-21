import axios from 'axios';
import type { userpoint } from '@/types/type';


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loadbalance = async (token : string): Promise<{balance : number}> =>{
    try {
        const response = await axios.get<{balance : number}>(
            `${API_URL}/api/loadbalance`,
            {
                headers : {
                    Authorization : `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Load store name error:", error);
        throw error;
    }
}