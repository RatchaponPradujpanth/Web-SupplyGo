import { error } from "console";
import { Request,Response,NextFunction } from "express";
import { pool } from "../config/db";

export async function verifyEmailMiddleware(req:Request, res:Response, next: NextFunction) {
    const userId = req.user?.user_id //รับ user_id มาเก็บใน userId (ทำทำไม?)

    if(!userId){
        return res.status(401).json({error:"not found user id"});
    }

    try{
        const userResult = await pool.query
        ('SELECT is_verified FROM users WHERE id = $1',[userId]);

        if(userResult.rows.length===0){
            return res.status(401).json({error:"not found user"})
        }

        if(userResult.rows[0].is_verified === false){
            return res.status(401).json({error:"email not veriy"})
        }

        next();


    }catch(err){
        console.log("error นะวัยรุ่น")
        res.status(500).json({ error: 'Database error during email verification' });
    }

}