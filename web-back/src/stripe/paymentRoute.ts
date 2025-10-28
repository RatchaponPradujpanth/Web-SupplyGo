import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/authMiddleware';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();

const paymentRoute = Router();

// ------------------ Type Definitions ------------------

type VariantOptionType = {
  value: string;
  option_name: string;
  sku: string | null;
} | null;

type OrderItemType = {
  product_id: number;
  product_name: string | null;
  variant_option: VariantOptionType;
  quantity: number | null;
  price_per_unit: number;
  total_price: number;
};

type PaymentIntentType = {
  order_shop_id: number;
  shop_id: number;
  shop_name: string;
  amount: number;
  amount_in_satang: number;
  client_secret: string;
  payment_intent_id: string;
  stripe_account: string;
  order_items: OrderItemType[];
};

// Prisma include validator
const orderInclude = Prisma.validator<Prisma.orderInclude>()({
  order_shops: {
    where: { status: 'not paid' },
    include: {
      shops: { select: { shop_id: true, shop_name: true, stripe_account_id: true } },
      order_items: {
        include: {
          products: { select: { product_id: true, product_name: true } },
          variant_option: {
            include: {
              option: { select: { name: true } },
              variant: { select: { sku: true } },
            },
          },
        },
      },
    },
  },
  users: { select: { user_id: true, username: true, email: true } },
});

type OrderWithRelations = Prisma.orderGetPayload<{ include: typeof orderInclude }>;

// ------------------ Route ------------------

paymentRoute.post('/payment-multivendor', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { orderId } = req.body;

    if (!userId) {
       res.status(401).json({ message: 'Unauthorized' });
return }
    // ดึง order พร้อม relations
    const order = await prisma.order.findFirst({
      where: {
        order_id: orderId ? Number(orderId) : undefined,
        user_id: userId,
        status: 'not paid',
      },
      include: orderInclude,
      orderBy: { order_date: 'desc' },
    }) as OrderWithRelations | null;

    if (!order) { res.status(404).json({ message: 'ไม่พบคำสั่งซื้อที่ยังไม่ชำระเงิน' }); return}
    if (!order.order_shops || order.order_shops.length === 0){
       res.status(404).json({ message: 'ไม่มีร้านที่ต้องชำระเงิน' });
      return }
    const paymentIntents: PaymentIntentType[] = [];

    for (const shopOrder of order.order_shops) {
      const shopId = shopOrder.shop_id;
      const shopName = shopOrder.shops?.shop_name ?? `shop_${shopId}`;
      const stripeAccountId = shopOrder.shops?.stripe_account_id;

      if (shopOrder.status !== 'not paid') continue;
      if (!stripeAccountId) {res.status(400).json({ message: `ร้าน ${shopName} ยังไม่ได้เชื่อม Stripe` }); return }

      const subtotal = parseFloat(String(shopOrder.subtotal ?? 0));
      if (isNaN(subtotal) || subtotal <= 0){
        res.status(400).json({ message: `ยอดของร้าน ${shopName} ไม่ถูกต้อง: ${shopOrder.subtotal}` });
        return
      }
      const amountInSatang = Math.round(subtotal * 100);

      // สร้าง PaymentIntent แบบ Direct Charge
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSatang,
        currency: 'thb',
        description: `ชำระเงินให้ร้าน ${shopName} (order ${order.order_id})`,
        automatic_payment_methods: { enabled: true },
        transfer_data: { destination: stripeAccountId },
        metadata: {
          type: 'order',
          order_id: String(order.order_id),
          order_shop_id: String(shopOrder.order_shop_id),
          user_id: String(userId),
          shop_id: String(shopId),
          shop_name: shopName,
        },
      });

      // บันทึก transaction_id
      await prisma.order_shops.update({
        where: { order_shop_id: shopOrder.order_shop_id },
        data: { transaction_id: paymentIntent.id },
      });

      // เตรียม order_items แปลง จาก demical ไปเป็น number
      const orderItems: OrderItemType[] = shopOrder.order_items.map(item => ({
  product_id: item.product_id,
  product_name: item.products?.product_name ?? null,
  variant_option: item.variant_option
    ? {
        value: item.variant_option.value,
        option_name: item.variant_option.option.name,
        sku: item.variant_option.variant.sku, // string | null
      }
    : null,
  quantity: item.quantity,
  price_per_unit: item.price_per_unit?.toNumber() ?? 0,
  total_price: item.total_price?.toNumber() ?? 0,
}));


      paymentIntents.push({
        order_shop_id: shopOrder.order_shop_id,
        shop_id: shopId,
        shop_name: shopName,
        amount: subtotal,
        amount_in_satang: amountInSatang,
        client_secret: paymentIntent.client_secret!,
        payment_intent_id: paymentIntent.id,
        stripe_account: stripeAccountId,
        order_items: orderItems,
      });
    }

    if (paymentIntents.length === 0){
      res.status(400).json({ message: 'ไม่มีร้านที่สามารถสร้าง PaymentIntent ได้' });
      return
    }
    res.status(200).json({
      message: 'สร้าง PaymentIntents สำเร็จ',
      order_id: order.order_id,
      total_payment_intents: paymentIntents.length,
      paymentIntents,
      total_amount: parseFloat(String(order.total_amount ?? 0)),
    });
  } catch (error) {
    console.error('❌ สร้าง PaymentIntent ล้มเหลว:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการชำระเงิน', error: String(error) });
  }
});

export default paymentRoute;
