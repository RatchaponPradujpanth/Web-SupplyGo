import { Router, Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../../middleware/authMiddleware';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,);

const confirmTopupRoute = Router();

confirmTopupRoute.post("/confirm-topup/:transactionId", authenticateToken, async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const userId = req.user?.user_id;

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return };

  // ดึง transaction ของ user
  const topup = await prisma.point_transactions.findUnique({
    where: { transaction_id: transactionId }
  });

  if (!topup) { res.status(404).json({ error: "Transaction not found" }); return };
  if (topup.user_id !== userId) { res.status(403).json({ error: "Not your transaction" }); return };
  if (topup.status === "succeeded") { res.json({ success: true, message: "Already confirmed" }); return };

  // ดึงสถานะ PaymentIntent จาก Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);

  if (paymentIntent.status !== "succeeded") {
    res.status(400).json({ success: false, status: "payment not completed" });
    return
}

  // อัปเดตสถานะใน DB เป็น succeeded
  await prisma.point_transactions.update({
    where: { transaction_id: transactionId },
    data: { status: "succeeded" }
  });

  // ถ้าต้องการเพิ่ม point ให้ user ทันที
  await prisma.user_points.update({
  where: { user_id: userId },
  data: {
    balance: { increment: topup.points } // ใช้ชื่อ field จริง
  }
});

  res.json({ success: true, status: "succeeded", pointsAdded: topup.points });
});

export default confirmTopupRoute;