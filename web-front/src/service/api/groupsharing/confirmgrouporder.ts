import axios, { AxiosError } from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ เปลี่ยนชื่อเป็น confirmGroupOrder จะตรงความหมายกว่า
export async function confirmGroupOrder(group_buying_id: number) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token is missing");
    }

    const response = await axios.post(
      `${API_URL}/api/confirm-group-order`,
      { group_buying_id },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "confirm-group-order failed";

    console.error("Confirm group order error:", errorMsg);
    throw new Error(errorMsg);
  }
}
