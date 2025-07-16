import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/authMiddleware';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

const paymentRoute = Router();

paymentRoute.post('/payment-multivendor', authenticateToken, async (req: Request, res: Response) => {
  const { cartId } = req.body;

  try {
    // 1. ดึงสินค้าในตะกร้า พร้อมร้านค้า ยอด และ user_id จาก cart
    const result = await pool.query(
      `
      SELECT 
        ci.shop_id, 
        s.stripe_account_id, 
        SUM(ci.quantity * ci.price_per_unit) AS amount,
        c.user_id
      FROM cart_items ci
      JOIN shops s ON ci.shop_id = s.shop_id
      JOIN cart c ON ci.cart_id = c.cart_id
      WHERE ci.cart_id = $1
      GROUP BY ci.shop_id, s.stripe_account_id, c.user_id
      `,
      [cartId]
    );

    const shopPayments = result.rows;

    const paymentIntents: { shop_id: number; client_secret: string }[] = [];

    // 2. สร้าง PaymentIntent ต่อร้าน
    for (const shop of shopPayments) {
      if (!shop.stripe_account_id) {
        console.warn(`⚠️ ร้าน ${shop.shop_id} ยังไม่มี Stripe Account`);
        continue;
      }

      if (!shop.shop_id || !shop.user_id || !cartId) {
        console.warn('⚠️ ข้อมูล metadata บางอย่างว่าง:', {
          shop_id: shop.shop_id,
          user_id: shop.user_id,
          cart_id: cartId,
        });
        continue;
      }

      const amountToCharge = Math.round(shop.amount * 100);
      const intent = await stripe.paymentIntents.create({
        amount: amountToCharge, // ปัดเศษยอดเงิน
        currency: 'thb',
        payment_method_types: ['card'],
        application_fee_amount: 0, // ถ้าจะเก็บ platform fee กำหนดตรงนี้
        transfer_data: {
          destination: shop.stripe_account_id,
        },
        metadata: {
          shop_id: shop.shop_id.toString(),
          user_id: shop.user_id.toString(),
          cart_id: cartId.toString(),
        },
      });

      paymentIntents.push({
        shop_id: shop.shop_id,
        client_secret: intent.client_secret!,
      });
    }

    res.status(200).json({
      message: 'สร้าง PaymentIntents สำเร็จ',
      paymentIntents,
    });
  } catch (error) {
    console.error('❌ สร้าง multi-vendor payment ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถสร้างการชำระเงินได้' });
  }
});

export default paymentRoute;
