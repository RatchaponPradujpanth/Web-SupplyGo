import { Router, Request, Response } from "express";
import { PrismaClient} from "@prisma/client";

const userproductRoute = Router();
const prisma = new PrismaClient();

userproductRoute.get("/loaduserproduct", async (req: Request, res: Response): Promise<void> => {
  console.log('Loadproduct route called');
  try {

    const foundproduct = await prisma.products.findMany()
    const host = req.headers.host; // ex: "192.168.1.133:5000"
    const protocol = req.protocol; // ex: "http"

    const products = foundproduct.map(prod => ({
      ...prod,
  image: prod.image ? `${protocol}://${host}${prod.image}` : null
}));


    res.status(200).json(products);
    //console.log('✅ Products from DB:', products);
  } catch (error) {
    console.error('❌ Error loading products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default userproductRoute;
