import { Router, Request, Response } from 'express';
import { pool } from '../config/db';

const categoryRoute = Router();

// ดึงหมวดหมู่สินค้า
categoryRoute.get('/categories', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT category_id, category_name FROM product_categories ORDER BY category_name ASC'
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ ดึงประเภทสินค้าไม่สำเร็จ:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทสินค้า' });
  }
});

export default categoryRoute;
