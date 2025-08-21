import { Router, Request, Response } from 'express';
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
  cart_item_id?: number; // อาจจะมีหรือไม่มีในบางกรณี
  product_id: number;
  quantity: number;
  price_per_unit: number;
  shop_id: number;
  variant_option_id?: number; // Add this field
}

//รอปรับเป็นสำหรับอัพเดทข้อมูลในตาราง


orderRoute.post('/order-success', authenticateToken, async (req: CustomRequest, res: Response) => {
  const userId = req.user?.user_id;
  const { cartId, address_id } = req.body;

  if (!cartId || !address_id) {
    res.status(400).json({ message: 'ต้องระบุ cartId และ address_id' });
    return
  }

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return  
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { cart_id: cartId },
      include: {
        cart_items: {
          select: {
            cart_item_id: true,
            quantity: true,
            price_per_unit: true,
            variant_id: true,
            products: {
              select: {
                product_id: true,
              },
            },
            shops: {
              select: {
                shop_id: true,
              },
            },
            variant_option_links: {
              select: {
                variant_option: {
                  select: {
                    variant_option_id: true, // Add this field
                    value: true,
                    option: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cart_items.length === 0) {
      res.status(400).json({ message: 'ไม่พบสินค้าในตะกร้า' });
      return
    }

    // สร้าง array ของ cartItems จากข้อมูลที่โหลดมา
    const cartItems: CartItem[] = cart.cart_items.map((item) => ({
      cart_item_id: item.cart_item_id,
      product_id: item.products.product_id,
      shop_id: item.shops.shop_id,
      quantity: item.quantity,
      price_per_unit: Number(item.price_per_unit),
      variant_option_id: item.variant_option_links[0]?.variant_option.variant_option_id // Get the first variant option
    }));

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.quantity * item.price_per_unit,
      0
    );

    // เริ่มสร้าง order
    const order = await prisma.order.create({
      data: {
        address_id: address_id,
        user_id: userId,
        order_date: new Date(),
        total_amount: totalAmount,
        status: 'paid',
      },
    });

    const orderId = order.order_id;

    // แยก cart items ตามร้านค้า
    const itemsByShop = cartItems.reduce((acc: Record<number, CartItem[]>, item) => {
      if (!acc[item.shop_id]) acc[item.shop_id] = [];
      acc[item.shop_id].push(item);
      return acc;
    }, {});

    for (const shopIdStr of Object.keys(itemsByShop)) {
      const shopId = parseInt(shopIdStr, 10);
      const items = itemsByShop[shopId];

      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.price_per_unit,
        0
      );

      const orderShop = await prisma.order_shops.create({
        data: {
          order_id: orderId,
          shop_id: shopId,
          subtotal: subtotal,
          status: 'pending',
          tracking_number: null,
        },
      });

      const order_shop_id = orderShop.order_shop_id;

      const orderItemsData = items.map((item) => ({
        order_shop_id: order_shop_id,
        product_id: item.product_id,
        variant_option_id: item.variant_option_id, // Add this field
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
      order_id: orderId,
    });
  } catch (error) {
    console.error('❌ บันทึกคำสั่งซื้อล้มเหลว:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะบันทึกคำสั่งซื้อ' });
    return
  }
});


export default orderRoute;
