import React from 'react';

interface ProductBasicInfoProps {
  productName: string;
  productDescription: string;
  price: number | '';
  categoryId: number | '';
  categories: Array<{ category_id: number; category_name: string }>;
  useVariants: boolean;
  onProductNameChange: (value: string) => void;
  onProductDescriptionChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCategoryIdChange: (value: string) => void;
  onUseVariantsChange: (value: boolean) => void;
}

export default function ProductBasicInfo({
  productName,
  productDescription,
  price,
  categoryId,
  categories,
  useVariants,
  onProductNameChange,
  onProductDescriptionChange,
  onPriceChange,
  onCategoryIdChange,
  onUseVariantsChange,
}: ProductBasicInfoProps) {
  return (
    <div>
      <h3 className="font-semibold mb-2 text-lg">ขั้นตอนที่ 1: ข้อมูลทั่วไป</h3>
      
      <div className="mb-4">
        <label className="flex items-center gap-2 mb-2">
          <input 
            type="checkbox" 
            checked={useVariants} 
            onChange={(e) => onUseVariantsChange(e.target.checked)} 
          />
          <span className="text-sm font-medium">
            ✨ สินค้าแบบหลายตัวเลือก (เช่น หลายสี หลายขนาด)
          </span>
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อสินค้า *
          </label>
          <input
            type="text"
            placeholder="เช่น เสื้อยืดคอกลม"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รายละเอียดสินค้า *
          </label>
          <textarea
            placeholder="อธิบายสินค้าของคุณ..."
            value={productDescription}
            onChange={(e) => onProductDescriptionChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full h-20 resize-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หมวดหมู่ *
          </label>
          <select
            value={categoryId}
            onChange={(e) => onCategoryIdChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>

        {!useVariants && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคา (บาท) *
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0"
              required
            />
          </div>
        )}
      </div>
    </div>
  );
}