import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const manageproductsRoute = Router();
const prisma = new PrismaClient();

manageproductsRoute.get("/manageproducts", authenticateToken, authstore, async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.user?.shop_id;
    if (!shopId) {
      res.status(400).json({ message: "shop_id ไม่ถูกต้อง" });
      return;
    }

    // ดึงข้อมูลสินค้าของร้านที่ login มา พร้อมข้อมูล variant, options, images
const products = await prisma.products.findMany({
  where: {
    product_owners: {
      some: {
        shop_id: shopId,
      },
    },
  },
  select: {
    product_id: true,
    product_name: true,
    product_description: true,
    price: true,
    status: true,
    image: true, // รูปหลักจาก products table
    product_variants: {
      select: {
        variant_id: true,
        sku: true,
        price: true,
        // ✅ ดึง batches มาแทน stock_quantity
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
    product_options: {
      select: {
        option_id: true,
        name: true,
      },
    },
    product_images: {
      select: {
        id: true,
        image_url: true,
        is_primary: true,
        sort_order: true,
      },
    },
  },
});

    // สร้าง URL รูปภาพให้สมบูรณ์ (ถ้าเก็บเป็น relative path)
    const host = req.headers.host; // เช่น "localhost:5000"
    const protocol = req.protocol; // เช่น "http" หรือ "https"

    const productsWithFullImageUrls = products.map(prod => ({
  ...prod,
  // รูปหลักของสินค้า
  image: prod.image ? `${protocol}://${host}${prod.image}` : null,
  product_variants: prod.product_variants.map(variant => ({
    ...variant,
    
    variant_options: variant.variant_options.map(vo => ({
      value: vo.value,
      option_name: vo.option.name,
    })),
    
    total_stock: variant.product_batches.reduce((sum, b) => sum + b.quantity, 0),
    batches: variant.product_batches, // เก็บ batch info เผื่อ frontend ใช้งาน
  })),
  product_images: prod.product_images.map(img => ({
    ...img,
    image_url: img.image_url ? `${protocol}://${host}${img.image_url}` : null,
  })),
}));

    res.status(200).json(productsWithFullImageUrls);

  } catch (error) {
    console.error('❌ Error loading manage products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default manageproductsRoute;
