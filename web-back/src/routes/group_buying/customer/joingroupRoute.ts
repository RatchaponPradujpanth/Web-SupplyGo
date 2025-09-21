import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../../../middleware/authMiddleware";

const joingroupRoute = Router();
const prisma = new PrismaClient();

joingroupRoute.post("/join-group", authenticateToken, async (req: Request, res: Response) => {
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
      // 1️⃣ ตรวจสอบว่าผู้ใช้อยู่ในกลุ่มแล้วหรือยัง
      const existingMember = await tx.group_members.findFirst({
        where: {
          group_buying_id,
          user_id,
          left_at: null,
        },
      });

      if (existingMember) {
        throw new Error("คุณอยู่ในกลุ่มนี้แล้ว");
      }

      // 2️⃣ เช็คจำนวนสมาชิกปัจจุบัน
      const activeMembersCount = await tx.group_members.count({
        where: {
          group_buying_id,
          left_at: null,
        },
      });

      // 3️⃣ ดึงจำนวนสมาชิกที่ต้องการและ point ต่อสมาชิก
      const group = await tx.group_buying.findUnique({
  where: { group_buying_id },
  select: { required_members: true, points_per_member: true, shop_id: true }, // เพิ่ม shop_id
});

      if (!group) {
        throw new Error("ไม่พบกลุ่มนี้");
      }

      if (activeMembersCount >= group.required_members) {
        throw new Error("กลุ่มเต็มแล้ว");
      }

      // 4️⃣ ตรวจสอบยอด point ของผู้ใช้
      const userPoints = await tx.user_points.findUnique({
        where: { user_id },
      });

      if (!userPoints || userPoints.balance < group.points_per_member) {
        throw new Error("คุณมี point ไม่เพียงพอ");
      }

      // 5️⃣ เพิ่มสมาชิกใหม่
      const newMember = await tx.group_members.create({
        data: {
          group_buying_id,
          user_id,
        },
      });

      // 6️⃣ หัก point ของผู้ใช้
      await tx.user_points.update({
        where: { user_id },
        data: {
          balance: { decrement: group.points_per_member },
        },
      });

      // 7️⃣ โอน point ให้ร้าน (update store_wallets)
      await tx.store_wallets.upsert({
  where: { shop_id: group.shop_id }, // เปลี่ยนจาก store_id → shop_id
  update: {
    balance: { increment: group.points_per_member },
  },
  create: {
    shop_id: group.shop_id,           // ต้องใช้ shop_id
    balance: group.points_per_member,
  },
});

      return newMember;
    });

    res.status(201).json({ message: "เข้ากลุ่มสำเร็จ", member: result });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเข้ากลุ่ม:", error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default joingroupRoute;
