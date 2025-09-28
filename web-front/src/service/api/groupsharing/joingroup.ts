import axios, { AxiosError } from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function joingroup(
  group_buying_id: number,
  points: number,
  address_id: number,
) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token is missing");
    }

    const response = await axios.post(
      `${API_URL}/api/join-group`,
      { group_buying_id, points , address_id },
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
      err.response?.data?.message || err.message || "join group failed";

    console.error("Join group error:", errorMsg);
    throw new Error(errorMsg);
  }
}
