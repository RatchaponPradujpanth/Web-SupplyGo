import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/authMiddleware';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

// สร้าง PaymentIntent หลายร้าน
const paymentRoute = Router();

paymentRoute.post('/payment-multivendor', authenticateToken, async (req: Request, res: Response) => {
  const { cartId } = req.body;
  const user = req.user as { user_id: number };

  try {
    // ดึงสินค้าและร้านค้าในตะกร้า
    const result = await pool.query(
      `SELECT ci.*, p.product_name, s.shop_id, s.shop_name, s.stripe_account_id
FROM cart_items ci
JOIN products p ON ci.product_id = p.product_id
JOIN shops s ON ci.shop_id = s.shop_id
WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ message: 'ไม่พบสินค้าในตะกร้า' });
      return
    }

    // แยกสินค้าแต่ละร้าน
    const groupedByShop = new Map<number, any[]>();
    for (const item of result.rows) {
      if (!groupedByShop.has(item.shop_id)) groupedByShop.set(item.shop_id, []);
      groupedByShop.get(item.shop_id)!.push(item);
    }

    const paymentIntents = [];

    for (const [shopId, items] of groupedByShop.entries()) {
      const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price_per_unit, 0);
      const stripeAccountId = items[0].stripe_account_id;

      if (!stripeAccountId) {
        res.status(400).json({ message: `ร้าน ${items[0].shop_name} ยังไม่ได้เชื่อม Stripe` });
        return
      }

      // สร้าง PaymentIntent บน connected account
      const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(totalAmount * 100),
  currency: 'thb',
  description: `ชำระเงินให้ร้าน ${items[0].shop_name}`,
  automatic_payment_methods: { enabled: true },
  transfer_data: { destination: stripeAccountId },
});

      paymentIntents.push({
        shop_id: shopId,
        shop_name: items[0].shop_name,
        amount: totalAmount,
        client_secret: paymentIntent.client_secret,
        stripe_account: stripeAccountId, // สำคัญ
      });
    }

    res.status(200).json({ paymentIntents });
    return 
  } catch (error) {
    console.error('❌ สร้าง PaymentIntent ล้มเหลว:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการชำระเงิน' });
    return 
  }
});

export default paymentRoute;
