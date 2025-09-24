import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, authstore } from "../../../middleware/authMiddleware";

const cancelgrouporderRoute = Router();
const prisma = new PrismaClient();

cancelgrouporderRoute.post("/cancel-group-order", authenticateToken, authstore, async (req: Request, res: Response) => {
  const { group_buying_id } = req.body;
  const shop_id = req.user?.shop_id;

  if (!group_buying_id) {
    res.status(400).json({ error: "group_buying_id หาย" });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ ดึงกลุ่มพร้อมสมาชิก active
      const group = await tx.group_buying.findUnique({
        where: { group_buying_id },
        include: {
          members: { where: { left_at: null } }
        }
      });

      if (!group) throw new Error("ไม่พบกลุ่มนี้");

      if (group.shop_id !== shop_id) throw new Error("You are not authorized to cancel this group");

      if (group.status === "cancelled") throw new Error("This group is already cancelled");

      // 2️⃣ คืน point ให้สมาชิกทุกคนที่ยัง active
      for (const member of group.members) {
        await tx.user_points.update({
          where: { user_id: member.user_id },
          data: { balance: { increment: group.points_per_member } },
        });

        await tx.user_point_transactions.create({
          data: {
            user_id: member.user_id,
            shop_id: group.shop_id,
            points: group.points_per_member,
            type: "refund",
          },
        });

        // ทำเครื่องหมายว่า member ออกจาก group
        await tx.group_members.update({
          where: { group_members_id: member.group_members_id },
          data: { left_at: new Date() },
        });
      }

      // 3️⃣ หัก point ของร้าน
      await tx.store_wallets.update({
        where: { shop_id: group.shop_id },
        data: { balance: { decrement: group.points_per_member * group.members.length } },
      });

      // 4️⃣ อัปเดตสถานะกลุ่ม
      return await tx.group_buying.update({
        where: { group_buying_id },
        data: { status: "cancelled", updated_at: new Date() },
      });
    });

    res.json({ message: "Group order cancelled and points refunded successfully", group: result });

  } catch (err: any) {
    console.error("Error cancelling group order:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
});

export default cancelgrouporderRoute;
