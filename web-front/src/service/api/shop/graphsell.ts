import axios from "axios";
import { GraphSellResponse } from "@/types/type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getGraphSell = async (
  token: string,
  startDate: string, // ส่งเป็น 'YYYY-MM-DD'
  endDate: string
): Promise<GraphSellResponse> => {
  try {
    const response = await axios.post<GraphSellResponse>(
      `${API_URL}/api/graph-sell`,
      { startDate, endDate }, // ✅ body ของ POST
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching graph sell:", error);
    throw error;
  }
};
