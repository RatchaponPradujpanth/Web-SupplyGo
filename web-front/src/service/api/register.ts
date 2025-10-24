import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const RegisterUser = async (
  username: string,
  password: string,
  email: string,
  role: string,
): Promise<{ message: string; email?: string }> => {
  try {
    const response = await axios.post(`${API_URL}/api/register`, {
      username,
      password,
      email,
      role,
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