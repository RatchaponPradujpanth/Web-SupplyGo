import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserRole } from '@/service/api/fetchrole';

export interface AuthState {
  isAuthenticated: boolean;
  userRole: string | null;
  loading: boolean;
  token: string | null;
}

/**
 * Custom hook สำหรับการจัดการ Authentication
 * @returns AuthState และ functions สำหรับการจัดการ auth
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userRole: null,
    loading: true,
    token: null,
  });
  
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setAuthState({
        isAuthenticated: false,
        userRole: null,
        loading: false,
        token: null,
      });
      return;
    }

    try {
      const userRole = await fetchUserRole(token);
      setAuthState({
        isAuthenticated: true,
        userRole,
        loading: false,
        token,
      });
    } catch {
      console.warn('⚠️ Token invalid or expired, clearing auth state...');
      localStorage.removeItem('token');
      setAuthState({
        isAuthenticated: false,
        userRole: null,
        loading: false,
        token: null,
      });
    }
  };

  const requireAuth = (action: () => void, redirectTo: string = '/login') => {
    if (!authState.isAuthenticated) {
      alert('⚠️ กรุณาเข้าสู่ระบบก่อนทำรายการ');
      router.push(redirectTo);
      return;
    }
    action();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      loading: false,
      token: null,
    });
    router.push('/');
  };

  const redirectBasedOnRole = () => {
    if (authState.userRole === 'store') {
      router.push('/store/dashboard');
    } else if (authState.userRole === 'admin') {
      router.push('/admin/dashboard');
    }
  };

  return {
    ...authState,
    requireAuth,
    logout,
    redirectBasedOnRole,
    refreshAuth: checkAuthStatus,
  };
};