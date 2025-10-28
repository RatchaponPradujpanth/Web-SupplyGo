import React from 'react';
import Image from 'next/image';

interface ProductImagesProps {
  imageFiles: File[];
  onImageFilesChange: (files: File[]) => void;
}

export default function ProductImages({ imageFiles, onImageFilesChange }: ProductImagesProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onImageFilesChange(files);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    onImageFilesChange(newFiles);
  };

  return (
    <div>
      <h3 className="font-semibold mb-2 text-lg sm:text-xl">ขั้นตอนที่ 3: รูปภาพสินค้า</h3>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="w-full"
        required
      />
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {imageFiles.map((file, i) => {
          const url = URL.createObjectURL(file);
          return (
            <div key={i} className="relative">
              <Image 
                src={url} 
                alt={`preview-${i}`} 
                className="w-full h-24 object-cover rounded border" 
                width={100}
                height={100}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      {imageFiles.length > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          ✅ เลือกแล้ว {imageFiles.length} รูป (รูปแรกจะเป็นรูปหลัก)
        </p>
      )}
    </div>
  );
}