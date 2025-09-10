import { Router, Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../../middleware/authMiddleware';

const confirmPaymentRoute = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,);

confirmPaymentRoute.post("/confirm-payment/:orderId",authenticateToken,async( req : Request , res : Response)=>{
  const {orderId} = req.params;

  //ดึง order_shop
  const orderShops = await prisma.order_shops.findMany({
    where : {
      order_id : Number(orderId)
    }
  })
  if(!orderShops.length){
    res.status(400).json({error:"หา orderShop ไม่เจอ"})
  }

  let allSucceeded = true;

  for(const shop of orderShops) {
    if(!shop.transaction_id) continue;
    const paymentIntent = await stripe.paymentIntents.retrieve(shop.transaction_id)
    if (paymentIntent.status !== "succeeded") allSucceeded = false;
  }

  if (!allSucceeded){
    res.status(400).json({ success: false, status: "payment not completed"})
  }

  await prisma.order_shops.updateMany({
    where : {
      order_id : Number(orderId)
    },
    data :{
      status : "paid"
    }
  });

  res.json({success : true , status : "paid"})
})
  
export default confirmPaymentRoute