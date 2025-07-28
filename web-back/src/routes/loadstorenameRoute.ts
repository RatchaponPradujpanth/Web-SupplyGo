import { Router, Request, Response , NextFunction } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";
import { authstore } from "../middleware/authMiddleware";
import { PrismaClient, shops } from "@prisma/client";

const loadstorename = Router();
const prisma = new PrismaClient();

loadstorename.get(
  "/loadstorename",
  (req, res, next) => {
    console.log("📥 request มาที่ /loadstorename");
    next();
  },
  authenticateToken,
  authstore,
  async (req: Request, res: Response): Promise<void> => {
    console.log("✅ ผ่าน middleware เข้า handler แล้ว");

    try {
      //const user = req.user as { user_id: number; shop_id: number; role: string };
      
      const shopId = req.user?.shop_id;


      const storename = await prisma.shops.findUnique({
        where : {
          shop_id : shopId,
        },
        select:{
          shop_id : true,
          shop_name : true,
          stripe_account_id : true,
        }
        
      })

     
      console.log("🏪 ชื่อร้านที่ดึงได้จาก DB:", storename);
      res.status(200).json(storename);
    } catch (error) {
      console.error("Error loading shopname:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default loadstorename;