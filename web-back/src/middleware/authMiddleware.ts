import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("SECRET is not defined in environment variables");
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  //ขอ token แนบใน header (Authorization: Bearer <token>) Authorization คือการ ขอ header ชื่อ Authorization
  const token = authHeader && authHeader.split(' ')[1];
  // token จะมาเป็นอะไรสักอย่างโค้ดนี้มีไว้สำหรับตัดข้อความที่ได้มาให้อยู่ในส่วนโค้ดทั้ต้องการ  
  // ได้ผลลัพธ์เป็น ['Bearer', 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'] authHeader && authHeader.splitเอาไว้ตรวจว่ามี token มาไหม


  if (!token) {
    console.log("❌ No token provided");
    res.status(401).json({ message: 'Access token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET) as { user_id: number , shop_id:number,role:string };
    console.log("✅ Decoded token payload:", decoded);
    req.user = decoded;
    next();//บอกให้ทำ middle ถัดไป ถ้าไม่มีก็ทำ route ถัดไป
    //เมื่อคุณเรียก next(), Express จะ ส่ง req (และ res) ตัวเดิม ไปยัง middleware หรือ route ถัดไป
  } catch (error) {
    console.log("❌ Token verification failed:", error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
  // Authorization เพื่อส่ง token
  // แต่ เนื้อหาของ header นี้ (ค่า) สามารถเปลี่ยนไปตามวิธีพิสูจน์ตัวตน เช่น
    // Basic Auth: Basic <base64encoded>
  // Bearer Token: Bearer <token>
};
 

  export const authstore = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "store") {
    console.log("id นี้ไม่ใช่ร้านค้า");
    res.status(403).json({ message: "เฉพาะร้านค้าเท่านั้น" });
    return; // ✅ ต้อง return เพื่อหยุดไม่ให้ไป next()
  }

  next(); // ✅ ไปต่อเฉพาะเมื่อเป็นร้านค้าเท่านั้น
};
