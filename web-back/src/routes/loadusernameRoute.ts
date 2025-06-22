import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";

const loadusernameRoute = Router();

loadusernameRoute.get("/loadusername",authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as { user_id: number };
      const userId = user.user_id;

      const query = 'SELECT username FROM users WHERE user_id = $1';
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const username = result.rows[0].username;
      res.status(200).json({ username });
    } catch (error) {
      console.error('Error loading username:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default loadusernameRoute; //ต้องมาทำความเข้าใจ
