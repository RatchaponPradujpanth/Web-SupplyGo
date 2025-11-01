'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RegisterUser } from '@/service/api/register';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<string>('');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const router = useRouter();

  // ฟังก์ชันตรวจสอบความปลอดภัยของรหัสผ่าน
  const validatePassword = (pwd: string): { valid: boolean; message: string; strength: string } => {
    if (pwd.length < 8) {
      return { valid: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', strength: 'weak' };
    }
    
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (criteriaCount < 3) {
      return { 
        valid: false, 
        message: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษอย่างน้อย 3 ประเภท', 
        strength: 'medium' 
      };
    }
    
    if (criteriaCount === 4 && pwd.length >= 12) {
      return { valid: true, message: 'รหัสผ่านแข็งแกร่งมาก', strength: 'very-strong' };
    }
    
    if (criteriaCount === 4) {
      return { valid: true, message: 'รหัสผ่านแข็งแกร่ง', strength: 'strong' };
    }
    
    return { valid: true, message: 'รหัสผ่านปานกลาง', strength: 'medium' };
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    const validation = validatePassword(pwd);
    setPasswordStrength(validation.strength);
  };

  // ฟังก์ชันตรวจสอบ email
  const validateEmail = (emailInput: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailInput);
  };

  const handleEmailChange = (emailInput: string) => {
    setEmail(emailInput);
    if (emailInput) {
      setEmailValid(validateEmail(emailInput));
    } else {
      setEmailValid(null);
    }
  };

  const handleRegister = async () => {
    // ป้องกันการกดซ้ำ
    if (isLoading) return;

    // ตรวจสอบอีเมล
    if (!validateEmail(email)) {
      setShowMessage('กรุณากรอกอีเมลให้ถูกต้อง (ต้องมี @)');
      setTimeout(() => setShowMessage(null), 3000);
      return;
    }

    // ตรวจสอบความปลอดภัยของรหัสผ่าน
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setShowMessage(passwordValidation.message);
      setTimeout(() => setShowMessage(null), 4000);
      return;
    }

    if (password !== confirmPassword) {
      setShowMessage('รหัสผ่านไม่ตรงกัน');
      setTimeout(() => setShowMessage(null), 3000);
      return;
    }

    if (role === 'store' && !shopName.trim()) {
      setShowMessage('กรุณากรอกชื่อร้านค้า');
      setTimeout(() => setShowMessage(null), 3000);
      return;
    }

    try {
      setIsLoading(true);
      const result = await RegisterUser(username, password, email, role, shopName);

      if (result.email) {
        setShowMessage('ได้ส่งรหัสยืนยัน (OTP) ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย');
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(result.email ?? '')}`);
        }, 2000);
      } else {
        setShowMessage('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ...');
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
      setShowMessage(errorMsg);
      setTimeout(() => setShowMessage(null), 3000);
    } finally {
      setIsLoading(false);
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
          <div>
            <input
              placeholder="อีเมล"
              type="email"
              className="w-full bg-bgpage rounded-input px-4 py-2 outline-none"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
            />
            {email && emailValid !== null && (
              <p className={`text-xs mt-1 ${emailValid ? 'text-green-600' : 'text-red-600'}`}>
                {emailValid ? 'รูปแบบอีเมลถูกต้อง' : 'รูปแบบอีเมลไม่ถูกต้อง (ต้องมี @)'}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <input
              placeholder="รหัสผ่าน"
              type="password"
              className="w-full bg-bgpage rounded-input px-4 py-2 outline-none"
              value={password}
              onChange={e => handlePasswordChange(e.target.value)}
            />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  <div className={`h-1 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : passwordStrength === 'strong' || passwordStrength === 'very-strong' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 flex-1 rounded ${passwordStrength === 'medium' ? 'bg-yellow-500' : passwordStrength === 'strong' || passwordStrength === 'very-strong' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' || passwordStrength === 'very-strong' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 flex-1 rounded ${passwordStrength === 'very-strong' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                </div>
                <p className={`text-xs ${passwordStrength === 'weak' ? 'text-red-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {validatePassword(password).message}
                </p>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <input
              placeholder="ยืนยันรหัสผ่าน"
              type="password"
              className="w-full bg-bgpage rounded-input px-4 py-2 outline-none"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && (
              <p className={`text-xs mt-2 ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {password === confirmPassword ? 'รหัสผ่านตรงกัน' : 'รหัสผ่านไม่ตรงกัน'}
              </p>
            )}
          </div>
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
            disabled={isLoading}
            className="md:col-span-2 rounded-pill bg-primary text-white py-3 hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังสมัคร...
              </>
            ) : (
              'สมัครสมาชิก'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
