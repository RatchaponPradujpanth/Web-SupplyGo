import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authadmin, authenticateToken } from '../../../middleware/authMiddleware';

dotenv.config();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,);

const approvewithdrawRoute = Router();

approvewithdrawRoute.post(
  '/approve-withdraw',
  authenticateToken,
  authadmin,
  async (req: Request, res: Response) => {
    const adminUserId = req.user?.user_id;
    const { store_withdrawals_id } = req.body;

    if (!store_withdrawals_id) {
      res.status(400).json({ success: false, message: "store_withdrawals_id หาย" });
      return
    }

    try {
      const withdrawal = await prisma.store_withdrawals.findFirst({
        where: { store_withdrawals_id, status: 'pending' },
        include: { store: true },
      });

      if (!withdrawal) throw new Error("ไม่พบคำร้องถอนเงิน หรือถูกอนุมัติไปแล้ว");
      if (!withdrawal.store.stripe_account_id)
        throw new Error(`ร้าน ${withdrawal.store.shop_name} ยังไม่ได้เชื่อม Stripe`);

      const amountInSatang = withdrawal.points * 100;

      // 🔹 สร้าง PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSatang,
        currency: 'thb',
        description: `ถอนเงินร้าน ${withdrawal.store.shop_name} (withdrawal_id: ${withdrawal.store_withdrawals_id})`,
        transfer_data: { destination: withdrawal.store.stripe_account_id },
        metadata: {
          type: 'withdraw',  // important!
          store_withdrawals_id: String(withdrawal.store_withdrawals_id),
          shop_id: String(withdrawal.store.shop_id),
          approved_by_user_id: String(adminUserId),
        },
      });

      // บันทึก paymentIntent.id ไว้จับคู่ webhook
      await prisma.store_withdrawals.update({
        where: { store_withdrawals_id },
        data: { stripe_tx: paymentIntent.id },
      });

      res.status(200).json({
        success: true,
        message: "สร้าง PaymentIntent สำเร็จ รอ admin ใส่บัตรเพื่อ confirm",
        clientSecret: paymentIntent.client_secret,
        withdrawal,
      });
    } catch (error) {
      console.error("❌ Approve withdrawal failed:", error);
      res.status(500).json({ success: false, message: error});
    }
  }
);

export default approvewithdrawRoute;
