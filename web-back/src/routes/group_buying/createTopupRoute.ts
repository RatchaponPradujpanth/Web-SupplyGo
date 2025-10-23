// src/routes/topup/createTopupRoute.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { authenticateToken } from "../../middleware/authMiddleware";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const createTopupRoute = Router();

createTopupRoute.post("/topup-point", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.user_id;
  const { points } = req.body;

  if (!userId) {
    console.log('❌ Unauthorized: no userId');
     res.status(401).json({ error: "Unauthorized" });
     return
  }

  if (!points || points <= 0) {
    console.log('❌ Missing or invalid points:', points);
     res.status(400).json({ error: "Missing or invalid points" });
     return
  }

  try {
    // 🔹 1. สร้าง PaymentIntent ใหม่
    const amount = points * 1; // แปลงเป็น THB หรือคูณตามเรทจริง
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe ต้องเป็นสตางค์
      currency: "thb",
      description: `เติมพอยท์ให้ user ${userId}`,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "topup",          // 🔹 ต้องมี type
        user_id: String(userId), // 🔹 key ต้องตรง webhook
        points: String(points),
      },
    });

    console.log('✅ PaymentIntent created:');
    console.log('  id:', paymentIntent.id);
    console.log('  amount:', paymentIntent.amount);
    console.log('  metadata:', JSON.stringify(paymentIntent.metadata, null, 2));

    // 🔹 2. สร้าง transaction record ในฐานข้อมูล
    const topup = await prisma.point_transactions.create({
      data: {
        transaction_id: paymentIntent.id,
        user_id: userId,
        points,
        amount,
        status: "pending",
      },
    });

    console.log('✅ Transaction created:', topup);

    // 🔹 3. ส่ง client_secret กลับ frontend
    res.json({
      success: true,
      transaction_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    });

    console.log('📤 Response sent to frontend with client_secret');
  } catch (error: any) {
    console.error('❌ Error creating topup:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default createTopupRoute;
