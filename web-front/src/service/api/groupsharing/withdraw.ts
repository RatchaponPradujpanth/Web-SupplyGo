import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const withdraw = async (token: string, points: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/withdraw`,
      { points },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return response.data; 
  } catch (error: any) {
    throw error;
  }
};