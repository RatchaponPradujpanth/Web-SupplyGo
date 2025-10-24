import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../../middleware/authMiddleware";

const loadgroupbuyRoute = Router();
const prisma = new PrismaClient();

loadgroupbuyRoute.get(
  "/loadgroup",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id; // ✅ ใช้ได้เลยถ้า middleware ประกาศ type แล้ว

      const groups = await prisma.group_buying.findMany({
        select: {
          group_buying_id: true,
          group_name: true,
          description: true,
          expire_at: true,
          variant_id: true,
          product_id: true,
          required_members: true,
          total_items: true,
          status: true,
          created_at: true,
          shop_id: true,
          shop: { select: { shop_id: true, shop_name: true } },
          product: { include: { product_images: true } },
          members: {
            where: { left_at: null }, // เฉพาะสมาชิกที่ยังอยู่ในกลุ่ม
            include: { user: { select: { user_id: true, username: true } } },
          },
        },
        orderBy: { created_at: "desc" },
      });

      const protocol = req.protocol;
      const host = req.headers.host;

      const groupsWithFullData = groups.map((group) => {
        // ✅ แก้ URL รูปสินค้า
        const product = group.product;
        if (product?.product_images) {
          product.product_images = product.product_images.map((img) => ({
            ...img,
            image_url: img.image_url.startsWith("http")
              ? img.image_url
              : `${protocol}://${host}${img.image_url}`,
          }));
        }

        const currentMembers = group.members?.length || 0;

        // ✅ เช็คว่าผู้ใช้ที่ล็อกอินอยู่ในกลุ่มนี้ไหม
        const user_in_group = userId
          ? group.members?.some((m) => m.user.user_id === userId) || false
          : false;

        // ✅ คำนวณเวลาที่เหลือ (มิลลิวินาที)
        const now = new Date();
        const expire = group.expire_at ? new Date(group.expire_at) : null;
        const time_left = expire ? expire.getTime() - now.getTime() : null;

        return {
          ...group,
          product,
          current_members: currentMembers,
          is_full: currentMembers >= group.required_members,
          user_in_group,
          time_left, // ⏳ เหลือกี่ ms ก่อนหมดอายุ
        };
      });

      console.log(`Loaded ${groupsWithFullData.length} groups with members data`);
      res.json({ groups: groupsWithFullData });
    } catch (error) {
      console.error("Error loading groups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default loadgroupbuyRoute;
