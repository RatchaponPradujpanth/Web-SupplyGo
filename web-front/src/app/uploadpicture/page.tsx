'use client';
import { useState } from 'react';
import { API_URL } from '@/service/apis';
import { uploadImages } from '@/service/apis';

export default function UploadPage() {
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('🔔 [handleSubmit] เริ่มอัปโหลด');
  
  if (images.length === 0) {
    alert('เลือกรูปก่อน');
    return;
  }

  try {
    setUploading(true);
    const result = await uploadImages(images);
    setUploadedUrls(result.files.map((name: string) => `${API_URL}/images/${name}`));
    alert('อัปโหลดสำเร็จ');
  } catch (error: any) {
    alert('เกิดข้อผิดพลาด: ' + error.message);
  } finally {
    setUploading(false);
  }
};


  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md border">
      <h1 className="text-2xl font-semibold mb-6 text-center">อัปโหลดรูปภาพสินค้า</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImages(Array.from(e.target.files || []))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
        </button>
      </form>

      {uploadedUrls.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-2">รูปที่อัปโหลดแล้ว:</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedUrls.map((url) => (
              <div
                key={url}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <img src={url} alt="Uploaded" className="w-full h-40 object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
