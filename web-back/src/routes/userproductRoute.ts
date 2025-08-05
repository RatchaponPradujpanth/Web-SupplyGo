import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const userproductRoute = Router();
const prisma = new PrismaClient();

userproductRoute.get("/loaduserproduct", async (req: Request, res: Response): Promise<void> => {
  console.log('Loadproduct route called');
  try {
    const foundproduct = await prisma.products.findMany({
      include: {
        product_variants: {
          include: {
            variant_options: {
              include: {
                option: true,
              },
            },
          },
        },
        product_images: true,
      },
    });

    const host = req.headers.host;
    const protocol = req.protocol;
    const getFullUrl = (path?: string | null) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      return `${protocol}://${host}${path.startsWith("/") ? path : "/" + path}`;
    };

    const products = foundproduct.map(prod => {
      const primaryImage = prod.product_images.find(img => img.is_primary);
      const mainImage = prod.image ? getFullUrl(prod.image) : primaryImage ? getFullUrl(primaryImage.image_url) : null;

      const variants = prod.product_variants.map(variant => {
        const variantImage = getFullUrl(variant.image);
        return {
          ...variant,
          price: variant.price ? Number(variant.price) : null,
          image: variantImage,
          variant_options: variant.variant_options.map(vo => ({
            variant_option_id: vo.variant_option_id,  // <-- เพิ่มตรงนี้
            option_name: vo.option.name,
            value: vo.value,
          })),
        };
      });

      // 🔍 หากไม่มี price ใน products ให้ใช้ราคาที่ต่ำที่สุดใน variants
      const variantPrices = prod.product_variants
        .map(v => v.price)
        .filter(p => p !== null) as any[];

      const minVariantPrice = variantPrices.length > 0
        ? Number(
            variantPrices.reduce((min, p) => (p! < min! ? p : min), variantPrices[0])
          )
        : null;

      const productImages = prod.product_images.map(img => ({
        ...img,
        image_url: getFullUrl(img.image_url),
      }));

      return {
        ...prod,
        price: prod.price ? Number(prod.price) : minVariantPrice, // 👈 ตรงนี้เลย
        image: mainImage,
        product_variants: variants,
        product_images: productImages,
      };
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error loading products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default userproductRoute;
