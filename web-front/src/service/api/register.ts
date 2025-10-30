import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const RegisterUser = async (
  username: string,
  password: string,
  email: string,
  role: string,
  shop_name?: string // ✅ เพิ่มตรงนี้
): Promise<{ message: string; email?: string }> => {
  try {
    const response = await axios.post(`${API_URL}/api/register`, {
      username,
      password,
      email,
      role,
      shop_name, // ✅ ส่งค่าไป backend ด้วย
    });
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Register error";

    console.error("Register error:", errorMsg);
    throw new Error(errorMsg);
  }
};
