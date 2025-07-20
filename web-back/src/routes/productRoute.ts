import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";

const productRoute = Router();


productRoute.get("/loadproduct",authenticateToken, async (req: Request, res: Response): Promise<void> => {

  console.log('Loadproduct route called');
  try {

    const user = req.user as { shop_id: number };
    const shopId = user.shop_id

    const query = `SELECT 
  p.product_id,
  p.product_name,
  p.price,
  p.status,
  p.image,
  po.shop_id
FROM products p
JOIN product_owners po ON p.product_id = po.product_id
WHERE po.shop_id = $1`;
    const result = await pool.query(query,[shopId]);

    const host = req.headers.host; // ex: "192.168.1.133:5000"
    const protocol = req.protocol; // ex: "http"

    const products = result.rows.map(prod => ({
      ...prod,
      image: prod.image
        ? `${protocol}://${host}/images/${prod.image.replace(/^.*[\\\/]/, '').replace(/"/g, '')}`
        : null
    }));

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'No products found' });
      return;
    }

    res.status(200).json(products);
    console.log('✅ Products from DB:', products);
  } catch (error) {
    console.error('❌ Error loading products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default productRoute;