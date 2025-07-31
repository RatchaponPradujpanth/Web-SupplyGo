import { Router, Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";

const categoryRoute = Router();
const prisma = new PrismaClient();

// ดึงหมวดหมู่สินค้า
categoryRoute.get('/categories', async (req: Request, res: Response) => {
  try {

    const foundproduct = await prisma.product_categories.findMany({
      select : {
        category_id : true,
        category_name : true,
      },
      orderBy : {
        category_name : 'asc',
      },
    })
    const products = foundproduct.map(prod => ({
      ...prod,
}));

    res.status(200).json(foundproduct);
  } catch (error) {
    console.error('❌ ดึงประเภทสินค้าไม่สำเร็จ:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทสินค้า' });
  }
});

export default categoryRoute;
