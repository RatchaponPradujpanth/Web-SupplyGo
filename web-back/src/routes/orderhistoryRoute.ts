import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { authenticateToken,authstore } from "../middleware/authMiddleware";

const orderhistoryRoute = Router();

orderhistoryRoute.get("/orderhistory",authenticateToken, async (req : Request , res : Response):Promise<void>=>{
    try {
    const user = req.user as {user_id : number}
    const userId = user.user_id;   

        const query = ``
        const result = await pool.query(query[userId])

         
    } catch (error) {
        console.error('❌ Error loading history order :', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})