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
  } catch (err: any) {
    console.log('⚠️ Webhook signature verification failed.', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log(`💡 Webhook received: ${event.type}`);

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata;

      // ✅ Case 1: Withdraw
      if (metadata.type === 'withdraw') {
        const withdrawalId = metadata.store_withdrawals_id;
        const approvedByUserId = metadata.approved_by_user_id;

        if (!withdrawalId || !approvedByUserId) {
          console.log('❌ Metadata withdrawal_id or approved_by_user_id missing');
          res.status(400).send('Missing metadata');
          return;
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
        console.log('✅ Withdrawal updated to completed');
      }

      // ✅ Case 2: Order Payment
      else if (metadata.type === 'order') {
        const orderShopId = metadata.order_shop_id;
        const orderId = metadata.order_id;

        if (!orderShopId) {
          console.log('❌ Metadata order_shop_id missing');
          res.status(400).send('Missing metadata');
          return;
        }

        // อัปเดตสถานะร้านที่จ่ายสำเร็จ
        await prisma.order_shops.update({
          where: { order_shop_id: Number(orderShopId) },
          data: { status: 'completed'},
        });
        console.log(`✅ OrderShop ${orderShopId} marked as completed`);

        // ถ้าทุกร้านใน order จ่ายครบ -> ปิด order
        const remaining = await prisma.order_shops.count({
          where: { order_id: Number(orderId), status: { not: 'completed' } },
        });

        if (remaining === 0) {
          await prisma.order.update({
            where: { order_id: Number(orderId) },
            data: { status: 'completed' },
          });
          console.log(`✅ Order ${orderId} marked as completed`);
        }
      }
    }
  } catch (err: any) {
    console.error('❌ Error while processing webhook:', err.message);
  }

  res.status(200).send({ received: true });
});

export default webhookRoute;
