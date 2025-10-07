import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const categoryproductRoute = Router();
const prisma = new PrismaClient();

categoryproductRoute.get('/products', async (req: Request, res: Response) => {
  try {
    const categoryName = req.query.category as string | undefined;

    // สร้างเงื่อนไข filter ตาม category
    const whereCondition = categoryName
      ? { product_categories: { category_name: categoryName } }
      : {};

    const foundProducts = await prisma.products.findMany({
      where: whereCondition,
      include: {
        product_categories: true, // join category info
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
      orderBy: { created_date: 'desc' },
    });

    // หา path รูป full URL
    const host = req.headers.host;
    const protocol = req.protocol;
    const getFullUrl = (path?: string | null) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `${protocol}://${host}${path.startsWith('/') ? path : '/' + path}`;
    };

    const products = foundProducts.map(prod => {
      const primaryImage = prod.product_images.find(img => img.is_primary);
      const mainImage = prod.image
        ? getFullUrl(prod.image)
        : primaryImage
        ? getFullUrl(primaryImage.image_url)
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
        variantPrices.length > 0
          ? Math.min(...variantPrices)
          : null;

      // map product images ให้ full URL
      const productImages = prod.product_images.map(img => ({
        ...img,
        image_url: getFullUrl(img.image_url),
      }));

      return {
        ...prod,
        price: prod.price ? Number(prod.price) : minVariantPrice,
        image: mainImage,
        product_variants: variants,
        product_images: productImages,
      };
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('❌ Fetch products failed:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงสินค้า' });
  }
});

export default categoryproductRoute;
