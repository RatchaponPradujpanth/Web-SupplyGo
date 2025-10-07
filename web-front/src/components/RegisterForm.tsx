'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RegisterUser } from '@/service/api/register';

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
  const [showMessage, setShowMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setShowMessage('❌ รหัสผ่านไม่ตรงกัน');
      setTimeout(() => setShowMessage(null), 3000);
      return;
    }

    try {
      await RegisterUser(username, password, email, role);
      setShowMessage('🎉 สมัครสำเร็จ! กรุณาล็อกอิน...');
      setTimeout(() => {
        setShowMessage(null);
        onSuccess();
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');
        setRole(defaultRole);
      }, 2000);
    } catch (error) {
      setShowMessage('❌ การสมัครไม่สำเร็จ, โปรดลองใหม่อีกครั้ง.');
      setTimeout(() => setShowMessage(null), 3000);
    }
  };

  return (
    <div className="relative">
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

      <div className="bg-white rounded-card shadow-card p-8 w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center">Create your account</h1>
        <div className="mt-6 grid md:grid-cols-2 gap-3">
          <input
            placeholder="Full name"
            className="bg-bgpage rounded-input px-4 py-2 outline-none"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            placeholder="Email"
            type="email"
            className="bg-bgpage rounded-input px-4 py-2 outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            className="bg-bgpage rounded-input px-4 py-2 outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <input
            placeholder="Confirm password"
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
            <option value="customer">Register as customer</option>
            <option value="store">Register as store</option>
            <option value="admin">Register as admin</option>
          </select>
          <button
            onClick={handleRegister}
            className="md:col-span-2 rounded-pill bg-primary text-white py-3 hover:bg-blue-700 transition-all duration-300"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
