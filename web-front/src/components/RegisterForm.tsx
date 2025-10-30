'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RegisterUser } from '@/service/api/register';
import { useRouter } from 'next/navigation';

type RoleType = 'customer' | 'store' | 'admin';

interface RegisterFormProps {
  onSuccess: () => void;
  defaultRole?: RoleType;
}

export default function RegisterForm({ onSuccess, defaultRole = 'customer' }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleType>(defaultRole);
  const [shopName, setShopName] = useState(''); // เพิ่มช่องชื่อร้าน
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setShowMessage('❌ รหัสผ่านไม่ตรงกัน');
      setTimeout(() => setShowMessage(null), 3000);
      return;
    }

    if (role === 'store' && !shopName.trim()) {
      setShowMessage('❌ กรุณากรอกชื่อร้านค้า');
      setTimeout(() => setShowMessage(null), 3000);
      return;
    }

    try {
      const result = await RegisterUser(username, password, email, role, shopName);

      if (result.email) {
        setShowMessage('📧 ได้ส่งรหัสยืนยัน (OTP) ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย');
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(result.email ?? '')}`);
        }, 2000);
      } else {
        setShowMessage('🎉 สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ...');
        setTimeout(() => {
          setShowMessage(null);
          onSuccess();
          setUsername('');
          setPassword('');
          setConfirmPassword('');
          setEmail('');
          setRole(defaultRole);
          setShopName('');
        }, 2000);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'การสมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      setShowMessage(`❌ ${errorMsg}`);
      setTimeout(() => setShowMessage(null), 3000);
    }
  };

  return (
    <div className="relative">
      {/* Toast Message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {showMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Card */}
      <div className="bg-white rounded-card shadow-card p-8 w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center">สร้างบัญชีของคุณ</h1>
        <div className="mt-6 grid md:grid-cols-2 gap-3">
          <input
            placeholder="ชื่อผู้ใช้"
            className="bg-bgpage rounded-input px-4 py-2 outline-none"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            placeholder="อีเมล"
            type="email"
            className="bg-bgpage rounded-input px-4 py-2 outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            placeholder="รหัสผ่าน"
            type="password"
            className="bg-bgpage rounded-input px-4 py-2 outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <input
            placeholder="ยืนยันรหัสผ่าน"
            type="password"
            className="bg-bgpage rounded-input px-4 py-2 outline-none"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          <select
            className="md:col-span-2 bg-bgpage rounded-input px-4 py-2 outline-none"
            value={role}
            onChange={e => setRole(e.target.value as RoleType)}
          >
            <option value="customer">สมัครเป็นลูกค้า</option>
            <option value="store">สมัครเป็นร้านค้า</option>
            <option value="admin">สมัครเป็นผู้ดูแลระบบ</option>
          </select>

          {/* ช่องชื่อร้านอยู่ตำแหน่งเดิม แต่ซ่อนเมื่อไม่ใช่ store */}
          <input
            placeholder="ชื่อร้านค้าของคุณ"
            className={`md:col-span-2 bg-bgpage rounded-input px-4 py-2 outline-none ${role !== 'store' ? 'hidden' : ''}`}
            value={shopName}
            onChange={e => setShopName(e.target.value)}
          />

          <button
            onClick={handleRegister}
            className="md:col-span-2 rounded-pill bg-primary text-white py-3 hover:bg-blue-700 transition-all duration-300"
          >
            สมัครสมาชิก
          </button>
        </div>
      </div>
    </div>
  );
}
