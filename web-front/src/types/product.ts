// src/types/product.ts

export interface VariantOption {
  value: string;
  option_name: string;
}

export interface ProductVariant {
  variant_id: number;
  sku: string;
  price: number | null;
  stock_quantity: number | null;
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
  product_variants: ProductVariant[];
  product_images: ProductImage[];
}


export type ProductOption = {
  option_id: number;
  name: string;
  product_id: number;
  variant_options: VariantOption[];
};