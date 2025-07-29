import express, { Request, Response, Router } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
dotenv.config();

const storeconnect = Router();
const prisma = new PrismaClient();

storeconnect.get("/connect", async (req: Request, res: Response):Promise<void> => {
  try {
    const { acct_id } = req.query;

    const shopId = req.user?.shop_id

    if (typeof acct_id !== "string" || !shopId) {
  res.status(400).send("ข้อมูลไม่ครบ");
  return;
}

    //const query = 'UPDATE shops SET stripe_account_id = $1 WHERE shop_id = $2';
    const updatetable = await prisma.shops.update({
      where:{
        shop_id : shopId,
      },
      data :{
        stripe_account_id : acct_id,
      }

    })

    // ใส่ logic ได้ตรงนี้ เช่น UPDATE database หรืออะไรก็ตาม
    res.send('เชื่อมบัญชี Stripe สำเร็จ');
  } catch (error) {
    console.error(error);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
});

export default storeconnect;