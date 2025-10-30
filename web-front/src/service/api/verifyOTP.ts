import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/verify-otp`, { email, otp });
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const message = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการยืนยัน OTP';
    throw new Error(message);
  }
};
