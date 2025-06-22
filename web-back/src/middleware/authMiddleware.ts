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
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("❌ No token provided");
    res.status(401).json({ message: 'Access token missing' });
    return;
  }

  const decoded = jwt.verify(token, SECRET) as { user_id: number };
// log ชัดเจน
console.log("✅ Decoded token payload:", decoded);
req.user = decoded;
next()
};

// export const authenticateToken = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

//   if (!token) {
//     return res.status(401).json({ message: 'Access token missing' });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET);
//     req.user = decoded; // ต้องขยาย type ของ Request เพื่อรองรับ .user
//     next();
//   } catch (err) {
//     return res.status(403).json({ message: 'Invalid or expired token' });
//   }
// };
