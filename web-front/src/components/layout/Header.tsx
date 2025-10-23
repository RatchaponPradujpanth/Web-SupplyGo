'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface HeaderProps {
  role?: 'customer' | 'store' | 'admin';
}

export default function Header({ role = 'customer' }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getRoleDisplay = () => {
    switch (role) {
      case 'store':
        return 'Seller';
      case 'admin':
        return 'Admin';
      default:
        return 'Buyer';
    }
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'store':
        return 'bg-secondary/10 text-secondary';
      case 'admin':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <header className="bg-white shadow-card sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary"></div>
          <span className="font-semibold text-lg">SupplyGo</span>
          <span className={`ml-3 rounded-pill px-3 py-1 text-xs font-medium ${getRoleBadgeColor()}`}>
            Role: {getRoleDisplay()}
          </span>
        </Link>

        {/* Search & Navigation */}
        <div className="hidden md:flex items-center gap-3 w-1/2">
          <form onSubmit={handleSearch} className="w-full">
            <input
              type="text"
              aria-label="Search"
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bgpage rounded-input px-4 py-2 outline-none focus:ring-2 ring-primary/30"
            />
          </form>
          
          <Link
            href="/cart"
            className="rounded-pill px-3 py-2 hover:bg-primary/10 hover:text-primary text-sm whitespace-nowrap"
          >
            Cart
          </Link>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="rounded-pill px-3 py-2 border border-gray-200 hover:border-primary/40 hover:text-primary text-sm whitespace-nowrap"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-pill px-3 py-2 border border-gray-200 hover:border-primary/40 hover:text-primary text-sm whitespace-nowrap"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
