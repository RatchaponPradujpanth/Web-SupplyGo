import axios, { AxiosError } from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function cancelgroup(
  group_buying_id: number,
) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token is missing");
    }

    const response = await axios.post(
      `${API_URL}/api/cancel-group-order`,
      { group_buying_id, },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "cancel-group failed";

    console.error("cancel-group error:", errorMsg);
    throw new Error(errorMsg);
  }
}
