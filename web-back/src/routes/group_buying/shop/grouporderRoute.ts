import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../../../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const grouporderRoute = Router();
const prisma = new PrismaClient();

/**
 * 🟢 GET: ดึง group orders ทั้งหมดของร้าน
 */
grouporderRoute.get("/group-order", authenticateToken, authstore, async (req: Request, res: Response) => {
  const shop_id = req.user?.shop_id;

  if (!shop_id) {
    res.status(400).json({ message: "Shop ID not found." });
    return;
  }

  try {
    const finalData = await prisma.group_order.findMany({
      where: {
        group: { shop_id },
      },
      include: {
        group: {
          include: {
            product: {
              include: {
                product_images: true, // เพิ่มตรงนี้เพื่อดึง product images
              },
            },
            variant: true,
            members: {
              include: {
                user: {
                  select: { username: true, email: true },
                },
              },
            },
          },
        },
        member_orders: {
          include: {
            group_member: {
              include: {
                user: { select: { username: true, email: true } },
                member_addresses: { include: { address: true } },
              },
            },
          },
        },
      },
    });

    if (!finalData.length) {
      res.status(404).json({ message: "No group orders found for this shop." });
      return;
    }


    res.status(200).json({
      message: "Fetched group orders successfully.",
      data: finalData,
    });
  } catch (error) {
    console.error("Error fetching group orders:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});



grouporderRoute.patch(
  "/group-order/tracking",
  authenticateToken,
  authstore,
  async (req: Request, res: Response) => {
    const { groupMemberId, trackingNumber } = req.body;
    const shopId = req.user?.shop_id;

    console.log("🔍 Request data:", { groupMemberId, trackingNumber, shopId });

    if (!groupMemberId || !trackingNumber || trackingNumber.trim() === "") {
      res.status(400).json({ error: "ต้องส่ง groupMemberId และ trackingNumber มาด้วย" });
      return;
    }

    try {
      // ตรวจสอบว่ามี record อยู่จริง
      const memberOrder = await prisma.group_member_orders.findFirst({
        where: { group_member_id: Number(groupMemberId) },
        include: {
          group_order: { include: { group: true } },
          group_member: {
            include: {
              user: {
                select: { user_id: true, username: true, email: true }
              }
            }
          }
        },
      });

      if (!memberOrder) {
        res.status(404).json({ error: "ไม่พบคำสั่งซื้อนี้" });
        return;
      }

      // ตรวจสอบสิทธิ์ร้าน
      if (memberOrder.group_order.group.shop_id !== shopId) {
        res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้" });
        return;
      }

      // อัปเดต tracking number + status
      const updated = await prisma.group_member_orders.update({
        where: { group_member_order_id: memberOrder.group_member_order_id }, // ใช้ PK update จริง
        data: {
          tracking_number: trackingNumber.trim(),
          status: "shipped",
        },
      });

      res.json({ 
        message: "อัปเดตเลขพัสดุและสถานะเรียบร้อย",
        data: {
          group_member_order_id: updated.group_member_order_id,
          tracking_number: updated.tracking_number,
          status: updated.status,
          username: memberOrder.group_member.user.username
        }
      });

    } catch (err: any) {
      console.error("❌ อัปเดตเลขพัสดุล้มเหลว:", err);
      res.status(500).json({ 
        error: "Internal server error", 
        details: err.message,
        stack: err.stack
      });
    }
  }
);


export default grouporderRoute;
