import type { Product } from '@/types/type';

/**
 * Utility functions สำหรับการจัดการราคาสินค้า
 */

/**
 * Format ราคาเป็นรูปแบบเงินไทย
 * @param price - ราคาที่ต้องการ format
 * @returns ราคาในรูปแบบ string
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (price == null) return 'ติดต่อร้านค้า';
  
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(price);
};

/**
 * คำนวณและแสดงราคาของสินค้า (รองรับ variants)
 * @param product - ข้อมูลสินค้า
 * @param variantId - ID ของ variant ที่เลือก (optional)
 * @returns ราคาที่แสดง
 */
export const getDisplayPrice = (product: Product, variantId?: number | null): string => {
  // กรณีมี variants
  if (product.product_variants && product.product_variants.length > 0) {
    if (variantId) {
      // แสดงราคา variant ที่เลือก
      const selectedVariant = product.product_variants.find(v => v.variant_id === variantId);
      return formatPrice(selectedVariant?.price);
    } else {
      // แสดงช่วงราคาของ variants
      const prices = product.product_variants
        .map(v => v.price)
        .filter((p): p is number => p !== null && p !== undefined);
      
      if (prices.length === 0) return 'ติดต่อร้านค้า';
      if (prices.length === 1) return formatPrice(prices[0]);
      
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
  }

  // กรณีไม่มี variants
  return formatPrice(product.price);
};

/**
 * คำนวณช่วงราคาของสินค้าที่มี variants
 * @param product - ข้อมูลสินค้า
 * @returns ช่วงราคาหรือ null ถ้าไม่มี variants
 */
export const getPriceRange = (product: Product): string | null => {
  if (!product.product_variants || product.product_variants.length === 0) {
    return null;
  }

  const prices = product.product_variants
    .map(v => v.price)
    .filter((p): p is number => p !== null && p !== undefined);

  if (prices.length === 0) return null;

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }

  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};