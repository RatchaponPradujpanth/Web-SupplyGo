'use client';

import React from 'react';
import Image from 'next/image';
import type { Product } from '@/types/type';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  getDisplayPrice: (product: Product) => string;
}

export default function ProductCard({ product, onSelect, getDisplayPrice }: ProductCardProps) {
  // ✅ เลือกภาพหลักและภาพ hover จาก product_images
  const primaryImage = product.product_images?.find(img => img.is_primary);
  const secondaryImage = product.product_images?.find(img => !img.is_primary);
  const mainImage = primaryImage?.image_url ?? '/placeholder.png';
  const hoverImage = secondaryImage?.image_url ?? mainImage;

  // ✅ ดึงชื่อร้านหลายร้านและ join ด้วยคอมม่า
  const shopNames = product.shop?.map(s => s.shop_name).filter(Boolean).join(", ") ?? 'ไม่ทราบชื่อร้าน';

  return (
    <div
      className="block bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition cursor-pointer"
      onClick={() => onSelect(product)}
    >
      {/* รูปสินค้า */}
      <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden">
        <Image
          src={mainImage}
          alt={product.product_name ?? ''}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover rounded-lg transition duration-300 hover:opacity-0"
        />
        <Image
          src={hoverImage}
          alt={product.product_name ?? ''}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover rounded-lg opacity-0 transition duration-300 hover:opacity-100"
        />
      </div>

      {/* ชื่อสินค้า */}
      <h3 className="font-medium leading-tight line-clamp-2 h-10 overflow-hidden">
        {product.product_name}
      </h3>

      {/* ชื่อร้านหลายร้าน */}
      <h4 className="text-sm text-gray-600 line-clamp-1">{shopNames}</h4>

      {/* ราคา */}
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="font-semibold text-green-600">{getDisplayPrice(product)}</span>
      </div>
    </div>
  );
}
