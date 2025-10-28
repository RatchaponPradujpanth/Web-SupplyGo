import axios from 'axios';
import type { GroupBuying, GroupBuyingResult } from '@/types/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loadgroupbuy = async (token: string): Promise<GroupBuyingResult[]> => {
  try {
    const response = await axios.get<{ groups: GroupBuying[] }>(`${API_URL}/api/loadgroup`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const groups: GroupBuying[] = response.data.groups;

    // Map ให้เป็น GroupBuyingResult พร้อม field helper
    const mappedGroups: GroupBuyingResult[] = groups.map(g => ({
      group_buying_id: g.group_buying_id,
      group_name: g.group_name ?? null,
      description: g.description ?? null,
      expire_at: g.expire_at ?? null,
      product_id: g.product_id,
      variant_id: g.variant_id ?? null,
      product_name: g.product?.product_name ?? null,
      product_image: g.product?.product_images?.[0]?.image_url ?? null,
      secondary_images: g.product?.product_images?.slice(1).map(img => img.image_url) ?? [],
      total_items: g.total_items ?? 0,
      required_members: g.required_members,
      status: g.status,
      created_at: g.created_at ?? undefined,
      updated_at: g.updated_at ?? undefined,
      points_per_group: g.points_per_group ?? 0,
      points_per_member: g.points_per_member,
      items_per_member: g.items_per_member ?? 0,
      member_count: g.members?.length || 0,
      members: g.members ?? [],
      // helper fields
      is_full: (g.members?.length || 0) >= g.required_members,
      user_in_group: g.user_in_group || false,
    }));

    return mappedGroups;

  } catch (error) {
    console.error("Load group buying error:", error);
    throw error;
  }
};
