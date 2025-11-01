'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyOTP } from '@/service/api/verifyOTP';
import { resendOTP } from '@/service/api/resendOTP';
import { useToast } from '@/components/Toast';

export default function VerifyOTPPage() {
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 นาที
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // อ่าน email จาก query
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      router.push('/register');
    }
  }, [searchParams, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ยืนยัน OTP
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return;

    setLoading(true);
    try {
      await verifyOTP(email, otp);
      showToast('สมัครสมาชิกสำเร็จ!', 'success');
      router.push('/login');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      showToast(msg, 'error');
    }
    setLoading(false);
  };

  // ส่ง OTP ใหม่
  const handleResendOTP = async () => {
    if (!email) return;
    try {
      await resendOTP(email);
      showToast('ส่งรหัส OTP ใหม่แล้ว กรุณาตรวจสอบอีเมล', 'success');
      setOTP('');
      setCountdown(300); // รีเซ็ต countdown
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่ง OTP ใหม่';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          ยืนยันรหัส OTP
        </h1>
        <p className="text-center mb-6 text-gray-600">
          กรุณากรอกรหัส OTP ที่ส่งไปยัง
          <br />
          <span className="font-semibold text-blue-600">{email}</span>
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            placeholder="รหัส OTP 6 หลัก"
            value={otp}
            onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full p-4 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className={`w-full p-3 rounded-lg transition text-white font-semibold ${
              loading || otp.length !== 6
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'กำลังยืนยัน...' : 'ยืนยัน OTP'}
          </button>
        </form>
        <div className="mt-6 text-center space-y-2">
          {countdown > 0 ? (
            <p className="text-gray-600">
              รหัส OTP หมดอายุใน:{' '}
              <span className="font-semibold text-red-600">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </span>{' '}
              นาที
            </p>
          ) : (
            <p className="text-red-600 font-semibold">รหัส OTP หมดอายุแล้ว</p>
          )}
          <div>
            <p className="text-gray-600 mb-2">ไม่ได้รับรหัส OTP?</p>
            <button
              onClick={handleResendOTP}
              className="text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              ส่งรหัส OTP ใหม่
            </button>
          </div>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/register')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← กลับไปหน้าสมัครสมาชิก
          </button>
        </div>
      </div>
    </div>
  );
}