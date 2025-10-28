import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient } from "@prisma/client";

const checkStockRoute = Router();
const prisma = new PrismaClient();

interface CheckStockItem {
  productId: number;
  quantity: number;
  variantId?: number | null;
}

interface InsufficientStockItem {
  product_id: number;
  variant_id: number | null;
  product_name: string;
  shop_name: string;
  requested_quantity: number;
  available_stock: number;
  variant_info?: string;
}

/**
 * POST /api/check-stock
 * เช็คว่าสินค้าในตะกร้ามีสต็อกเพียงพอหรือไม่
 */
checkStockRoute.post("/check-stock", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log("🔍 Starting stock check...");
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

  const { cartItems } = req.body as { cartItems: CheckStockItem[] };

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    console.error("❌ Invalid cartItems");
    res.status(400).json({ message: "ข้อมูล cartItems ไม่ถูกต้อง" });
    return;
  }

  try {
    const insufficientItems: InsufficientStockItem[] = [];

    // เช็คสต็อกแต่ละรายการ
    for (const item of cartItems) {
      console.log(`\n📦 Checking stock for:`, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      });

      // ดึงข้อมูลสินค้าเพื่อเอาชื่อและร้านค้า
      const product = await prisma.products.findUnique({
        where: { product_id: item.productId },
        select: { 
          product_name: true,
          product_owners: {
            select: {
              shops: {
                select: { shop_name: true }
              }
            },
            take: 1
          }
        }
      });

      if (!product) {
        console.error(`❌ Product ${item.productId} not found`);
        continue;
      }

      const shopName = product.product_owners[0]?.shops?.shop_name || 'Unknown Shop';

      // หา batch ที่มีสต็อก (เรียงตามวันหมดอายุ)
      const batch = await prisma.product_batches.findFirst({
        where: item.variantId
          ? { variant_id: item.variantId }
          : { 
              product_id: item.productId,
              variant_id: null // สำคัญ: ต้องระบุว่าไม่มี variant
            },
        orderBy: {
          expiry_date: "asc"
        },
        select: {
          batch_id: true,
          quantity: true, // ใช้ quantity ไม่ใช่ stock_quantity
          product_id: true,
          variant_id: true,
        }
      });

      const availableStock = batch?.quantity || 0;
      console.log(`📊 Available stock: ${availableStock}, Requested: ${item.quantity}`);

      // ถ้าสต็อกไม่พอ
      if (!batch || availableStock < item.quantity) {
        // ถ้ามี variant ให้ดึงข้อมูล variant options
        let variantInfo = '';
        if (item.variantId) {
          const variantOptions = await prisma.variant_options.findMany({
            where: { 
              variant_id: item.variantId 
            },
            select: {
              value: true,
              option: {
                select: { name: true }
              }
            }
          });

          variantInfo = variantOptions
            .map(vo => `${vo.option.name}: ${vo.value}`)
            .join(', ');
        }

        insufficientItems.push({
          product_id: item.productId,
          variant_id: item.variantId || null,
          product_name: product.product_name || 'Unknown Product',
          shop_name: shopName,
          requested_quantity: item.quantity,
          available_stock: availableStock,
          variant_info: variantInfo || undefined,
        });

        console.log(`❌ Insufficient stock for product ${item.productId}`);
      } else {
        console.log(`✅ Stock OK for product ${item.productId}`);
      }
    }

    // ส่งผลลัพธ์กลับ
    if (insufficientItems.length > 0) {
      console.log(`⚠️ Found ${insufficientItems.length} items with insufficient stock`);
      res.status(200).json({
        available: false,
        message: "มีสินค้าบางรายการมีสต็อกไม่เพียงพอ",
        insufficientItems
      });
    } else {
      console.log(`✅ All items have sufficient stock`);
      res.status(200).json({
        available: true,
        message: "สินค้าทั้งหมดมีสต็อกเพียงพอ"
      });
    }

  } catch (error) {
    console.error("❌ Check stock error:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    res.status(500).json({ 
      message: "เกิดข้อผิดพลาดในการตรวจสอบสต็อก",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default checkStockRoute;