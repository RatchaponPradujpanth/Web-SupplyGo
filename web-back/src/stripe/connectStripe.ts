import express, { Request, Response, Router } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { pool } from "../config/db";
import { authenticateToken, authstore } from "../middleware/authMiddleware";

dotenv.config();

const storeconnect = Router();

storeconnect.get("/connect", async (req: Request, res: Response):Promise<void> => {
  try {
    const { acct_id, shop_id } = req.query;
    if (!acct_id || !shop_id) {
      res.status(400).send("ข้อมูลไม่ครบ");
      return;
    }

    const query = 'UPDATE shops SET stripe_account_id = $1 WHERE shop_id = $2';
    const result = await pool.query(query,[acct_id,shop_id])

    


    // ใส่ logic ได้ตรงนี้ เช่น UPDATE database หรืออะไรก็ตาม
    res.send('เชื่อมบัญชี Stripe สำเร็จ');
  } catch (error) {
    console.error(error);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
});

export default storeconnect;