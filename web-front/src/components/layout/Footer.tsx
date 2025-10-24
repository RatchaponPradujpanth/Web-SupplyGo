'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">      
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-textmuted">
          <p>&copy; {new Date().getFullYear()} SupplyGo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
