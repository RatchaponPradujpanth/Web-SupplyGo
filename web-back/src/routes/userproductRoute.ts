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

    //หา path รูป
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


      // map ข้อมูลก่อนส่งไป frontend
      const variants = prod.product_variants.map(variant => {
        return {
          ...variant,
          price: variant.price ? Number(variant.price) : null,
          variant_options: variant.variant_options.map(vo => ({
            variant_option_id: vo.variant_option_id,  // <-- เพิ่มตรงนี้
            option_name: vo.option.name,
            value: vo.value,
          })),
        };
      });

      // ถ้าไม่มี price ใน products ให้ใช้ราคาที่ต่ำที่สุดใน variants
      const variantPrices = prod.product_variants
        .map(v => v.price) //ดึงราคาจากทุก variant
        .filter(p => p !== null) as any[]; //กรอกเอาเฉพาะที่มีราคาไม่เอา null

        //ตรงนี้เทียบราคาที่ได้แล้วเอาถูกที่สุด
      const minVariantPrice = variantPrices.length > 0
        ? Number(
            variantPrices.reduce((min, p) => (p! < min! ? p : min), variantPrices[0])
          )
        : null;

      //ส่งรูปไปแบบ full path
      const productImages = prod.product_images.map(img => ({
        ...img,
        image_url: getFullUrl(img.image_url),
      }));

      //ส่วนที่ส่งไป
      return {
        ...prod, // ... คือทุกค่า ของ prod ออกมา
        price: prod.price ? Number(prod.price) : minVariantPrice, // บอกว่าเอาราคาจาก
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
