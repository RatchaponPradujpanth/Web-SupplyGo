import { useState, useEffect } from 'react';
import { loadPublicProducts, loadShopProducts } from '@/service/api/loadproduct';
import { getCategories } from '@/service/api/category';
import type { Product, Category } from '@/types/type';

export interface ProductsState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook สำหรับการจัดการ Products และ Categories
 * @param token - Authentication token (optional)
 * @returns ProductsState และ functions สำหรับการจัดการ products
 */
export const useProducts = (token?: string | null) => {
  const [state, setState] = useState<ProductsState>({
    products: [],
    categories: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadProductsAndCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadProductsAndCategories = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // โหลด products และ categories พร้อมกัน
      const [productsData, categoriesData] = await Promise.all([
        token ? loadShopProducts() : loadPublicProducts(),
        getCategories(),
      ]);

      setState({
        products: productsData,
        categories: categoriesData,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      console.error('🚫 Error loading products and categories:', error);
    }
  };

  const refreshProducts = () => {
    loadProductsAndCategories();
  };

  // สุ่มเรียง products และเอาแค่จำนวนที่กำหนด
  const getShuffledProducts = (limit: number = 12) => {
    return [...state.products]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  };

  return {
    ...state,
    refreshProducts,
    getShuffledProducts,
  };
};