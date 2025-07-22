'use client';
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { loginUser, RegisterUser } from "@/service/apis";
import { motion, AnimatePresence } from "framer-motion";

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const token = await loginUser(username, password);
      localStorage.setItem('token', token);

      setShowMessage("✅ เข้าสู่ระบบสำเร็จ! กำลังนำทาง...");
      setTimeout(() => {
        setShowMessage(null);
        onSuccess();
      }, 2000);
    } catch (error) {
      setShowMessage("❌ เข้าสู่ระบบไม่สำเร็จ");
      setTimeout(() => setShowMessage(null), 3000);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {showMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="username" className="text-gray-700 font-medium">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-gray-700 font-medium">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300"
        >
          Login
        </button>
      </div>
    </>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showMessage, setShowMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      await RegisterUser(username, password, email);
      setShowMessage("🎉 สมัครสำเร็จ! กรุณาล็อกอินอีกครั้ง...");
      setTimeout(() => {
        setShowMessage(null);
        onSuccess();
        setUsername("");
        setPassword("");
        setEmail("");
      }, 2000);
    } catch (error) {
      setShowMessage("❌ การสมัครไม่สำเร็จ, โปรดลองใหม่อีกครั้ง.");
      setTimeout(() => setShowMessage(null), 3000);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {showMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="username" className="text-gray-700 font-medium">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-gray-700 font-medium">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="email" className="text-gray-700 font-medium">Email</label>
          <input
            type="email"
            id="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <button
          onClick={handleRegister}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300"
        >
          Register
        </button>
      </div>
    </>
  );
}

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 relative">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-blue-700 mb-6">
          {isRegister ? "Register to Pond" : "Login"}
        </h1>

        {isRegister ? (
          <RegisterForm onSuccess={() => setIsRegister(false)} />
        ) : (
          <LoginForm onSuccess={() => window.location.href = '/role-redirect'} />
        )}

        <p className="text-center text-gray-600 text-sm mt-4">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <span
                onClick={() => setIsRegister(false)}
                className="text-blue-500 cursor-pointer underline"
              >
                Login here
              </span>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <span
                onClick={() => setIsRegister(true)}
                className="text-blue-500 cursor-pointer underline"
              >
                Register
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
