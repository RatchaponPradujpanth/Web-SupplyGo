import apiClient from '@/utils/apiClient';
import type { Product } from '@/types/type';

/**
 * Product API Service
 */

/**
 * โหลดสินค้าสำหรับผู้ใช้ทั่วไป (ไม่ต้องล็อกอิน)
 * @returns Promise<Product[]>
 */
export const loadPublicProducts = async (): Promise<Product[]> => {
  try {
    const products = await apiClient.get<Product[]>('/api/loaduserproduct');
    return products || [];
  } catch (error) {
    console.error("❌ [loadPublicProducts] Error fetching public products:", error);
    return [];
  }
};

/**
 * โหลดสินค้าสำหรับผู้ใช้ที่ล็อกอินแล้ว
 * @param _token - Authentication token (handled by apiClient)
 * @returns Promise<Product[]>
 */
export const loadShopProducts = async (): Promise<Product[]> => {
  try {
    const products = await apiClient.get<Product[]>('/api/loaduserproduct');
    return products || [];
  } catch (error) {
    console.error("❌ [loadShopProducts] Error fetching shop products:", error);
    return [];
  }
};
