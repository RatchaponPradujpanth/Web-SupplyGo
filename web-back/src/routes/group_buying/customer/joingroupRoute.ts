import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../../../middleware/authMiddleware";

const joingroupRoute = Router();
const prisma = new PrismaClient();

joingroupRoute.post("/join-group", authenticateToken, async (req: Request, res: Response) => {
  const user_id = req.user?.user_id;
  const { group_buying_id, address_id } = req.body;

  if (!user_id) { res.status(401).json({ error: "ผู้ใช้ไม่ได้เข้าสู่ระบบ" }); return; }
  if (!group_buying_id || !address_id) { res.status(400).json({ error: "group_buying_id หรือ address_id หาย" }); return; }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ตรวจสอบว่าผู้ใช้อยู่ในกลุ่มแล้วหรือยัง
      const existingMember = await tx.group_members.findFirst({
        where: { group_buying_id, user_id, left_at: null },
      });
      if (existingMember) throw new Error("คุณอยู่ในกลุ่มนี้แล้ว");

      // เช็คจำนวนสมาชิกปัจจุบัน
      const activeMembersCount = await tx.group_members.count({ where: { group_buying_id, left_at: null } });

      // ดึงข้อมูลกลุ่ม
      const group = await tx.group_buying.findUnique({
        where: { group_buying_id },
        select: { required_members: true, points_per_member: true, shop_id: true, status: true },
      });
      if (!group) throw new Error("ไม่พบกลุ่มนี้");
      if (activeMembersCount >= group.required_members) throw new Error("กลุ่มเต็มแล้ว");

      // ตรวจสอบยอด point ของผู้ใช้
      const userPoints = await tx.user_points.findUnique({ where: { user_id } });
      if (!userPoints || userPoints.balance < group.points_per_member) throw new Error("คุณมี point ไม่เพียงพอ");

      // เพิ่มสมาชิกใหม่
      const newMember = await tx.group_members.create({
        data: { group_buying_id, user_id },
      });

      // บันทึก address ของสมาชิก
      await tx.group_member_addresses.create({
        data: {
          group_member_id: newMember.group_members_id,
          address_id,
          group_buying_id,
        },
      });

      // หัก point ของผู้ใช้
      await tx.user_points.update({
        where: { user_id },
        data: { balance: { decrement: group.points_per_member } },
      });

      // โอน point ให้ร้านค้า
      await tx.store_wallets.upsert({
        where: { shop_id: group.shop_id },
        update: { balance: { increment: group.points_per_member } },
        create: { shop_id: group.shop_id, balance: group.points_per_member },
      });

      // บันทึก transaction
      await tx.user_point_transactions.create({
        data: {
          user_id,
          shop_id: group.shop_id,
          points: -group.points_per_member,
          type: "redeem",
        },
      });

      // ✅ อัปเดต status ของกลุ่มตามจำนวนสมาชิก
      const updatedMembersCount = activeMembersCount + 1;
      const newStatus = updatedMembersCount >= group.required_members ? 'full' : 'open';
      await tx.group_buying.update({
        where: { group_buying_id },
        data: { status: newStatus },
      });

      return newMember;
    });

    res.status(201).json({ message: "เข้ากลุ่มสำเร็จ", member: result });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเข้ากลุ่ม:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" });
  }
});

export default joingroupRoute;
