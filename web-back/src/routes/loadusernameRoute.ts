import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";
import { PrismaClient, users } from "@prisma/client";

const loadusernameRoute = Router();
const prisma = new PrismaClient();

loadusernameRoute.get("/loadusername",authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
      
    try {
      const user = req.user as { user_id: number };
      //const userId = user.user_id;

      const foundUser = await prisma.users.findUnique({
        where: {user_id : user.user_id},
        select : {username : true},
      });


if (!foundUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

      // const query = 'SELECT username FROM users WHERE user_id = $1';
      // const result = await pool.query(query, [userId]);
      res.status(200).json({ username:foundUser.username });
    } catch (error) {
      console.error('Error loading username:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default loadusernameRoute; //ต้องมาทำความเข้าใจ
