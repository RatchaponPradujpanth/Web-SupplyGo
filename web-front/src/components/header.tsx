'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { loadUsername, fetchUserRole } from '@/service/apis';

interface SearchSuggestion {
  product_id: number;
  product_name: string;
  price: number | null;
  picture_url: string | null;
}

export default function Header() {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // ตรวจสอบว่าเป็นหน้า auth หรือไม่ (login, register, reset password)
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/reset';

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const userRole = await fetchUserRole(token);
        setRole(userRole);

        const name = await loadUsername(token);
        setUsername(name);
      } catch (err) {
        console.error('Error loading header user info:', err);
        // ถ้าเกิด error ให้ล้าง state ด้วย เผื่อ token หมดอายุ
        setUsername(null);
        setRole(null);
      }
    };

    loadUser();
  }, []);

  // ฟังก์ชันค้นหาสินค้าด้วย AJAX (Axios)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await axios.get(`${API_URL}/api/search/suggestions`, {
          params: { q: searchQuery }
        });
        setSuggestions(response.data.products || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      }
    };

    // Debounce: รอ 300ms หลังจากหยุดพิมพ์ค่อยค้นหา
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // ปิด suggestions เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (productId: number) => {
    setShowSuggestions(false);
    setSearchQuery('');
    router.push(`/product/${productId}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUsername(null); // 🔹 รีเซ็ต username
    setRole(null);     // 🔹 รีเซ็ต role
    router.push('/');
  };

  return (
    <header className="bg-white shadow-card sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary"></div>
          <span className="font-semibold text-lg">SupplyGo</span>
          {role && (
            <span className="ml-3 rounded-pill bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              Role: {role}
            </span>
          )}
        </Link>

        {/* ✅ ถ้าเป็น admin/store ให้แสดงแค่ user menu ชิดขวา */}
        {(role === 'admin' || role === 'store') ? (
          <div className="hidden md:flex items-center">
            {username ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onMouseEnter={() => setShowUserMenu(true)}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-pill px-4 py-2 hover:bg-primary/10 hover:text-primary text-sm transition-all"
                >
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {username.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium">{username}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div 
                    onMouseLeave={() => setShowUserMenu(false)}
                    className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-800">{username}</p>
                      {role && (
                        <p className="text-xs text-gray-500 mt-1">Role: {role}</p>
                      )}
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/profile');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-primary/5 transition flex items-center gap-3 text-sm"
                      >
                        <span className="text-lg">👤</span>
                        <span>บัญชีของฉัน</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/order');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-primary/5 transition flex items-center gap-3 text-sm"
                      >
                        <span className="text-lg">📦</span>
                        <span>การซื้อของฉัน</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/mygroups');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-primary/5 transition flex items-center gap-3 text-sm"
                      >
                        <span className="text-lg">🎯</span>
                        <span>กลุ่มของฉัน</span>
                      </button>
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 hover:text-red-600 transition flex items-center gap-3 text-sm text-gray-700"
                      >
                        <span className="text-lg">🚪</span>
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !isAuthPage && (
                <button
                  onClick={() => router.push('/login')}
                  className="rounded-pill px-3 py-2 border border-gray-200 hover:border-primary/40 hover:text-primary text-sm"
                >
                  Login
                </button>
              )
            )}
          </div>
        ) : (
          // ✅ สำหรับ customer/guest แสดง search bar + cart + user menu
          <div className="hidden md:flex items-center gap-3 w-1/2">
            {/* ซ่อน search bar และ cart ในหน้า auth และสำหรับ role admin/store */}
            {!isAuthPage && (
              <>
                <div ref={searchRef} className="relative w-full">
                <div className="relative">
                  <input
                    aria-label="Search"
                    placeholder="ค้นหาสินค้า..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-bgpage rounded-input pl-4 pr-12 py-2 outline-none focus:ring-2 ring-primary/30"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition"
                    aria-label="Search"
                  >
                    🔍
                  </button>
                </div>
                
                {/* Autocomplete Dropdown - แสดงเฉพาะชื่อสินค้า */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                    <div className="p-2 border-b border-gray-100 text-xs text-gray-500">
                      🔍 ค้นหา &ldquo;{searchQuery}&rdquo; ร้านค้า
                    </div>
                    {suggestions.map((product) => (
                      <button
                        key={product.product_id}
                        onClick={() => handleSuggestionClick(product.product_id)}
                        className="w-full p-3 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0"
                      >
                        <p className="font-medium text-sm text-gray-800">{product.product_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push('/cart')}
                className="rounded-pill px-3 py-2 hover:bg-primary/10 hover:text-primary text-sm whitespace-nowrap"
              >
                Cart
              </button>
            </>
          )}

          {username ? (
            <div ref={userMenuRef} className="relative">
              <button
                onMouseEnter={() => setShowUserMenu(true)}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-pill px-4 py-2 hover:bg-primary/10 hover:text-primary text-sm transition-all"
              >
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {username.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{username}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div 
                  onMouseLeave={() => setShowUserMenu(false)}
                  className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800">{username}</p>
                    {role && (
                      <p className="text-xs text-gray-500 mt-1">Role: {role}</p>
                    )}
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/profile');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-primary/5 transition flex items-center gap-3 text-sm"
                    >
                      <span className="text-lg">👤</span>
                      <span>บัญชีของฉัน</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/order');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-primary/5 transition flex items-center gap-3 text-sm"
                    >
                      <span className="text-lg">📦</span>
                      <span>การซื้อของฉัน</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/mygroups');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-primary/5 transition flex items-center gap-3 text-sm"
                    >
                      <span className="text-lg">🎯</span>
                      <span>กลุ่มของฉัน</span>
                    </button>
                    
                    <div className="border-t border-gray-100 my-2"></div>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 hover:text-red-600 transition flex items-center gap-3 text-sm text-gray-700"
                    >
                      <span className="text-lg">🚪</span>
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ซ่อนปุ่ม Login ในหน้า auth
            !isAuthPage && (
              <button
                onClick={() => router.push('/login')}
                className="rounded-pill px-3 py-2 border border-gray-200 hover:border-primary/40 hover:text-primary text-sm"
              >
                Login
              </button>
            )
          )}
        </div>
        )}
      </div>
    </header>
  );
}
