import React from 'react';

interface ProductOptionsProps {
  options: { name: string; values: string[] }[];
  onOptionNameChange: (index: number, value: string) => void;
  onOptionValueChange: (optionIndex: number, valueIndex: number, value: string) => void;
  onAddOption: () => void;
  onAddOptionValue: (optionIndex: number) => void;
  onGenerateVariants: () => void;
}

export default function ProductOptions({
  options,
  onOptionNameChange,
  onOptionValueChange,
  onAddOption,
  onAddOptionValue,
  onGenerateVariants,
}: ProductOptionsProps) {
  return (
    <div>
      <h3 className="font-semibold mb-2 text-lg sm:text-xl">ขั้นตอนที่ 2: ตัวเลือกสินค้า</h3>
      <div className="space-y-4">
        {options.map((opt, i) => (
          <div key={i} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อตัวเลือก (เช่น สี, ขนาด) - ตัวที่ {i + 1}
              </label>
              <input
                type="text"
                placeholder="เช่น สี, ขนาด, วัสดุ"
                value={opt.name}
                onChange={(e) => onOptionNameChange(i, e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ค่าตัวเลือก (เช่น แดง, น้ำเงิน)
              </label>
              {opt.values.map((val, j) => (
                <div key={j} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น แดง, M, ไม้"
                    value={val}
                    onChange={(e) => onOptionValueChange(i, j, e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500"
                  />
                  {j === opt.values.length - 1 && (
                    <button
                      type="button"
                      onClick={() => onAddOptionValue(i)}
                      className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                    >
                      + เพิ่มค่า
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={onAddOption}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
          >
            + เพิ่มตัวเลือกใหม่
          </button>
          <button
            type="button"
            onClick={onGenerateVariants}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm sm:text-base"
          >
            🎯 สร้างตัวเลือกสินค้า
          </button>
        </div>
      </div>
    </div>
  );
}