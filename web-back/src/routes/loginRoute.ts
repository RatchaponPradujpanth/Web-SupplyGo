import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, users, shops } from "@prisma/client";

const loginRoute = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// ✅ สร้าง interface สำหรับ JWT Payload
interface JWTPayload {
  user_id: number;
  username: string;
  role: string;
  shop_id?: number; // optional เพราะไม่ใช่ทุกคนมีร้าน
}

// ✅ สร้าง type สำหรับ request body
interface LoginRequest {
  username: string;
  password: string;
}

loginRoute.post("/login", async (req: Request, res: Response): Promise<void> => {
  // ✅ ใช้ interface แทน inline type
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  try {
    // ✅ ใช้ Prisma type helper แทน manual casting
    type UserWithShops = users & { shops: shops[] };
    
    const user = await prisma.users.findUnique({
      where: { username },
      include: { shops: true },
    }) as UserWithShops | null;

    if (!user) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password || "");
    if (!isPasswordMatch) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    // ✅ ใช้ interface แทน any
    const payload: JWTPayload = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
    };

    // ตรวจสอบว่าเป็นร้านค้าและมีร้านหรือไม่
    if (user.role === "store" && user.shops.length > 0) {
      const shop_id = user.shops[0].shop_id;
      payload.shop_id = shop_id; // TypeScript จะรู้ว่า shop_id เป็น optional
      console.log(`✅ ร้านค้าของ user ${user.user_id} คือร้าน ${shop_id}`);
    } else {
      console.log(`ℹ️ ผู้ใช้ ${user.user_id} ไม่ใช่ร้านค้า หรือไม่มีร้าน`);
    }

    // jwt.sign จะได้รับ payload ที่มี type ชัดเจน
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default loginRoute;