import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { authenticateToken,authstore } from "../middleware/authMiddleware";
import { PrismaClient, products } from "@prisma/client";

const productRoute = Router();
const prisma = new PrismaClient();

productRoute.get("/loadproduct",authenticateToken,authstore, async (req: Request, res: Response): Promise<void> => {

  console.log('Loadproduct route called');
  try {

    const shopId = req.user?.shop_id;
    const productowner = await prisma.products.findMany({
  where: {
    product_owners: {
      some: {
        shop_id: shopId,  // shopId คือค่าที่รับเข้ามาแทน $1
      }
    }
  },
  select: {
    product_id: true,
    product_name: true,
    price: true,
    status: true,
    image: true,
    product_owners: {
      select: {
        shop_id: true,
      }
    }
  }
});


    const host = req.headers.host; // ex: "192.168.1.133:5000"
    const protocol = req.protocol; // ex: "http"

    const products = productowner.map(prod => ({
  ...prod,
  image: prod.image ? `${protocol}://${host}${prod.image}` : null
}));



    res.status(200).json(products);
    console.log('✅ Products from DB:', products);
  } catch (error) {
    console.error('❌ Error loading products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default productRoute;