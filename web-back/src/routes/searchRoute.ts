import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const searchRoute = Router();

// GET /api/search/suggestions?q=<query>
searchRoute.get('/search/suggestions', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 1) {
      res.json({ products: [] });
      return;
    }

    // ค้นหาสินค้าจากชื่อเท่านั้น (ไม่รวม description)
    const products = await prisma.products.findMany({
      where: {
        product_name: {
          contains: query,
          mode: 'insensitive' // case-insensitive search
        }
      },
      select: {
        product_id: true,
        product_name: true,
        price: true,
        product_images: {
          where: {
            is_primary: true
          },
          select: {
            image_url: true
          },
          take: 1
        }
      },
      take: 5, // จำกัดผลลัพธ์ไม่เกิน 5 รายการ
      orderBy: {
        product_name: 'asc'
      }
    });

    // จัดรูปแบบข้อมูล
    const formattedProducts = products.map(product => ({
      product_id: product.product_id,
      product_name: product.product_name,
      price: product.price,
      picture_url: product.product_images[0]?.image_url || null
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('❌ Search suggestions error:', error);
    res.status(500).json({ message: 'ไม่สามารถค้นหาสินค้าได้' });
  }
});

export default searchRoute;
