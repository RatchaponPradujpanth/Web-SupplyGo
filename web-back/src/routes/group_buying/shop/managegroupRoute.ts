import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../../../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const manageGroupsRoute = Router();
const prisma = new PrismaClient();

manageGroupsRoute.get(
  "/manage-groups",
  authenticateToken,
  authstore,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const shopId = req.user?.shop_id;
      console.log("👤 Shop ID:", shopId);

      if (!shopId) {
        console.log("❌ shop_id ไม่ถูกต้อง");
        res.status(400).json({ message: "shop_id ไม่ถูกต้อง" });
        return;
      }

      // ดึง point ของร้านจาก store_wallets
      const storeWallet = await prisma.store_wallets.findUnique({
        where: { shop_id: shopId },
      });

      const storeBalance = storeWallet?.balance || 0; // ถ้าไม่มี record ให้ default 0

      // ดึง group_buying ของร้านค้าที่ login อยู่
      const groups = await prisma.group_buying.findMany({
        where: { shop_id: shopId },
        select: {
          group_buying_id: true,
          shop_id: true,
          product_id: true,
          variant_id: true,
          group_name: true,
          description: true,
          expire_at: true,
          required_members: true,
          total_items: true,
          status: true,
          created_at: true,
          points_per_group: true,
          points_per_member: true,
          product: {
            select: {
              product_name: true,
              image: true,
              product_images: {
                select: {
                  image_url: true,
                  is_primary: true,
                  sort_order: true,
                },
              },
            },
          },
          members: {
            where: { left_at: null },
            select: {
              group_members_id: true,
              joined_at: true,
              user: {
                select: {
                  user_id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      console.log(`📦 Loaded ${groups.length} groups`);

      // สร้าง URL เต็มสำหรับรูป
      const host = req.headers.host;
      const protocol = req.protocol;

      const result = groups.map((g) => {
        const primaryImageRelative =
          g.product.product_images.find((img) => img.is_primary)?.image_url ||
          g.product.image ||
          null;
        const primaryImage = primaryImageRelative
          ? `${protocol}://${host}${primaryImageRelative}`
          : null;

        const secondaryImages = g.product.product_images
          .filter((img) => !img.is_primary)
          .map((img) =>
            img.image_url ? `${protocol}://${host}${img.image_url}` : null
          )
          .filter(Boolean);

        return {
          group_buying_id: g.group_buying_id,
          product_id: g.product_id,
          variant_id: g.variant_id,
          group_name: g.group_name,
          description: g.description,
          expire_at: g.expire_at,
          product_name: g.product.product_name,
          product_image: primaryImage,
          secondary_images: secondaryImages,
          total_items: g.total_items,
          required_members: g.required_members,
          status: g.status,
          created_at: g.created_at,
          points_per_group: g.points_per_group,
          points_per_member: g.points_per_member,
          member_count: g.members.length,
          members: g.members.map((m) => ({
            id: m.group_members_id,
            user_id: m.user.user_id,
            username: m.user.username,
            email: m.user.email,
            joined_at: m.joined_at,
          })),
        };
      });

      // ส่งผลลัพธ์พร้อม point ของร้าน
      res.status(200).json({
        store_balance: storeBalance,
        groups: result,
      });

    } catch (error) {
      console.error("❌ Error loading group buying:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


export default manageGroupsRoute;
