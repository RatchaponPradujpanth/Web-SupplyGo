import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, authstore } from "../../../middleware/authMiddleware";

const prisma = new PrismaClient();
const withdrawRoute = Router();

withdrawRoute.post("/withdraw", authenticateToken, authstore, async (req: Request, res: Response) => {
  const { points } = req.body; // points ที่ร้านส่งมา
  const shop_id = req.user?.shop_id;
  const user_id = req.user?.user_id;

  if (!shop_id || !user_id) {
    res.status(401).json({ message: "Unauthorized" });
    return
    }

  if (!points || points <= 0) {
    res.status(400).json({ message: "จำนวน point ไม่ถูกต้อง" });
    return
  }

  try {
    // หา shop และ wallet
    const shop = await prisma.shops.findUnique({ where: { shop_id } });
    const wallet = await prisma.store_wallets.findUnique({ where: { shop_id } });

    if (!shop || !wallet) {
      res.status(400).json({ message: "ร้านค้า/Wallet ไม่พบ" });
      return
    }

    if (wallet.points < points) {
      res.status(400).json({ message: "ยอด point ไม่พอ" });
      return
    }

    // ทำ transaction: ลด point + สร้าง withdrawal
    const withdrawal = await prisma.$transaction(async (tx) => {
      // ลด point ใน wallet
      await tx.store_wallets.update({
        where: { shop_id },
        data: { points: { decrement: points } },
      });

      // สร้าง withdrawal record (pending)
      const w = await tx.store_withdrawals.create({
        data: {
          shop_id,
          points,
          status: "pending",
        },
      });

      return w;
    });

    // ส่ง response พร้อม withdrawal info
    res.status(200).json({
      success: true,
      message: "สร้างคำร้องถอนเงินเรียบร้อย",
      withdrawal,
    });

  } catch (error) {
    console.error("❌ Withdraw failed:", error);

    // fallback: log failed withdrawal
    await prisma.store_withdrawals.create({
      data: { shop_id: shop_id!, points: points, status: "failed" },
    });

    res.status(500).json({ error: "ถอนเงินไม่สำเร็จ", details: String(error) });
  }
});

export default withdrawRoute;
