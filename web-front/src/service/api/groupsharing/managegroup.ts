import { AxiosError } from "axios";
import axios from "axios";
import type { GroupOrderResponse } from "@/types/type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ManageGroupsResponse {
  store_balance: number;
  groups: GroupOrderResponse[];
}

export const managegroup = async (token: string): Promise<ManageGroupsResponse> => {
  if (!token) throw new Error("No token provided");

  try {
    const response = await axios.get<ManageGroupsResponse>(`${API_URL}/api/manage-groups`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Groups fetched:", response.data);
    return response.data;
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    const errorMsg = error.response?.data?.message ?? error.message ?? "Failed to load groups";

    console.error("❌ Error fetching groups:", errorMsg);
    throw new Error(errorMsg);
  }
};
