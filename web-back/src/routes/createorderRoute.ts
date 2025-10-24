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
  console.log("🔍 Starting create-order process...");
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("👤 User from token:", req.user);

  const userId = req.user?.user_id;
  const { addressId, totalAmount, cartItems } = req.body;

  console.log("🔧 Extracted data:", {
    userId,
    addressId, 
    totalAmount,
    cartItemsLength: cartItems?.length
  });

  if (!userId || !addressId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    console.error("❌ Missing required data:", {
      hasUserId: !!userId,
      hasAddressId: !!addressId,
      hasCartItems: !!cartItems,
      isArray: Array.isArray(cartItems),
      length: cartItems?.length
    });
    res.status(400).json({ message: "ข้อมูลไม่ครบ หรือ cartItems ไม่ถูกต้อง" });
    return;
  }

  // สว่นนี้แปลง cartItems เป็น snake_case ต้องไปไล่ database อีกที
    const cartItemsSnake = cartItems.map(camelToSnake);
    console.log("Converted cartItems to snake_case:", cartItemsSnake);

   try {
    // ใช้ transaction พร้อม callback
    const result = await prisma.$transaction(async (tx) => {

      // สร้าง order
      const newOrder = await tx.order.create({
        data: {
          address_id: addressId,
          user_id: userId,
          total_amount: new Decimal(totalAmount),
          status: "not paid",
        },
        select: { order_id: true },
      });

      // จัดกลุ่มตามร้าน
      const shopsMap = new Map<number, { subtotal: number; items: typeof cartItemsSnake[0][] }>();
      for (const item of cartItemsSnake) {
        if (!item.total_price) item.total_price = Number(item.price_per_unit) * Number(item.quantity);
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

      // สร้าง order_shops และ order_items พร้อมลด stock
      for (const [shopId, shopData] of shopsMap.entries()) {
        const orderShop = await tx.order_shops.create({
          data: {
            order_id: newOrder.order_id,
            shop_id: shopId,
            subtotal: new Decimal(shopData.subtotal),
            status: "not paid",
          },
        });

        for (const item of shopData.items) {
          // สร้าง order_item
          await tx.order_items.create({
            data: {
              order_shop_id: orderShop.order_shop_id,
              product_id: item.product_id,
              variant_option_id: item.variant_option_ids && item.variant_option_ids.length > 0
                ? item.variant_option_ids[0]
                : null,
              quantity: item.quantity,
              price_per_unit: new Decimal(item.price_per_unit ?? 0),
              total_price: new Decimal(item.total_price ?? 0),
            },
          });

          // เช็คว่าเป็นสินค้าปกติหรือมี variant
          if (!item.variant_id) {
            console.log(`🔍 Processing regular product (no variant) - Product ID: ${item.product_id}, Quantity to deduct: ${item.quantity}`);
          } else {
            console.log(`🔍 Processing product with variant - Product ID: ${item.product_id}, Variant ID: ${item.variant_id}, Quantity to deduct: ${item.quantity}`);
          }

          //หาเลข batch
          const batch = await tx.product_batches.findFirst({
            where: item.variant_id
            ? { variant_id: item.variant_id }   // ถ้ามี variant
            : { product_id: item.product_id }, // ถ้าไม่มี variant
              orderBy: {
                expiry_date: "asc"
              },
              select: {
              batch_id: true,
              quantity: true
              }
              });

          console.log(`📦 Found batch for ${item.variant_id ? 'variant' : 'product'} ${item.variant_id || item.product_id}:`, batch);

          if (!batch || batch.quantity < item.quantity) {
            console.log(`❌ Stock not enough! Required: ${item.quantity}, Available: ${batch?.quantity || 0}`);
            throw new Error("Stock not enough");
          }

          console.log(`📊 Stock before update - Batch ID: ${batch.batch_id}, Current quantity: ${batch.quantity}, Will deduct: ${item.quantity}`);

          // ลด stock ของ variant หรือ product
          if (item.variant_id) {
            console.log(`🔄 Updating stock for variant product - Batch ID: ${batch.batch_id}`);
            await tx.product_batches.update({
              where: { batch_id: batch.batch_id },
              data: {
                quantity: { decrement: item.quantity },
              },
            });
            console.log(`✅ Stock updated for variant product - Batch ID: ${batch.batch_id}, Decremented by: ${item.quantity}`);
          } else {
            console.log(`🔄 Updating stock for regular product (no variant) - Batch ID: ${batch.batch_id}`);
            await tx.product_batches.update({
              where: { batch_id: batch.batch_id },
              data: {
                quantity: { decrement: item.quantity },
              },
            });
            console.log(`✅ Stock updated for regular product - Batch ID: ${batch.batch_id}, Decremented by: ${item.quantity}, New quantity should be: ${batch.quantity - item.quantity}`);
          }

          // เช็ค stock หลังการอัปเดต
          const updatedBatch = await tx.product_batches.findFirst({
            where: { batch_id: batch.batch_id },
            select: { quantity: true }
          });
          console.log(`📈 Stock after update - Batch ID: ${batch.batch_id}, New quantity: ${updatedBatch?.quantity}`);
        }
      }

      // ❌ ไม่ลบตะกร้าที่นี่ เพราะยังไม่ได้ชำระเงิน
      // ตะกร้าจะถูกลบหลังจากชำระเงินสำเร็จใน payment webhook/callback
      console.log(`✅ Order created but cart items preserved until payment is completed`);

      return newOrder;
    });

    console.log(`🎉 Order created successfully - Order ID: ${result.order_id}`);
    res.status(201).json({ message: "สร้างคำสั่งซื้อสำเร็จ", order_id: result.order_id });
  } catch (error: any) {
    console.error("❌ Create order error:", error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Check if it's a Prisma error
    if (error.code) {
      console.error("Error code:", error.code);
    }
    
    res.status(500).json({ 
      message: "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default createorderRoute;