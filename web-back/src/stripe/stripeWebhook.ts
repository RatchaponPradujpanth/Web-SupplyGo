import express from 'express';
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();
const webhookRoute = Router();

webhookRoute.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (error) {
    res.status(400).send(`Webhook Error`);
    return
  }

  console.log(`💡 Webhook received: ${event.type}`);

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata;

      // 🔥 DEBUG: แสดง metadata ทั้งหมด
      console.log('📦 Metadata:', JSON.stringify(metadata, null, 2));

      // ✅ Case: Withdraw
      if (metadata.type === 'withdraw') {
        const withdrawalId = metadata.store_withdrawals_id;
        const approvedByUserId = metadata.approved_by_user_id;

        if (!withdrawalId || !approvedByUserId) {
          console.log('❌ Missing withdrawal metadata');
          res.status(400).send('Missing metadata');
          return
        }

        await prisma.store_withdrawals.update({
          where: { store_withdrawals_id: Number(withdrawalId) },
          data: {
            status: 'completed',
            completed_at: new Date(),
            approved_by_user_id: Number(approvedByUserId),
            approved_at: new Date(),
          },
        });
      }

      // ✅ Case: Order payment
      else if (metadata.type === 'order') {
  const orderShopId = metadata.order_shop_id;
  const orderId = metadata.order_id;

  if (!orderShopId) {
    console.log('❌ Missing order_shop_id');
    res.status(400).send('Missing metadata');
    return;
  }

  // ใช้เวลาปัจจุบัน แล้วแปลงเป็น UTC+7
  const now = new Date();
  const thailandTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  // อัปเดต order_shops เป็น paid พร้อมบันทึกเวลา
  await prisma.order_shops.update({
    where: { order_shop_id: Number(orderShopId) },
    data: {
      status: 'paid',
      order: {
        update: {
          status: 'paid',
          order_date: thailandTime, // เวลาชำระเงินแบบ UTC+7
        },
      },
    },
  });
  console.log(`✅ OrderShop ${orderShopId} paid at ${thailandTime.toISOString()}`);

  // ตรวจสอบว่า order ทั้งหมดจ่ายครบหรือยัง
  const remaining = await prisma.order_shops.count({
    where: { order_id: Number(orderId), status: { not: 'paid' } },
  });

  if (remaining === 0) {
    await prisma.order.update({
      where: { order_id: Number(orderId) },
      data: {
        status: 'paid',
        order_date: thailandTime,
      },
    });
    console.log(`✅ Order ${orderId} fully paid at ${thailandTime.toISOString()}`);

    // 🗑️ ลบตะกร้าหลังจากชำระเงินสำเร็จ
    const orderData = await prisma.order.findUnique({
      where: { order_id: Number(orderId) },
      select: { user_id: true },
    });

    if (orderData?.user_id) {
      const userCart = await prisma.cart.findFirst({
        where: { user_id: orderData.user_id },
        select: { cart_id: true },
      });

      if (userCart) {
        await prisma.cart_items.deleteMany({
          where: { cart_id: userCart.cart_id },
        });
        console.log(`🗑️ Cart cleared for user ${orderData.user_id} after successful payment`);
      }
    }
  }
}


      // ✅ Case: Topup (FIXED VERSION)
      else if (metadata.type === 'topup') {
        const userId = Number(metadata.user_id);
        const points = Number(metadata.points);
        const transactionId = paymentIntent.id;

        console.log(`🔍 Processing topup: transactionId=${transactionId}, userId=${userId}, points=${points}`);

        if (!userId || !points) {
          console.log('❌ Missing topup metadata');
          res.status(400).send('Missing metadata');
          return
        }

        // 🔥 ตรวจสอบว่า transaction มีอยู่ไหม
        const existingTx = await prisma.point_transactions.findUnique({
          where: { transaction_id: transactionId },
        });

        console.log(`📊 Existing transaction:`, existingTx);

        if (existingTx) {
          // ถ้ามีอยู่แล้ว → UPDATE เฉพาะ status
          const updated = await prisma.point_transactions.update({
            where: { transaction_id: transactionId },
            data: { status: 'succeeded' },
          });
          console.log(`✅ Transaction updated:`, updated);
        } else {
          // ถ้ายังไม่มี → CREATE ใหม่
          const created = await prisma.point_transactions.create({
            data: {
              transaction_id: transactionId,
              user_id: userId,
              points,
              amount: paymentIntent.amount_received / 100,
              status: 'succeeded',
            },
          });
          console.log(`✅ Transaction created:`, created);
        }

        // อัปเดต user points
        const userPoints = await prisma.user_points.upsert({
          where: { user_id: userId },
          update: {
            points: { increment: points },
          },
          create: {
            user_id: userId,
            points: points,
          },
        });

        console.log(`✅ User ${userId} now has ${userPoints.points} points (+${points})`);
      }
    }

    res.status(200).send({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:');
    res.status(500).send('Internal Server Error');
  }
});

export default webhookRoute;