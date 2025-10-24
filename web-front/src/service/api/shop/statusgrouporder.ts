import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function updateTrackingNumber(groupMemberId: number, trackingNumber: string) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token is missing");
    }

    const response = await axios.patch(
      `${API_URL}/api/group-order/tracking`,
      {
        groupMemberId,
        trackingNumber,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string; error?: string }>;
    const errorMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Update tracking number failed";

    console.error("Update tracking number error:", errorMsg);
    throw new Error(errorMsg);
  }
}
