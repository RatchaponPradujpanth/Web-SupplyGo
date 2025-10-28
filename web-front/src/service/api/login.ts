import axios from 'axios';
import type { LoginResponse } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loginUser = async (
  username: string,
  password: string
): Promise<string> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_URL}/api/login`, {
      username,
      password,
    });

    const { token } = response.data || {};

    if (!token) {
      throw new Error("Login failed: Missing token ");
    }

    localStorage.setItem("token", token); // เก็บ token ตรงนี้เลย

    return token;
  } catch (error: unknown) {
    // handle error
    throw error;
  }
};