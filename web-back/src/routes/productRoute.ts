import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";

const productRoute = Router();


productRoute.get("/loadproduct",async (req: Request, res: Response): Promise<void> => {
  console.log('Loadproduct route called');
  try {
    const query = `SELECT * FROM products`;
    const result = await pool.query(query);
   const products = result.rows.map(prod => ({
  ...prod,
  image: prod.image
    ? `http://localhost:5000/images/${prod.image.replace(/^.*[\\\/]/, '').replace(/"/g, '')}`
    : null
}));
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'No products found' }); // ✅ แค่ส่ง ไม่ต้อง return
      return;
    }
    res.status(200).json(products); // ✅ ไม่ต้อง return ก็ได้
    console.log('Products from DB:', products);
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default productRoute;