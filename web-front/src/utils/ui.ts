/**
 * Utility functions สำหรับการจัดการ UI และ constants
 */

/**
 * Category icons mapping
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'Electronics': '🔌',
  'Fashion': '👕',
  'แฟชั่น': '👕',
  'Home & Kitchen': '🍳',
  'ของใช้ในบ้าน': '🏠',
  'Beauty': '🧴',
  'ความงาม': '💄',
  'Sports': '🏋️',
  'กีฬาและกิจกรรมกลางแจ้ง': '⚽',
  'Furniture': '🛋️',
  'Baby': '🍼',
  'Tools': '🧰',
  'อาหารและเครื่องดื่ม': '🍽️',
  'เครื่องใช้ไฟฟ้า': '🔌',
};

/**
 * รับ icon สำหรับ category
 * @param categoryName - ชื่อ category
 * @returns icon string
 */
export const getCategoryIcon = (categoryName: string): string => {
  return CATEGORY_ICONS[categoryName] || '📦';
};

/**
 * สร้าง URL สำหรับรูปภาพ
 * @param imageUrl - URL หรือ path ของรูปภาพ
 * @param apiUrl - Base API URL
 * @returns Full URL ของรูปภาพ
 */
export const getImageUrl = (imageUrl?: string | null, apiUrl?: string): string | null => {
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || '';
  return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
};

/**
 * จำกัดข้อความตามจำนวนที่กำหนด
 * @param text - ข้อความต้นฉบับ
 * @param limit - จำนวนตัวอักษรสูงสุด
 * @returns ข้อความที่ถูกจำกัด
 */
export const truncateText = (text: string, limit: number): string => {
  if (text.length <= limit) return text;
  return text.substring(0, limit).trim() + '...';
};

/**
 * สร้าง slug จาก string
 * @param text - ข้อความต้นฉบับ
 * @returns slug string
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};