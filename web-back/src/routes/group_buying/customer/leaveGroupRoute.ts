import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../../../middleware/authMiddleware";

const leaveGroupRoute = Router();
const prisma = new PrismaClient();

leaveGroupRoute.post("/leave-group", authenticateToken, async (req: Request, res: Response) => {
  const user_id = req.user?.user_id;
  const { group_buying_id } = req.body;

  if (!user_id || typeof user_id !== "number") {
    res.status(401).json({ error: "ผู้ใช้ไม่ได้เข้าสู่ระบบหรือ user_id ไม่ถูกต้อง" });
    return;
  }

  if (!group_buying_id) {
    res.status(400).json({ error: "group_buying_id หาย" });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ ตรวจสอบสมาชิกในกลุ่ม
      const member = await tx.group_members.findFirst({
        where: { group_buying_id, user_id, left_at: null },
      });
      if (!member) throw new Error("คุณไม่ได้อยู่ในกลุ่มนี้");

      // 2️⃣ ดึงข้อมูล group เพื่อรู้ shop_id, points_per_member และ required_members
      const group = await tx.group_buying.findUnique({
        where: { group_buying_id },
        select: { shop_id: true, points_per_member: true, required_members: true },
      });
      if (!group) throw new Error("ไม่พบกลุ่มนี้");

      // 3️⃣ อัปเดตสมาชิกว่าออกแล้ว
      await tx.group_members.update({
        where: { group_members_id: member.group_members_id },
        data: { left_at: new Date() },
      });

      // 4️⃣ คืน point ให้ผู้ใช้
      await tx.user_points.update({
        where: { user_id },
        data: { points: { increment: group.points_per_member } },
      });

      // 5️⃣ หัก point ของร้านออก
      await tx.store_wallets.update({
        where: { shop_id: group.shop_id },
        data: { points: { decrement: group.points_per_member } },
      });

      // 6️⃣ บันทึก transaction ของผู้ใช้
      await tx.user_point_transactions.create({
        data: {
          user_id,
          shop_id: group.shop_id,
          points: group.points_per_member, // คืน point +ve
          type: "refund",
        },
      });

      // 7️⃣ อัปเดต status ของกลุ่มตามจำนวนสมาชิกหลังออก
      const remainingMembersCount = await tx.group_members.count({
        where: { group_buying_id, left_at: null }
      });

      const newStatus = remainingMembersCount >= group.required_members ? 'full' : 'open';
      await tx.group_buying.update({
        where: { group_buying_id },
        data: { status: newStatus },
      });

      return { message: "ออกจากกลุ่มสำเร็จ 🎉" };
    });

    res.status(200).json(result);

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการออกจากกลุ่ม:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default leaveGroupRoute;
