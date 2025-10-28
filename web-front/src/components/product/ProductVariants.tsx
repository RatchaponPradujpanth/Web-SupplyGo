import React from 'react';

interface ProductVariantsProps {
  variants: { sku: string; price: number; stock_quantity: number; option_values: string[] }[];
  onVariantChange: (index: number, field: 'sku' | 'price' | 'stock_quantity', value: string) => void;
}

export default function ProductVariants({ variants, onVariantChange }: ProductVariantsProps) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-6">
      <h4 className="font-semibold text-md">✅ ตัวเลือกที่สร้างแล้ว ({variants.length} รายการ)</h4>
      {variants.map((variant, vi) => (
        <div key={vi} className="border p-4 rounded-lg bg-white shadow-sm">
          <div className="font-medium mb-3 text-blue-700">
            📦 {variant.option_values.join(' - ')}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                placeholder="รหัสสินค้า"
                value={variant.sku}
                onChange={(e) => onVariantChange(vi, 'sku', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคา (บาท)
              </label>
              <input
                type="number"
                placeholder="0"
                value={variant.price || ''}
                onChange={(e) => onVariantChange(vi, 'price', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนคงเหลือ
              </label>
              <input
                type="number"
                placeholder="0"
                value={variant.stock_quantity || ''}
                onChange={(e) => onVariantChange(vi, 'stock_quantity', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}