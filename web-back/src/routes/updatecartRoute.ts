import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient, Prisma } from "@prisma/client";

const updatecartRoute = Router();
const prisma = new PrismaClient();

updatecartRoute.put("/update-cart-quantity", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.user_id;
  const { cart_item_id, quantity } = req.body;

  if (!userId || typeof userId !== "number") {
    res.status(401).json({ error: "ผู้ใช้ไม่ได้เข้าสู่ระบบหรือ user_id ไม่ถูกต้อง" });
    return;
  }

  if (!cart_item_id || !quantity || quantity < 1) {
    res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน: ต้องมี cart_item_id และ quantity ที่มากกว่า 0" });
    return;
  }

  try {
    // ตรวจสอบว่า cart item นี้เป็นของ user คนนี้หรือไม่
    const cartItem = await prisma.cart_items.findFirst({
      where: {
        cart_item_id: cart_item_id,
        cart: {
          user_id: userId
        }
      },
      include: {
        variant: {
          include: {
            product_batches: {
              select: {
                quantity: true
              }
            }
          }
        },
        products: {
          select: {
            product_id: true,
            status: true,
            product_batches: {
              select: {
                quantity: true
              }
            }
          }
        }
      }
    });

    if (!cartItem) {
      res.status(404).json({ error: "ไม่พบสินค้าในตะกร้า" });
      return;
    }

    // ตรวจสอบสต็อก
    let totalStock = 0;
    if (cartItem.variant_id) {
      // ใช้สต็อกจาก variant
      totalStock = cartItem.variant?.product_batches.reduce((sum, batch) => sum + (batch.quantity ?? 0), 0) ?? 0;
    } else {
      // ใช้สต็อกจากสินค้าปกติ
      totalStock = cartItem.products.product_batches.reduce((sum, batch) => sum + (batch.quantity ?? 0), 0);
    }

    if (quantity > totalStock) {
      res.status(400).json({ 
        error: `จำนวนสินค้าเกินจำนวนในสต็อก (มีอยู่ ${totalStock} ชิ้น)`,
        available_stock: totalStock
      });
      return;
    }

    // อัปเดตจำนวนสินค้าในตะกร้า
    const updatedCartItem = await prisma.cart_items.update({
      where: {
        cart_item_id: cart_item_id
      },
      data: {
        quantity: quantity
      },
      include: {
        products: {
          select: {
            product_name: true
          }
        }
      }
    });

    res.status(200).json({ 
      message: "อัปเดตจำนวนสินค้าสำเร็จ",
      cart_item: {
        cart_item_id: updatedCartItem.cart_item_id,
        quantity: updatedCartItem.quantity,
        price_per_unit: updatedCartItem.price_per_unit,
        total_price: Number(updatedCartItem.price_per_unit) * updatedCartItem.quantity,
        product_name: updatedCartItem.products.product_name
      }
    });

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตตะกร้า:", error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

export default updatecartRoute;