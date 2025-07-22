import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { authenticateToken } from '../middleware/authMiddleware';

const orderRoute = Router();

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
    const cartItemsRes = await pool.query<CartItem>(
      `
      SELECT 
        ci.product_id, 
        ci.quantity, 
        ci.price_per_unit,
        s.shop_id
      FROM cart_items ci
      JOIN shops s ON ci.shop_id = s.shop_id
      WHERE ci.cart_id = $1
      `,
      [cartId]
    );
    const cartItems = cartItemsRes.rows;

    console.log('🛒 รายการใน cart:', cartItems);

    if (cartItems.length === 0) {
      console.log('❌ ไม่พบสินค้าในตะกร้า');
      res.status(400).json({ message: 'ไม่พบสินค้าในตะกร้า' });
      return 
    }

    const totalAmount = cartItems.reduce(
      (sum: number, item: CartItem) => sum + item.quantity * item.price_per_unit,
      0
    );
    console.log('💰 ยอดรวมทั้งหมด:', totalAmount);

    const orderRes = await pool.query(
      `
      INSERT INTO "order" (address_id, user_id, order_date, total_amount, status)
      VALUES ($1, $2, NOW(), $3, 'paid')
      RETURNING order_id
      `,
      [address_id, userId, totalAmount]
    );
    const order_id = orderRes.rows[0].order_id;

    console.log('📝 สร้าง order แล้ว, order_id:', order_id);

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

      const orderShopRes = await pool.query(
        `
        INSERT INTO order_shops (order_id, shop_id, subtotal, status, tracking_number)
        VALUES ($1, $2, $3, 'pending', NULL)
        RETURNING order_shop_id
        `,
        [order_id, shopId, subtotal]
      );
      const order_shop_id = orderShopRes.rows[0].order_shop_id;

      console.log(`📦 สร้าง order_shop สำหรับ shop_id ${shopId}, order_shop_id:`, order_shop_id);

      const insertItemsPromises = items.map((item) =>
        pool.query(
          `
          INSERT INTO order_items (order_shop_id, product_id, quantity, price_per_unit, total_price)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            order_shop_id,
            item.product_id,
            item.quantity,
            item.price_per_unit,
            item.quantity * item.price_per_unit,
          ]
        )
      );
      await Promise.all(insertItemsPromises);

      console.log(`🧾 เพิ่มรายการสินค้าให้กับร้าน ${shopId}`);
    }

    console.log('✅ บันทึกคำสั่งซื้อสำเร็จทั้งหมด');

    res.status(200).json({
      message: 'บันทึกคำสั่งซื้อสำเร็จ',
      order_id,
    });
  } catch (error) {
    console.error('❌ บันทึกคำสั่งซื้อล้มเหลว:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะบันทึกคำสั่งซื้อ' });
  }
});

export default orderRoute;
