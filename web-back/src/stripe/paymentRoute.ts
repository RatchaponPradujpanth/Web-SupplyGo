import { Router, Request, Response } from 'express';
import { PrismaClient} from "@prisma/client";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/authMiddleware';


dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
const prisma = new PrismaClient();

// สร้าง PaymentIntent หลายร้าน
const paymentRoute = Router();

paymentRoute.post('/payment-multivendor', authenticateToken, async (req: Request, res: Response) => {
   const { cartId } = req.body;
if (isNaN(cartId)) {
  console.log (cartId)
  res.status(400).json({ message: "cartId ไม่ถูกต้อง" });
  return;
}

  const userId = req.user?.user_id;

  try {
    const result = await prisma.cart_items.findMany({
      where : { cart_id : cartId },
      select : {
        cart_item_id: true,
        quantity: true,
        price_per_unit: true,
        product_id : true,
        shop_id : true,
        products : { select : { product_name : true } },
        shops : { select : { shop_name : true, stripe_account_id : true } }
      }
    });

    const groupedByShop = new Map<number, typeof result[0][]>();
    for (const item of result) {
      if (!groupedByShop.has(item.shop_id)) groupedByShop.set(item.shop_id, []);
      groupedByShop.get(item.shop_id)!.push(item);
    }
    
    const paymentIntents = [];

    for (const [shopId, items] of groupedByShop.entries()) {
      const totalAmount = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.price_per_unit),
        0
      );

      const stripeAccountId = items[0].shops.stripe_account_id;
      const shopName = items[0].shops.shop_name;

      if (!stripeAccountId) {
        res.status(400).json({
          message: `ร้าน ${shopName} ยังไม่ได้เชื่อม Stripe กรุณาติดต่อร้านค้า`
        });
        return; // หยุดการทำงานถ้าร้านนี้ยังไม่ได้เชื่อม Stripe
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: "thb",
        description: `ชำระเงินให้ร้าน ${shopName}`,
        automatic_payment_methods: { enabled: true },
        transfer_data: { destination: stripeAccountId },
      });

      paymentIntents.push({
        shop_id: shopId,
        shop_name: shopName,
        amount: totalAmount,
        client_secret: paymentIntent.client_secret,
        stripe_account: stripeAccountId,
        
      });
    }

    // ส่ง response หลังทำงานครบทุกร้าน
    res.status(200).json({
      message: "สร้าง PaymentIntents สำหรับแต่ละร้านสำเร็จ",
      paymentIntents,
    });

  } catch (error) {
    console.error('❌ สร้าง PaymentIntent ล้มเหลว:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการชำระเงิน' });
  }
});


export default paymentRoute;
