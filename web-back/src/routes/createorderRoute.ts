import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient } from "@prisma/client";
import Decimal from 'decimal.js';
const createorderRoute = Router();
const prisma = new PrismaClient();

interface CartItem {
  product_id: number;
  quantity: number;
  price_per_unit?: number | string;
  shop_id: number;
  variant_option_id?: number | null;
  total_price?: number | string;
}

createorderRoute.post("/create-order", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Received payload:", req.body);
    const userId = req.user?.user_id;
    const { addressId, totalAmount, cartItems } = req.body;

    if (!userId || !addressId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      res.status(400).json({ message: "ข้อมูลไม่ครบ หรือ cartItems ไม่ถูกต้อง" });
      return;
    }

    // สร้าง order ใหม่
    const newOrder = await prisma.order.create({
      data: {
        address_id: addressId,
        user_id: userId,
        total_amount: new Decimal(totalAmount),
        status: "not paid",
      },
      select: {
        order_id: true,
      },
    });

    // หาร้านค้า (shop) ใน cartItems แยกตาม shop_id และคำนวณ subtotal ของแต่ละร้าน
    const shopsMap = new Map<number, { subtotal: number; items: CartItem[] }>();

    for (const item of cartItems) {
      if (typeof item.shop_id !== "number") {
        console.error("Invalid shop_id:", item.shop_id, "in item:", item);
        continue; // ข้าม item ที่ไม่มี shop_id
      }
      const shop = shopsMap.get(item.shop_id);
      if (shop) {
        shop.subtotal += Number(item.total_price ?? 0);
        shop.items.push(item);
      } else {
        shopsMap.set(item.shop_id, {
          subtotal: Number(item.total_price ?? 0),
          items: [item],
        });
      }
    }

    // สร้าง order_shops และ order_items ตามร้านค้า
    for (const [shopId, shopData] of shopsMap.entries()) {
      console.log("Creating order_shop for shopId:", shopId, "subtotal:", shopData.subtotal);

      const orderShop = await prisma.order_shops.create({
        data: {
          order_id: newOrder.order_id,
          shop_id: shopId,
          subtotal: new Decimal(shopData.subtotal),
          status: "not paid",
        },
      });

      // เพิ่ม order_items ทีละรายการในร้านนี้
      const createOrderItems = shopData.items.map(item => {
        return prisma.order_items.create({
          data: {
            order_shop_id: orderShop.order_shop_id,
            product_id: item.product_id,
            variant_option_id: item.variant_option_id ?? null,
            quantity: item.quantity ?? 0,
            price_per_unit: new Decimal(item.price_per_unit ?? 0),
            total_price: new Decimal(item.total_price ?? 0),
          }
        });
      });

      await Promise.all(createOrderItems);
    }

    res.status(201).json({ message: "สร้างคำสั่งซื้อสำเร็จ", order_id: newOrder.order_id });

  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ" });
  }
});

export default createorderRoute;
