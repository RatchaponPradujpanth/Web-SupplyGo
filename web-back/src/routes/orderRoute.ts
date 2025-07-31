import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient } from "@prisma/client";

const orderRoute = Router();
const prisma = new PrismaClient();


interface UserPayload {
  user_id: number;
  role: string;
  shop_id: number;
}

export interface CustomRequest extends Request {
  user?: UserPayload;
}

// กำหนด type ของแต่ละ item ใน cart
interface CartItem {
  product_id: number;
  quantity: number;
  price_per_unit: number;
  shop_id: number;
}

orderRoute.post('/order-success', authenticateToken, async (req: CustomRequest, res: Response) => {
  const userId = req.user?.user_id;
  const { cartId, address_id } = req.body;

  console.log('📥 รับ request มาจาก frontend');
  console.log('🧾 cartId:', cartId);
  console.log('🏠 address_id:', address_id);
  console.log('👤 userId จาก token:', userId);

  if (!cartId || !address_id) {
    console.log('❌ ขาดข้อมูล cartId หรือ address_id');
    res.status(400).json({ message: 'ต้องระบุ cartId และ address_id' });
    return 
  }

  if (!userId) {
    console.log('❌ ไม่มี userId ใน token');
    res.status(401).json({ message: 'Unauthorized' });
    return 
  }

  try {

    const cartItemsRaw =await prisma.cart_items.findMany({
      where : {
        cart_id : cartId,
      },
      select : {
        product_id : true,
        quantity : true,
        price_per_unit : true,
         shop_id: true,
      },
    });
    const cartItems: CartItem[] = cartItemsRaw.map((item) => ({
  product_id: item.product_id,
  quantity: item.quantity, // ✅ เป็น number แน่นอน
  price_per_unit: Number(item.price_per_unit), // ✅ แปลง Decimal → number
  shop_id: item.shop_id,
}));

    

    if (cartItems.length === 0) {
      res.status(400).json({ message: 'ไม่พบสินค้าในตะกร้า' });
      return;
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.quantity * item.price_per_unit,
      0
    );
    console.log('💰 ยอดรวมทั้งหมด:', totalAmount);




    const order = await prisma.order.create({
      data : {
        address_id : address_id,
        user_id : userId,
        order_date : new Date(),
        total_amount : totalAmount,
        status : 'paid',
      },
    });
    const orderId = order.order_id;

    console.log('📝 สร้าง order แล้ว, order_id:', orderId);

    const itemsByShop = cartItems.reduce((acc: Record<number, CartItem[]>, item) => {
      if (!acc[item.shop_id]) acc[item.shop_id] = [];
      acc[item.shop_id].push(item);
      return acc;
    }, {});

    for (const shopIdStr of Object.keys(itemsByShop)) {
      const shopId = parseInt(shopIdStr, 10);
      const items = itemsByShop[shopId];

      const subtotal = items.reduce(
        (sum: number, item: CartItem) => sum + item.quantity * item.price_per_unit,
        0
      );

      const orderShop = await prisma.order_shops.create({
        data:{
          order_id : orderId,
          shop_id : shopId,
          subtotal : subtotal,
          status : 'padding',
          tracking_number : null,
        },
      });

      const order_shop_id = orderShop.order_shop_id;

      console.log(`📦 สร้าง order_shop สำหรับ shop_id ${shopId}, order_shop_id:`, order_shop_id);

      const orderItemsData = items.map((item) => ({
        order_shop_id: order_shop_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        total_price: item.quantity * item.price_per_unit,
      }));

      await prisma.order_items.createMany({
        data: orderItemsData,
      });
    }
    res.status(200).json({
      message: 'บันทึกคำสั่งซื้อสำเร็จ',
    });
  } catch (error) {
    console.error('❌ บันทึกคำสั่งซื้อล้มเหลว:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะบันทึกคำสั่งซื้อ' });
  }
});

export default orderRoute;
