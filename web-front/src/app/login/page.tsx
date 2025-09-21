'use client'
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <LoginForm onSuccess={() => (window.location.href = "/role-redirect")} />
      </main>

      
    </>
  );
}
