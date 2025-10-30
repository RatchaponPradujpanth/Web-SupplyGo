import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const resendOTP = async (email: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/resend-otp`, { email });
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const message = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการส่ง OTP ใหม่';
    throw new Error(message);
  }
};
