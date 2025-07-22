import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { authenticateToken } from "../middleware/authMiddleware";

const loadaddressRoute = Router();

// GET /api/address  - ดึงที่อยู่ทั้งหมดของ user ที่ login
loadaddressRoute.get('/address', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM address WHERE user_id = $1`,
      [req.user!.user_id]
    );

    res.status(200).json({
      addresses: result.rows,
    });
  } catch (error) {
    console.error('❌ ดึงที่อยู่ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงที่อยู่ได้' });
  }
});

export default loadaddressRoute;
