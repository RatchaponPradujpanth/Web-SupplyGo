import { Router, Request, Response } from "express";
import { PrismaClient} from "@prisma/client";
import { authenticateToken } from "../../../middleware/authMiddleware";

const historygroupRoute = Router();
const prisma = new PrismaClient();

historygroupRoute.get(
  "/history-group",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // Query group_member_orders ของ user โดยตรง
      const memberOrders = await prisma.group_member_orders.findMany({
        where: { group_member: { user_id: userId } },
        include: {
          group_order: {
            include: {
              items: { include: { product: true } },
              group: {
                include: {
                  shop: true,
                  product: { include: { product_images: true } },
                  variant: true,
                },
              },
            },
          },
          group_member: {
            include: {
              member_addresses: { include: { address: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      const protocol = req.protocol;
      const host = req.headers.host;

      // Group by group_buying_id
      const groupedResult: Record<number, any> = {};

      for (const mo of memberOrders) {
        const group = mo.group_order.group;
        const groupId = group.group_buying_id;

        // ประกอบ URL ของรูปสินค้า
        if (group.product?.product_images) {
          group.product.product_images = group.product.product_images.map((img) => ({
            ...img,
            image_url:
              img.image_url && img.image_url.startsWith("http")
                ? img.image_url
                : `${protocol}://${host}${img.image_url}`,
          }));
        }

        // เตรียม addresses ของ user
        const addresses = mo.group_member.member_addresses.map((ma) => ma.address);

        // กำหนด cancellation_type
        let cancellation_type: string | null = null;
        let cancellation_message: string | null = null;
        if (mo.group_member.left_at) {
          if (group.status === "cancelled") {
            cancellation_type = "shop_cancelled";
            cancellation_message = "เจ้าของร้านปิดกลุ่มนี้แล้ว";
          } else {
            cancellation_type = "user_left";
            cancellation_message = "คุณออกจากกลุ่มนี้แล้ว";
          }
        }

        // เตรียมข้อมูล order ของ member
        const orderData = {
          group_order_id: mo.group_order.group_order_id,
          total_amount: mo.group_order.total_amount,
          group_order_status: mo.group_order.status,
          member_order_status: mo.status,
          tracking_number: mo.tracking_number,
          created_at: mo.created_at,
          items: mo.group_order.items.map((item) => ({
            group_order_item_id: item.group_order_item_id,
            product_id: item.product_id,
            product_name: item.product.product_name,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
          })),
        };

        if (!groupedResult[groupId]) {
          // ถ้ายังไม่มี group นี้ในผลลัพธ์ ให้สร้าง
          groupedResult[groupId] = {
            group_buying_id: group.group_buying_id,
            group_name: group.group_name,
            description: group.description,
            expire_at: group.expire_at,
            variant_id: group.variant_id,
            product_id: group.product_id,
            product: group.product,
            shop: group.shop,
            //status: group.status, 
            required_members: group.required_members,
            total_items: group.total_items,
            points_per_group: group.points_per_group,
            points_per_member: group.points_per_member,
            current_members: undefined, // ถ้าอยากได้ count จริง ๆ query เพิ่ม
            user_in_group: !mo.group_member.left_at,
            cancellation_type,
            cancellation_message,
            addresses,
            orders: [],
          };
        }

        // เพิ่ม order ของ member เข้าไป
        groupedResult[groupId].orders.push(orderData);
      }

      const result = Object.values(groupedResult);

      res.json({ groups: result });
    } catch (error) {
      console.error("Error fetching group history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default historygroupRoute;
