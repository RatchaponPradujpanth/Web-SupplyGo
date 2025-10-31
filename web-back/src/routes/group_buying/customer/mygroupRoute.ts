import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../middleware/authMiddleware';

const mygroupRoute = Router();
const prisma = new PrismaClient();

mygroupRoute.get('/mygroups', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        // ดึงข้อมูลจาก group_member_orders เป็นหลัก
        const memberOrders = await prisma.group_member_orders.findMany({
            where: {
                group_member: {
                    user_id: userId,
                    left_at: null, // ยังอยู่ในกลุ่ม
                },
            },
            include: {
                group_order: {
                    include: {
                        group: {
                            include: {
                                shop: {
                                    select: {
                                        shop_name: true,
                                    },
                                },
                                product: {
                                    include: {
                                        product_images: {
                                            where: { is_primary: true },
                                            select: { image_url: true },
                                        },
                                        product_variants: {
                                            include: {
                                                variant_options: {
                                                    include: { option: true },
                                                },
                                            },
                                        },
                                    },
                                },
                                members: {
                                    where: { left_at: null },
                                    select: {
                                        user: {
                                            select: { username: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                group_member: {
                    include: {
                        member_addresses: {
                            include: { address: true },
                        },
                    },
                },
            },
        });

        // แปลงข้อมูลให้อยู่ในรูปแบบที่ frontend ต้องการ
        const formattedGroups = memberOrders.map(orderRecord => {
            const group = orderRecord.group_order.group;
            return {
                group_id: group.group_buying_id,
                group_name: group.group_name,
                shop_name: group.shop.shop_name,
                product: {
                    id: group.product.product_id,
                    name: group.product.product_name,
                    description: group.product.product_description,
                    primary_image: group.product.product_images[0]?.image_url,
                    variants: group.product.product_variants.map(variant => ({
                        variant_id: variant.variant_id,
                        price: variant.price,
                        options: variant.variant_options.map(opt => ({
                            name: opt.option.name,
                            value: opt.value,
                        })),
                    })),
                },
                group_status: group.status,
                required_members: group.required_members,
                current_members: group.members.length,
                total_items: group.total_items,
                items_per_member: group.items_per_member,
                points_per_group: group.points_per_group,
                points_per_member: group.points_per_member,
                created_at: group.created_at,
                expire_at: group.expire_at,
                shipping_address: orderRecord.group_member.member_addresses[0]?.address,
                order_status: orderRecord.status,
                tracking_number: orderRecord.tracking_number,
            };
        });

        res.json({ success: true, data: formattedGroups });
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user groups',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default mygroupRoute;
