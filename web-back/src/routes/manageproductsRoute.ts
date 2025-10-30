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
        include: {
          product_variants: {
            include: {
              variant_options: {
                include: {
                  option: true,
                },
              },
              product_batches: true,
            },
          },
          product_images: true,
          product_owners: {
            include: {
              shops: {
                select: {
                  shop_id: true,
                  shop_name: true,
                },
              },
            },
          },
          product_batches: true,
          product_options: {
            include: {
              variant_options: true,
            },
          },
          product_categories: true,
        },
      });

      const host = req.headers.host;
      const protocol = req.protocol;
      const getFullUrl = (path?: string | null) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `${protocol}://${host}${path.startsWith("/") ? path : "/" + path}`;
      };

      const formattedProducts = products.map((prod) => {
        const productImages = prod.product_images.map((img) => ({
          id: img.product_images_id,
          image_url: getFullUrl(img.image_url),
          is_primary: img.is_primary,
          sort_order: img.sort_order,
        }));

        const shops = prod.product_owners.map((po) => ({
          shop_id: po.shops.shop_id,
          shop_name: po.shops.shop_name,
        }));

        const primaryImage = prod.product_images.find((img) => img.is_primary);
        const mainImage = primaryImage
          ? getFullUrl(primaryImage.image_url)
          : productImages.length > 0
          ? productImages[0].image_url
          : null;

        const variants = prod.product_variants.map((variant) => {
          const totalStock = variant.product_batches.reduce(
            (sum, batch) => sum + (batch.quantity || 0),
            0
          );

          return {
            variant_id: variant.variant_id,
            sku: variant.sku,
            price: variant.price ? Number(variant.price) : null,
            total_stock: totalStock,
            variant_options: variant.variant_options.map((vo) => ({
              variant_option_id: vo.variant_option_id,
              option_name: vo.option.name,
              value: vo.value,
              option_id: vo.option_id,
            })),
            batches: variant.product_batches?.map((batch) => ({
              batch_id: batch.batch_id,
              batch_number: batch.batch_number,
              manufactured_date: batch.manufactured_date?.toISOString() || null,
              expiry_date: batch.expiry_date?.toISOString() || null,
              quantity: batch.quantity,
            })) || [],
          };
        });

        const productOptions = prod.product_options.map((opt) => ({
          option_id: opt.option_id,
          name: opt.name,
          product_id: opt.product_id,
          variant_options: opt.variant_options.map((vo) => ({
            variant_option_id: vo.variant_option_id,
            value: vo.value,
            option_name: opt.name,
            option_id: opt.option_id,
          })),
        }));

        const productBatches = prod.product_batches
          .filter(batch => !batch.variant_id)
          .map((batch) => ({
            batch_id: batch.batch_id,
            batch_number: batch.batch_number,
            manufactured_date: batch.manufactured_date?.toISOString() || null,
            expiry_date: batch.expiry_date?.toISOString() || null,
            quantity: batch.quantity,
          }));

        const productTotalStock = productBatches.reduce(
          (sum, batch) => sum + (batch.quantity || 0),
          0
        );

        const variantPrices = prod.product_variants
          .map((v) => (v.price ? Number(v.price) : null))
          .filter((p): p is number => p !== null);
        const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;

        return {
          product_id: prod.product_id,
          product_name: prod.product_name,
          product_description: prod.product_description,
          price: prod.price ? Number(prod.price) : minVariantPrice,
          image: mainImage,
          status: prod.status,
          total_stock: productTotalStock,
          product_images: productImages,
          product_variants: variants,
          product_options: productOptions,
          product_batches: productBatches,
          shops: shops,
          category_name: prod.product_categories?.category_name || null,
        };
      });

      res.status(200).json(formattedProducts);
    } catch (error) {
      console.error("❌ Error loading manage products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default manageproductsRoute;
