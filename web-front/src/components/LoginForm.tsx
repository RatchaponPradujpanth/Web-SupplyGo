'use client'
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { loginUser } from "@/service/apis";

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
      setTimeout(() => setShowMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    
    try {
      const token = await loginUser(username, password);
      localStorage.setItem("token", token);

      setShowMessage({
        type: 'success',
        message: '✅ เข้าสู่ระบบสำเร็จ! กำลังนำทาง...'
      });
      
      setTimeout(() => {
        setShowMessage(null);
        setIsLoading(false);
        
        // ใช้ callback หรือ router
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard'); // default redirect
        }
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      setShowMessage({
        type: 'error',
        message: '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
      setTimeout(() => setShowMessage(null), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Toast Message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30 
            }}
            className={`fixed top-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-pill shadow-card z-50 font-medium ${
              showMessage.type === 'success' 
                ? 'bg-accent text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {showMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-card shadow-card"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-textmain">Login</h2>
          <p className="text-textmuted text-sm mt-2">Welcome back to SupplyGo</p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
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
              placeholder="Password"
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
              'Login'
            )}
          </motion.button>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/forgot-password" 
            className="text-primary hover:text-primary/80 text-sm transition-colors"
          >
            Forgot password?
          </a>
        </div>

        <p className="mt-8 text-sm text-center text-textmuted">
          No account?{' '}
          <a 
            href="/register" 
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Create one
          </a>
        </p>
      </motion.div>
    </div>
  );
}