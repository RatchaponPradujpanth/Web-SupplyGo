import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CreateGroupRequest {
  product_id: number;
  variant_id?: number | null;
  required_members: number;
  total_items: number;
  items_per_member: number;   // เพิ่มตรงนี้
  status: string;
  points_per_group: number;
  points_per_member: number;
  group_name?: string;
  description?: string;
  expire_at?: string;
}

export interface CreateGroupResponse {
  message: string;
  group?: {
    group_buying_id: number;
    shop_id: number;
    product_id: number;
    required_members: number;
    total_items: number;
    items_per_member: number;
    status: string;
    points_per_group?: number;
    points_per_member?: number;
    group_name?: string;
    description?: string;
    expire_at?: string;
    created_at: string;
  };
}

export const creategroup = async (
  token: string,
  payload: CreateGroupRequest
): Promise<CreateGroupResponse> => {
  const { data } = await axios.post<CreateGroupResponse>(
    `${API_URL}/api/create-group`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};
