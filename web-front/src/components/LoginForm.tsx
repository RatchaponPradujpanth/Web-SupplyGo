'use client'
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { loginUser } from "@/service/api/login";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMessage, setShowMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setShowMessage({
        type: 'error',
        message: '❌ กรุณากรอกอีเมลและรหัสผ่าน'
      });
      return;
    }

    setIsLoading(true);
    setShowMessage(null); // ล้างข้อความเตือนเก่า
    
    try {
      const token = await loginUser(username, password);
      console.log('✅ Token received:', token ? 'Yes' : 'No');
      localStorage.setItem("token", token);
      console.log('✅ Token saved to localStorage');
      
      setIsLoading(false);
      
      if (onSuccess) {
        console.log('🚀 Calling onSuccess callback');
        onSuccess();
      } else {
        console.log('🚀 Redirecting to home page');
        router.push('/'); // กลับไปหน้าแรก
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      setShowMessage({
        type: 'error',
        message: '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-card shadow-card"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-textmain">เข้าสู่ระบบ</h2>
          <p className="text-textmuted text-sm mt-2">ยินดีต้อนรับกลับสู่ระบบ SupplyGo</p>
        </div>

        <div className="space-y-4">
          {/* Alert Message */}
          <AnimatePresence>
            {showMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`px-4 py-3 rounded-lg text-sm font-medium ${
                  showMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {showMessage.message}
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <input
              type="email"
              placeholder="กรอกชื่อผู้ใช้ของคุณ"
              className="w-full bg-bgpage rounded-input px-4 py-3 text-textmain placeholder-textmuted outline-none border border-transparent focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="กรอกรหัสผ่าน"
              className="w-full bg-bgpage rounded-input px-4 py-3 text-textmain placeholder-textmuted outline-none border border-transparent focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>

          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            onClick={handleLogin}
            disabled={isLoading}
            className={`w-full rounded-pill py-3 font-medium transition-all duration-200 ${
              isLoading
                ? 'bg-primary/50 text-white/70 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </motion.button>
        </div>

        <p className="mt-8 text-sm text-center text-textmuted">
          ยังไม่มีบัญชีใช่ไหม?{' '}
          <a 
            href="/register" 
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            สมัครสมาชิก
          </a>
        </p>
      </motion.div>
    </div>
  );
}
