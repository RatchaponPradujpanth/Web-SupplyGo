import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --------------------
// TypeScript Interfaces
// --------------------

export interface ProductVariantOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  variant_id: number;
  price: number;
  options: ProductVariantOption[];
}

export interface ProductImage {
  image_url: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  name?: string;
  description?: string;
  primary_image?: string;
  variants: ProductVariant[];
  images?: ProductImage[];
}

export interface Address {
  address_id: number;
  firstname?: string;
  lastname?: string;
  phone_number?: number;
  house_number?: string;
  street?: string;
  sub_district?: string;
  district?: string;
  province?: string;
  postal_code?: number;
  address_type?: string;
}

export interface GroupBuying {
  group_id: number;
  group_name?: string;
  shop_name?: string;
  product: Product;
  group_status?: string;
  required_members?: number;
  current_members?: number;
  total_items?: number;
  items_per_member?: number;
  points_per_group?: number;
  points_per_member?: number;
  created_at: string;
  expire_at?: string;
  shipping_address?: Address;
  order_status?: string;      // จาก group_member_orders.status
  tracking_number?: string;    // จาก group_member_orders.tracking_number
}

// --------------------
// API Function
// --------------------

/**
 * ดึงข้อมูลกลุ่มของผู้ใช้ (รวม order status จาก group_member_orders)
 * @param token JWT token ของผู้ใช้
 */
export const mygroup = async (token: string): Promise<GroupBuying[]> => {
  try {
    const { data } = await axios.get<{ success: boolean; data: GroupBuying[] }>(
      `${API_URL}/api/mygroups`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!data.success) {
      throw new Error('Failed to fetch groups');
    }

    return data.data;
  } catch (error: any) {
    console.error('Error fetching group history:', error);
    throw error;
  }
};
