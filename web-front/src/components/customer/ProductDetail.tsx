'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product } from '@/types/type';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: number, quantity: number, variantId?: number, optionValueIds?: number[]) => void;
  getDisplayPrice: (product: Product, variantId?: number | null) => string;
}

export default function ProductDetail({ product, onClose, onAddToCart, getDisplayPrice }: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [mainImage, setMainImage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVariantId(null);
    setSelectedOptions({});
    setQuantity(1);
    setMainImage(product.product_images?.[0]?.image_url || null);
  }, [product]);

  const canAddToCart = () => {
    if (!product) return false;
    if (product.product_variants?.length && !selectedVariantId) return false;
    if (product.product_options?.length && Object.keys(selectedOptions).length < product.product_options.length) return false;
    return true;
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) return;

    // ส่ง variant_option_ids ตาม schema ที่มี cart_item_variant_options
    let option_value_ids: number[] | undefined;
    if (selectedVariantId) {
      // เก็บ variant_option_id ที่เลือก
      option_value_ids = Object.values(selectedOptions);
    }

    onAddToCart(product.product_id, quantity, selectedVariantId ?? undefined, option_value_ids);
    onClose();
  };

  const handleOptionClick = (optionId: number, variantOptionId: number) => {
    const newSelectedOptions = {
      ...selectedOptions,
      [optionId]: variantOptionId
    };
    setSelectedOptions(newSelectedOptions);

    // หา variant ที่ตรงกับ options ทั้งหมดที่เลือก
    if (Object.keys(newSelectedOptions).length === product.product_options?.length) {
      const selectedOptionIds = Object.values(newSelectedOptions);
      
      const matchingVariant = product.product_variants?.find(variant => {
        const variantOptionIds = variant.variant_options.map(vo => vo.variant_option_id);
        return selectedOptionIds.every(id => variantOptionIds.includes(id));
      });

      setSelectedVariantId(matchingVariant?.variant_id || null);
    }
  };

  // Helper function to get stock for a specific variant option
  const getStockForOption = (optionId: number, variantOptionId: number): number | string => {
    // หา variants ที่มี option นี้
    const variantsWithThisOption = product.product_variants?.filter(v =>
      v.variant_options.some(vo => vo.variant_option_id === variantOptionId)
    );

    if (!variantsWithThisOption || variantsWithThisOption.length === 0) return '-';

    // ถ้าเลือก option อื่นๆ แล้ว ให้แสดง stock ของ variant ที่ match
    const otherSelectedOptions = Object.entries(selectedOptions)
      .filter(([key]) => Number(key) !== optionId)
      .map(([, value]) => value);

    if (otherSelectedOptions.length > 0) {
      const matchingVariant = variantsWithThisOption.find(v => {
        const variantOptionIds = v.variant_options.map(vo => vo.variant_option_id);
        return otherSelectedOptions.every(id => variantOptionIds.includes(id));
      });
      
      // ✅ ใช้ total_stock แทน stock_quantity
      return matchingVariant?.total_stock ?? 0;
    }

    // ถ้ายังไม่ได้เลือก option อื่น ให้แสดง stock สูงสุด
    const maxStock = Math.max(...variantsWithThisOption.map(v => v.total_stock || 0));
    return maxStock;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">{product.product_name}</h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Gallery Section */}
          <div>
            {mainImage ? (
              <div className="relative w-full aspect-square mb-4">
                <Image
                  src={mainImage}
                  alt={product.product_name ?? ''}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover rounded-lg border"
                  priority
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-200 flex items-center justify-center rounded-lg mb-4 border">
                <span className="text-gray-500">ไม่มีรูปภาพ</span>
              </div>
            )}

            {product.product_images && product.product_images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.product_images.map((img, idx) => (
                  <div
                    key={`product-img-${product.product_id}-${img.id || img.product_images_id || idx}`}
                    className={`relative w-full aspect-square cursor-pointer border-2 rounded-lg overflow-hidden transition ${
                      mainImage === img.image_url ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setMainImage(img.image_url)}
                  >
                    <Image
                      src={img.image_url}
                      alt={img.image_url}
                      fill
                      sizes="(max-width: 768px) 25vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-gray-600 mb-4">{product.product_description}</p>

            <div className="mb-6">
              <span className="text-3xl font-bold text-green-600">
                {getDisplayPrice(product, selectedVariantId)}
              </span>
            </div>

            {/* Product Options */}
            {product.product_options?.map((option) => (
              <div key={option.option_id} className="mb-6">
                <label className="block text-sm font-medium mb-3">{option.name}:</label>
                <div className="flex flex-wrap gap-2">
                  {option.variant_options.map((vo) => {
                    const stock = getStockForOption(option.option_id, vo.variant_option_id);

                    return (
                      <button
                        key={vo.variant_option_id}
                        type="button"
                        className={`px-4 py-2 rounded-lg border text-sm transition ${
                          selectedOptions[option.option_id] === vo.variant_option_id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => handleOptionClick(option.option_id, vo.variant_option_id)}
                      >
                        {vo.value} (คงเหลือ: {stock})
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">จำนวน:</label>
              <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-16 text-center py-2 outline-none"
                />
                <button
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-3 px-6 rounded-lg font-medium transition ${
                  canAddToCart()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={handleAddToCart}
                disabled={!canAddToCart()}
              >
                ➕ เพิ่มลงตะกร้า
              </button>
              <button
                className="py-3 px-6 rounded-lg border border-gray-400 text-gray-700 font-medium hover:bg-gray-50 transition"
                onClick={onClose}
              >
                ยกเลิก
              </button>
            </div>

            {!canAddToCart() && (product.product_variants?.length || product.product_options?.length) && (
              <p className="text-red-500 text-sm mt-3 text-center">กรุณาเลือกตัวเลือกให้ครบถ้วน</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}