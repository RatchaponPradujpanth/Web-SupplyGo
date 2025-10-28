import { Product } from './type';

interface Address {
  address_id: number;
  address_type: string;
  district: string;
  firstname: string;
  house_number: string;
  lastname: string;
  phone_number: number;
  postal_code: number;
  province: string;
  street: string;
  sub_district: string;
  user_id: number;
}

interface Shop {
  address: string;
  shop_id: number;
  shop_name: string;
  stripe_account_id: string;
  user_id: number;
}

interface GroupOrder {
  group_order_id: number;
  total_amount: string;
  group_order_status: string;
  member_order_status: string;
  tracking_number: string | null;
  created_at: string;
  items: Array<{
    group_order_item_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price_per_unit: string;
  }>;
}

export interface GroupBuying {
  group_buying_id: number;
  group_name: string;
  description: string | null;
  expire_at: string;
  created_at?: string;
  variant_id: number;
  product_id: number;
  product: Product;
  shop: Shop;
  status: string;
  required_members: number;
  total_items: number;
  points_per_group: number;
  points_per_member: number;
  items_per_member?: number;
  updated_at: string;
  joined_at?: string | null;   // ✅ เพิ่มวันที่เข้าร่วม
  current_members?: number;
  members?: any[];
  user_in_group: boolean;
  cancellation_type: string | null;
  cancellation_message: string | null;
  addresses: Address[];
  orders: GroupOrder[];
}