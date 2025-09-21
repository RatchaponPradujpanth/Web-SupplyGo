// src/types/product.ts

export interface VariantOption {
  value: string;
  option_name: string;
}

export interface ProductBatch {
  batch_id: number;
  batch_number: string;
  manufactured_date: string;
  expiry_date: string;
  quantity: number;
}

export interface ProductVariant {
  variant_id: number;
  sku: string;
  price: number | null;
  total_stock: number;          // stock ของ variant
  batches?: ProductBatch[];     // batch ของ variant
  image: string | null;
  variant_options: VariantOption[];
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary?: boolean;
  sort_order?: number | null;
}

export interface Product {
  product_id: number;
  product_name: string | null;
  product_description: string | null;
  price: number | null;
  status?: string | null;
  image: string | null;
  total_stock: number;          // stock ของสินค้าหลัก (ไม่มี variant)
  batches?: ProductBatch[];     // batch ของสินค้าหลัก
  product_variants?: ProductVariant[];  // มีหรือไม่มี variant ก็ได้
  product_images?: ProductImage[];
}

export type ProductOption = {
  option_id: number;
  name: string;
  product_id: number;
  variant_options?: VariantOption[];
};
