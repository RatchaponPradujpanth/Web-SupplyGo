'use client';

import RegisterForm from '@/components/RegisterForm';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6 bg-bgpage">
      <RegisterForm onSuccess={() => router.push('/login')} />
    </main>
  );
}
