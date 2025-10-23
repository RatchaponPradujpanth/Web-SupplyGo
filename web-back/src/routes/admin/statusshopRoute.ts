import { Router, Request, Response } from "express";
import { authadmin, authenticateToken } from "../../middleware/authMiddleware"; 
import { PrismaClient } from "@prisma/client";

const statusshopRoute = Router();
const prisma = new PrismaClient();

statusshopRoute.post("/status-shop",authenticateToken,authadmin,async(req : Request , res :Response)=>{
    const shop_id = req.params;

    try {
        
    } catch (error) {
        
    }


})
export default statusshopRoute;