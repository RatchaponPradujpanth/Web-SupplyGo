import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const categoryproductRoute = Router();
const prisma = new PrismaClient();

categoryproductRoute.get('/products', async (req: Request, res: Response) => {
  try {
    const categoryName = req.query.category as string | undefined;

    // ✅ ถูกต้องตาม schema (one-to-one relation)
    const whereCondition = categoryName
      ? {
          product_categories: {
            category_name: categoryName
          }
        }
      : {};

    console.log('🔍 Querying with:', { categoryName, whereCondition });

    const foundProducts = await prisma.products.findMany({
      where: whereCondition,
      include: {
        product_categories: true,
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
      },
      orderBy: { created_date: 'desc' },
    });

    const host = req.headers.host;
    const protocol = req.protocol;

    const getFullUrl = (path?: string | null) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `${protocol}://${host}${path.startsWith('/') ? path : '/' + path}`;
    };

    const products = foundProducts.map(prod => {
      // แปลงรูปภาพทั้งหมดเป็น full URL
      const productImages = prod.product_images.map((img) => ({
        ...img,
        image_url: getFullUrl(img.image_url),
      }));

      // หา image หลัก
      const primaryImage = prod.product_images.find((img) => img.is_primary);
      const mainImage = primaryImage
        ? getFullUrl(primaryImage.image_url)
        : productImages.length > 0
        ? productImages[0].image_url
        : null;

      // map variants
      const variants = prod.product_variants.map(variant => ({
        ...variant,
        price: variant.price ? Number(variant.price) : null,
        variant_options: variant.variant_options.map(vo => ({
          variant_option_id: vo.variant_option_id,
          option_name: vo.option.name,
          value: vo.value,
        })),
      }));

      // หาราคาต่ำสุดถ้า prod.price เป็น null
      const variantPrices = variants
        .map(v => v.price)
        .filter(p => p !== null) as number[];
      const minVariantPrice =
        variantPrices.length > 0 ? Math.min(...variantPrices) : null;

      // ✅ ส่ง shops เป็น array
      const shops = prod.product_owners.map(po => ({
        shop_id: po.shops.shop_id,
        shop_name: po.shops.shop_name,
      }));

      return {
        product_id: prod.product_id,
        product_name: prod.product_name,
        product_description: prod.product_description,
        price: prod.price ? Number(prod.price) : minVariantPrice,
        image: mainImage,
        product_images: productImages,
        product_variants: variants,
        product_categories: prod.product_categories,
        shop: shops, // ✅ ส่งเป็น array
      };
    });

    console.log(`✅ Found ${products.length} products for category: ${categoryName || 'all'}`);
    res.status(200).json(products);
  } catch (error) {
    console.error('❌ Fetch products failed:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงสินค้า' });
  }
});

export default categoryproductRoute;