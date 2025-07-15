import { Router, Request, Response , NextFunction } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";
import { authstore } from "../middleware/authMiddleware";

const loadstorename = Router();

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
      const user = req.user as { user_id: number; shop_id: number; role: string };
      console.log("User from token:", user);

      const shopId = user.shop_id;
      if (!shopId) {
        res.status(400).json({ message: "shop_id ไม่ถูกต้อง" });
        return;
      }

      const query = "SELECT shop_name, stripe_account_id FROM shops WHERE shop_id = $1";
      const result = await pool.query(query, [shopId]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "ไม่เจอชื่อร้าน" });
        return;
      }

      const { shop_name, stripe_account_id } = result.rows[0];
     
      console.log("🏪 ชื่อร้านที่ดึงได้จาก DB:", shop_name);
      res.status(200).json({ shopname: shop_name, shop_id: shopId, stripe_account_id });
    } catch (error) {
      console.error("Error loading shopname:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default loadstorename;