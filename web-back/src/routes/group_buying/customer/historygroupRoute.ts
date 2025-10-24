import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../../../middleware/authMiddleware";

const historygroupRoute  = Router();
const prisma = new PrismaClient();

historygroupRoute.get("/history-group", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) { res.status(401).json({ message: "Unauthorized" })
    return
    };

    const groupHistory = await prisma.group_members.findMany({
      where: { user_id: userId },
      include: {
        group: {
          include: {
            shop: true,
            product: { include: { product_images: true } },
            variant: true,
            group_orders: {
              include: { items: { include: { product: true } } }
            },
            members: true
          }
        },
        member_addresses: { include: { address: true } }
      },
      orderBy: { joined_at: "desc" }
    });

    const protocol = req.protocol;
    const host = req.headers.host;

    const result = groupHistory.map(gm => {
      const group = gm.group;

      // ประกอบ URL ของรูปสินค้า
      if (group.product?.product_images) {
        group.product.product_images = group.product.product_images.map(img => ({
          ...img,
          image_url: img.image_url.startsWith("http")
            ? img.image_url
            : `${protocol}://${host}${img.image_url}`
        }));
      }

      const currentMembers = group.members?.filter(m => !m.left_at).length || 0;
      const user_in_group = !gm.left_at;
      const addresses = gm.member_addresses.map(ma => ma.address);

      // 🔍 คำนวณเหตุผลการยกเลิก/ออกจากกลุ่ม (เฉพาะ 2 กรณี)
      let cancellation_type = null;
      let cancellation_message = null;
      
      if (gm.left_at) {
        // ผู้ใช้ออกจากกลุ่มแล้ว
        if (group.status === "cancelled") {
          // กรณีที่ 1: เจ้าของร้านกดปิดร้านค้า (ก่อนกดสร้าง order)
          cancellation_type = "shop_cancelled";
          cancellation_message = "เจ้าของร้านปิดกลุ่มนี้แล้ว";
        } else {
          // กรณีที่ 2: ลูกค้ากดออกจากกลุ่มเอง
          cancellation_type = "user_left";
          cancellation_message = "คุณออกจากกลุ่มนี้แล้ว";
        }
      }

      const orders = group.group_orders.map(order => ({
        group_order_id: order.group_order_id,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        items: order.items.map(item => ({
          group_order_item_id: item.group_order_item_id,
          product_id: item.product_id,
          product_name: item.product.product_name,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit
        }))
      }));

      return {
        group_buying_id: group.group_buying_id,
        group_name: group.group_name,
        description: group.description,
        expire_at: group.expire_at,
        created_at: group.created_at,
        joined_at: gm.joined_at,        // ✅ เพิ่มวันที่เข้าร่วม
        variant_id: group.variant_id,
        product_id: group.product_id,
        product: group.product,
        shop: group.shop,
        status: group.status,
        required_members: group.required_members,
        total_items: group.total_items,
        points_per_group: group.points_per_group,
        points_per_member: group.points_per_member,
        current_members: currentMembers,
        user_in_group,
        cancellation_type,        // ✅ เพิ่มประเภทการยกเลิก
        cancellation_message,     // ✅ เพิ่มข้อความอธิบาย
        addresses,
        orders
      };
    });

    res.json({ groups: result });
  } catch (err: any) {
    console.error("Error fetching group history:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default historygroupRoute;