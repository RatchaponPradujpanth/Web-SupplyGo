'use client';

import React, { useState, useEffect } from 'react';
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

  // Reset selections when product changes
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
    
    let option_value_ids: number[] | undefined;

    if (selectedVariantId) {
      const selectedVariant = product.product_variants?.find(v => v.variant_id === selectedVariantId);
      option_value_ids = selectedVariant?.variant_options?.map(vo => vo.variant_option_id);
    }

    onAddToCart(product.product_id, quantity, selectedVariantId ?? undefined, option_value_ids);
    onClose();
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
            {/* Main Image */}
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.product_name ?? ''}
                className="w-full aspect-square object-cover rounded-lg mb-4 border"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-200 flex items-center justify-center rounded-lg mb-4 border">
                <span className="text-gray-500">ไม่มีรูปภาพ</span>
              </div>
            )}

            {/* Thumbnails */}
            {product.product_images && product.product_images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.product_images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.image_url}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`w-full aspect-square object-cover rounded-lg cursor-pointer border-2 transition ${
                      mainImage === img.image_url ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setMainImage(img.image_url)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="flex flex-col">
            {/* Description */}
            <p className="text-gray-600 mb-4">{product.product_description}</p>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-green-600">
                {getDisplayPrice(product, selectedVariantId)}
              </span>
            </div>

            {/* Variant Selector */}
            {product.product_variants && product.product_variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">เลือกตัวเลือก (Variant):</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedVariantId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedVariantId(val ? Number(val) : null);
                  }}
                >
                  <option value="">-- เลือกตัวเลือก --</option>
                  {product.product_variants.map((variant) => (
                    <option key={variant.variant_id} value={variant.variant_id}>
                      {variant.sku} - {variant.price ? `฿${variant.price.toLocaleString()}` : 'ติดต่อร้านค้า'} - สต็อก: {variant.stock_quantity ?? '-'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Product Options */}
            {product.product_options?.map((option) => (
              <div key={option.option_id} className="mb-6">
                <label className="block text-sm font-medium mb-3">{option.name}:</label>
                <div className="flex flex-wrap gap-2">
                  {option.variant_options.map((vo) => (
                    <button
                      key={vo.variant_option_id}
                      type="button"
                      className={`px-4 py-2 rounded-lg border transition ${
                        selectedOptions[option.option_id] === vo.variant_option_id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => {
                        setSelectedOptions(prev => ({ 
                          ...prev, 
                          [option.option_id]: vo.variant_option_id 
                        }));
                      }}
                    >
                      {vo.value}
                    </button>
                  ))}
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
                ➕ Add to Cart
              </button>
              <button
                className="py-3 px-6 rounded-lg border border-gray-400 text-gray-700 font-medium hover:bg-gray-50 transition"
                onClick={onClose}
              >
                ยกเลิก
              </button>
            </div>

            {/* Error Message */}
            {!canAddToCart() && (product.product_variants?.length || product.product_options?.length) && (
              <p className="text-red-500 text-sm mt-3 text-center">
                กรุณาเลือกตัวเลือกให้ครบถ้วน
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}