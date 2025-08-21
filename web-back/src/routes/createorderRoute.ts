import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient } from "@prisma/client";
import Decimal from 'decimal.js';

const createorderRoute = Router();
const prisma = new PrismaClient();

interface CartItemCamel {
  productId: number;
  quantity: number;
  price_per_unit?: number | string;
  shopId: number;
  variant_id?: number | null; // เพิ่ม variant_id
  variant_option_ids?: number[]; // เปลี่ยนเป็น array
  total_price?: number | string;
}

// แปลง camelCase -> snake_case
const camelToSnake = (item: CartItemCamel) => ({
  product_id: item.productId,
  quantity: item.quantity,
  price_per_unit: item.price_per_unit ?? 0,
  shop_id: item.shopId,
  variant_id: item.variant_id ?? null, // เพิ่ม variant_id
  variant_option_ids: item.variant_option_ids ?? [], // เพิ่ม variant_option_ids
  total_price: item.total_price ?? 0,
});

createorderRoute.post("/create-order", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Received payload:", req.body);
    console.log("Cart items:", req.body.cartItems);

    const userId = req.user?.user_id;
    const { addressId, totalAmount, cartItems } = req.body;

    if (!userId || !addressId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      res.status(400).json({ message: "ข้อมูลไม่ครบ หรือ cartItems ไม่ถูกต้อง" });
      return;
    }

    // แปลง cartItems เป็น snake_case
    const cartItemsSnake = cartItems.map(camelToSnake);
    console.log("Converted cartItems to snake_case:", cartItemsSnake);

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

    console.log("Created new order:", newOrder);

    // แบ่งแยก cartItems ตาม shop_id และคำนวณ subtotal
    const shopsMap = new Map<number, { subtotal: number; items: typeof cartItemsSnake[0][] }>();

    for (const item of cartItemsSnake) {
      // คำนวณ total_price ถ้าไม่มี
      if (!item.total_price) {
        item.total_price = Number(item.price_per_unit) * Number(item.quantity);
      }

      const shop = shopsMap.get(item.shop_id);
      if (shop) {
        shop.subtotal += Number(item.total_price);
        shop.items.push(item);
      } else {
        shopsMap.set(item.shop_id, {
          subtotal: Number(item.total_price),
          items: [item],
        });
      }
    }

    console.log("Shops map:", shopsMap);

    // สร้าง order_shops และ order_items
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

      console.log("Created order_shop:", orderShop);

      // สร้าง order_items สำหรับแต่ละสินค้าของร้าน
      for (const item of shopData.items) {
        console.log("Creating order_item for:", {
          product_id: item.product_id,
          variant_id: item.variant_id,
          variant_option_ids: item.variant_option_ids,
          quantity: item.quantity
        });

        // สร้าง order_item
        const orderItem = await prisma.order_items.create({
          data: {
            order_shop_id: orderShop.order_shop_id,
            product_id: item.product_id,
            // ใช้ variant_option_id จาก variant_option_ids แรก (ถ้ามี)
            // หรืออาจจะต้องปรับ schema ให้รองรับหลาย variant_option_id
            variant_option_id: item.variant_option_ids && item.variant_option_ids.length > 0 
              ? item.variant_option_ids[0] 
              : null,
            quantity: item.quantity ?? 0,
            price_per_unit: new Decimal(item.price_per_unit ?? 0),
            total_price: new Decimal(item.total_price ?? 0),
          }
        });

        console.log("Created order_item:", orderItem);

        // ถ้ามี variant_option_ids หลายตัว และต้องการเก็บทั้งหมด
        // จะต้องสร้าง table เพิ่มเติม เช่น order_item_variant_options
        // หรือปรับ schema ให้รองรับ JSON array
        
        // วิธีแก้ชั่วคราว: ถ้ามี variant_option_ids หลายตัว ให้ log warning
        if (item.variant_option_ids && item.variant_option_ids.length > 1) {
          console.warn("⚠️ Multiple variant_option_ids detected but only first one was saved:", 
            item.variant_option_ids);
          console.warn("Consider updating schema to support multiple variant options per order item");
        }
      }
    }

    // ลบสินค้าออกจากตะกร้าหลังจากสร้าง order สำเร็จ
    try {
      // หา cart ของ user
      const userCart = await prisma.cart.findFirst({
        where: { user_id: userId },
        select: { cart_id: true }
      });

      if (userCart) {
        // ลบ cart_items ทั้งหมดในตะกร้า
        await prisma.cart_items.deleteMany({
          where: { cart_id: userCart.cart_id }
        });
        console.log("✅ Cleared cart items after order creation");
      }
    } catch (cartError) {
      console.warn("⚠️ Failed to clear cart items:", cartError);
      // ไม่ต้อง throw error เพราะ order สร้างสำเร็จแล้ว
    }

    res.status(201).json({ 
      message: "สร้างคำสั่งซื้อสำเร็จ", 
      order_id: newOrder.order_id 
    });

  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ" });
  }
});

export default createorderRoute;