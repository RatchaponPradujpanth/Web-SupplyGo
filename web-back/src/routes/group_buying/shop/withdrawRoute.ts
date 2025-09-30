
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { authenticateToken, authstore } from "../../../middleware/authMiddleware";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const withdrawRoute = Router();

withdrawRoute.post(
  "/withdraw",
  authenticateToken,
  authstore,
  async (req: Request, res: Response) => {
    const { points } = req.body; // client ส่ง points มา
    const shop_id = req.user?.shop_id;
    const user_id = req.user?.user_id;

    console.log("➡️ Withdraw API called");
    console.log("Token decoded user_id:", user_id, "shop_id:", shop_id);
    console.log("Requested points:", points);

    if (!shop_id || !user_id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!points || points <= 0) {
      res.status(400).json({ message: "ไม่มีจำนวนเงินที่ถูกต้อง" });
      return;
    }

    try {
      // หา shop และ wallet
      const shop = await prisma.shops.findUnique({ where: { shop_id } });
      const wallet = await prisma.store_wallets.findUnique({ where: { shop_id } });

      if (!shop || !wallet) {
        res.status(400).json({ message: "ร้านค้า/Wallet ไม่พบ" });
        return;
      }

      if (wallet.points < points) {
        res.status(400).json({ message: "ยอด point ไม่พอ" });
        return;
      }

      // สร้าง withdrawal แบบ pending
      const withdrawal = await prisma.store_withdrawals.create({
        data: {
          shop_id,
          points: points, // ✅ map points -> amount
          status: "pending",
        },
      });
      console.log("Withdrawal pending created:", withdrawal);

      // MOCK: ไม่ยิงไป Stripe จริง แค่ log
      console.log(`🔹 Mock payout for shop ${shop_id}, points: ${points}`);

      // ลด point ใน wallet
      await prisma.store_wallets.update({
        where: { shop_id },
        data: { points: { decrement: points } },
      });

      // อัปเดต withdrawal เป็น completed (mock)
      const updatedWithdrawal = await prisma.store_withdrawals.update({
        where: { id: withdrawal.id },
        data: {
          status: "completed",
          
          stripe_tx: "MOCK_TX_" + withdrawal.id, // mock id
        },
      });

      res.json({
        success: true,
        withdrawal: updatedWithdrawal,
      });
    } catch (error) {
      console.error("❌ Withdraw failed:", error);

      // fallback: log failed withdrawal
      await prisma.store_withdrawals.create({
        data: { shop_id: shop_id!, points: points, status: "failed" }, // ✅ ใช้ points
      });

      res.status(500).json({ error: "ถอนเงินไม่สำเร็จ" });
    }
  }
);

export default withdrawRoute;

