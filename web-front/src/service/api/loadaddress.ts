import axios, { AxiosError } from 'axios';
import type { Address } from "@/types/type";

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

export const loadaddress = async (token: string): Promise<Address[]> => {
  try {
    const response = await axios.get<{ addresses: Address[] }>(`${API_URL}/api/address`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.addresses;
  } catch (error) {
    console.error("Load address error:", error);
    throw error;
  }
};