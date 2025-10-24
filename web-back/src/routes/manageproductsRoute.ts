import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const manageproductsRoute = Router();
const prisma = new PrismaClient();

manageproductsRoute.get(
  "/manageproducts",
  authenticateToken,
  authstore,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const shopId = req.user?.shop_id;
      if (!shopId) {
        res.status(400).json({ message: "shop_id ไม่ถูกต้อง" });
        return;
      }

      const products = await prisma.products.findMany({
        where: {
          product_owners: {
            some: { shop_id: shopId },
          },
        },
        select: {
          product_id: true,
          product_name: true,
          product_description: true,
          price: true,
          status: true,
          product_batches: {
            select: {
              batch_id: true,
              batch_number: true,
              manufactured_date: true,
              expiry_date: true,
              quantity: true,
            },
          },
          product_variants: {
            select: {
              variant_id: true,
              sku: true,
              price: true,
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
                    select: { name: true },
                  },
                },
              },
            },
          },
          product_options: {
            select: {
              option_id: true,
              name: true,
            },
          },
          product_images: {
            select: {
              product_images_id: true,
              image_url: true,
              is_primary: true,
              sort_order: true,
            },
          },
        },
      });

      const host = req.headers.host;
      const protocol = req.protocol;

      const productsWithFullImageUrls = products.map((prod) => {
        const primaryImage = prod.product_images.find((img) => img.is_primary);

        return {
          ...prod,
          // ✅ รูปหลักจาก product_images
          image: primaryImage
            ? `${protocol}://${host}${primaryImage.image_url}`
            : null,

          total_stock: prod.product_batches.reduce(
            (sum: number, b: { quantity: number }) => sum + b.quantity,
            0
          ),
          batches: prod.product_batches,

          product_variants: prod.product_variants.map((variant) => ({
            ...variant,
            variant_options: variant.variant_options.map((vo) => ({
              value: vo.value,
              option_name: vo.option.name,
            })),
            total_stock: variant.product_batches.reduce(
              (sum: number, b: { quantity: number }) => sum + b.quantity,
              0
            ),
            batches: variant.product_batches,
          })),

          product_images: prod.product_images.map((img) => ({
            ...img,
            image_url: img.image_url
              ? `${protocol}://${host}${img.image_url}`
              : null,
          })),
        };
      });

      res.status(200).json(productsWithFullImageUrls);
    } catch (error) {
      console.error("❌ Error loading manage products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default manageproductsRoute;
