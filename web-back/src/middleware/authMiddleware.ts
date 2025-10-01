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
    //console.log("✅ Decoded token payload:", decoded);
    req.user = decoded;

    // console.log("🔍 authenticateToken - decoded user:", req.user);
    // console.log("🔍 user.role:", req.user.role);
    // console.log("🔍 user.shop_id:", req.user.shop_id);
    // console.log("🔍 user.user_id:", req.user.user_id);
    
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
  console.log("🔍 authstore - checking user:", req.user);
  
  // ตรวจสอบว่ามี user data หรือไม่
  if (!req.user) {
    console.log("❌ ไม่มี user data");
    res.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });
    return;
  }

  // ตรวจสอบ role
  if (req.user.role !== "store") {
    console.log("❌ Role ไม่ถูกต้อง:", req.user.role);
    res.status(403).json({ message: "เฉพาะร้านค้าเท่านั้น" });
    return;
  }

  // ตรวจสอบ shop_id
  if (!req.user.shop_id) {
    console.log("❌ ไม่มี shop_id");
    res.status(403).json({ message: "ไม่พบข้อมูลร้านค้า กรุณาสร้างร้านก่อน" });
    return;
  }

  console.log("ผ่านการตรวจสอบ - Shop ID:", req.user.shop_id);
  next();
};


export const authadmin = (
  req: Request,
  res: Response,
  next: NextFunction
) : void => {
  console.log("authadmin - checking user:", req.user);

  if (!req.user) {
    console.log("❌ ไม่มี user data");
    res.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });
    return;
  }
  // ตรวจสอบ role
  if (req.user.role !== "admin") {
    console.log("❌ Role ไม่ถูกต้อง:", req.user.role);
    res.status(403).json({ message: "เฉพาะแอดมินเท่านั้น" });
    return;
  }
  next();
}