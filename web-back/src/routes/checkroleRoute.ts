import { Router, Request, Response } from 'express';
import { authenticateToken, authstore } from '../middleware/authMiddleware';
import { pool } from '../config/db';

const checkroleRoute = Router();

checkroleRoute.get("/check-role", authenticateToken, async (req: Request, res: Response) => {
  const user = req.user as { role: string };
  const role = user.role;
  res.status(200).json({ role });  // key ชื่อ role ตรงกับ frontend
});
export default checkroleRoute;