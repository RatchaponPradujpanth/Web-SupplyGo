import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { Prisma, PrismaClient } from "@prisma/client";

const cartRoute = Router();
const prisma = new PrismaClient();

cartRoute.get("/cart", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.user_id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const resultcart = await prisma.cart.findUnique({
      where: { user_id: userId },
      select: { cart_id: true },
    });

    if (!resultcart) {
      res.status(404).json({ message: "cart not found" });
      return;
    }

    const cartId = resultcart.cart_id;

    const resultitem = await prisma.cart.findUniqueOrThrow({
  where: { cart_id: cartId },
  include: {
    cart_items: {
      select: {
        cart_item_id: true,
        quantity: true,
        price_per_unit: true,
        products: {
          select: {
            product_id: true,
            product_name: true,
            image: true,
            price: true,
            status: true,
          },
        },
        shops: {
          select: {
            shop_name: true,
          },
        },
      },
      orderBy: {
        shops: {
          shop_name: 'asc',
        },
      },
    },
  },
});


    const host = req.headers.host;
    const protocol = req.protocol;

    const updatePromises: Promise<any>[] = [];

    const itemsWithImageUrl = resultitem.cart_items
  .filter(item => item.products.status?.toLowerCase() === "active") // ✅
  .map(item => {
    const currentPrice = Number(item.products.price ?? 0);
    const cartPrice = Number(item.price_per_unit ?? 0);

    if (cartPrice !== currentPrice) {
      updatePromises.push(
        prisma.cart_items.update({
          where: { cart_item_id: item.cart_item_id },
          data: { price_per_unit: new Prisma.Decimal(currentPrice) },
        })
      );

      item.price_per_unit = new Prisma.Decimal(currentPrice);
    }

          return {
      cart_item_id: item.cart_item_id,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      product_name: item.products.product_name,
      image: item.products.image ? `${protocol}://${host}${item.products.image}` : null,
      shop_name: item.shops.shop_name,
      total_price: (item.quantity ?? 0) * Number(item.price_per_unit ?? 0),
    };
  });

    await Promise.all(updatePromises);

    res.status(200).json({
      cart_id: cartId,
      items: itemsWithImageUrl,
    });

  } catch (error) {
    console.error("❌ Error loading cart:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการโหลดข้อมูลตะกร้า" });
  }
});

export default cartRoute;
