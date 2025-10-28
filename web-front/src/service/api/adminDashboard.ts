import axios, { AxiosError } from 'axios';
import type { AdminDashboardApiResponse } from '../../types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const admindashboard = async (token: string): Promise<AdminDashboardApiResponse> => {
  if (!token) throw new Error("No token provided");

  try {
    const response = await axios.get<AdminDashboardApiResponse>(`${API_URL}/api/admindashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg = err.response?.data?.message || err.message || "Failed to load dashboard";
    console.error("Error fetching dashboard:", errorMsg);
    throw new Error(errorMsg);
  }
};
