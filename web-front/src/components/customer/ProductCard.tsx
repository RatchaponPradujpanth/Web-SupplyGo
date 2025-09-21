'use client';

import React from 'react';
import type { Product } from '@/types/type';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  getDisplayPrice: (product: Product) => string;
}

export default function ProductCard({ product, onSelect, getDisplayPrice }: ProductCardProps) {
  const mainImage = product.image ?? '/placeholder.png';
  const hoverImage = product.secondary_images?.[0] ?? mainImage;

  return (
    <div
      className="block bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition cursor-pointer"
      onClick={() => onSelect(product)}
    >
      {/* รูปสินค้า */}
      <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden">
        <img
          src={mainImage}
          alt={product.product_name ?? ''}
          className="w-full h-full object-cover rounded-lg transition duration-300 hover:opacity-0"
        />
        <img
          src={hoverImage}
          alt={product.product_name ?? ''}
          className="absolute top-0 left-0 w-full h-full object-cover rounded-lg opacity-0 transition duration-300 hover:opacity-100"
        />
      </div>

      {/* ชื่อ */}
      <h3 className="font-medium leading-tight line-clamp-2 h-10 overflow-hidden">
        {product.product_name}
      </h3>

      {/* ราคา */}
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="font-semibold text-green-600">{getDisplayPrice(product)}</span>
      </div>

      {/* ปุ่ม Add to cart */}
      <button className="mt-3 w-full rounded-full bg-blue-600 text-white py-2 text-sm hover:bg-blue-700 transition">
        Add to cart
      </button>
    </div>
  );
}
