import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { Prisma, PrismaClient } from "@prisma/client";

const cartRoute = Router();
const prisma = new PrismaClient();

cartRoute.get("/cart", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
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
            product_id: true,
            cart_item_id: true,
            quantity: true,
            price_per_unit: true,
            variant_id: true,
            variant: {
              select: {
                sku: true,
                price: true,
                // รวม stock จาก batches แทน stock_quantity เดิม
                product_batches: {
                  select: {
                    batch_id: true,
                    batch_number: true,
                    manufactured_date: true,
                    expiry_date: true,
                    quantity: true,
                  },
                },
                variant_options: {
                  select: {
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
            products: {
              select: {
                product_id: true,
                product_name: true,
                price: true,
                status: true,
                product_images: {
                  where: { is_primary: true },
                  select: { image_url: true },
                  take: 1,
                },
              },
            },
            shops: {
              select: {
                shop_name: true,
              },
            },
          },
        },
      },
    });

    const host = req.headers.host;
    const protocol = req.protocol;
    
    const getFullUrl = (path?: string | null) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      return `${protocol}://${host}${path.startsWith("/") ? path : "/" + path}`;
    };

    // ✅ วิธีที่ 1: ใช้ Return Type ที่ถูกต้อง (แนะนำ)
    type CartItemUpdateResult = Prisma.PromiseReturnType<typeof prisma.cart_items.update>;
    const updatePromises: Promise<CartItemUpdateResult>[] = [];

    // หรือ ✅ วิธีที่ 2: ใช้ Awaited + ReturnType (สั้นกว่า)
    // const updatePromises: Awaited<ReturnType<typeof prisma.cart_items.update>>[] = [];

    // หรือ ✅ วิธีที่ 3: ใช้ GetPayload (ชัดเจนที่สุด)
    // const updatePromises: Promise<Prisma.cart_itemsGetPayload<{}>>[] = [];

    // หรือ ✅ วิธีที่ 4: ใช้ unknown (ถ้าไม่สนใจ return value)
    // const updatePromises: Promise<unknown>[] = [];

    const itemsWithImageUrl = resultitem.cart_items
      .filter(item => item.products.status?.toLowerCase() === "active")
      .map(item => {
        // ใช้ราคาจาก variant ถ้ามี หรือใช้ราคาสินค้าปกติ
        const currentPrice = item.variant?.price ?? item.products.price ?? 0;
        const cartPrice = Number(item.price_per_unit ?? 0);

        if (cartPrice !== Number(currentPrice)) {
          updatePromises.push(
            prisma.cart_items.update({
              where: { cart_item_id: item.cart_item_id },
              data: { price_per_unit: new Prisma.Decimal(currentPrice) },
            })
          );
          item.price_per_unit = new Prisma.Decimal(currentPrice);
        }

        // สร้าง variant options string
        const variantOptions = item.variant?.variant_options.map(vo => ({
          name: vo.option.name,
          value: vo.value
        }));

        const variantDisplay = variantOptions
          ? variantOptions.map(opt => `${opt.name}: ${opt.value}`).join(', ')
          : null;

        return {
          cart_item_id: item.cart_item_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit,
          product_name: item.products.product_name,
          image: item.products.product_images[0]?.image_url
            ? getFullUrl(item.products.product_images[0].image_url)
            : null,
          shop_name: item.shops.shop_name,
          variant_id: item.variant_id,
          variant_info: variantDisplay,
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