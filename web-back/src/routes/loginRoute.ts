import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, users, shops } from "@prisma/client";

const   loginRoute = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

loginRoute.post("/login", async (req: Request, res: Response): Promise<void> => {
  // กำหนด type ให้ชัดเจนเพื่อให้ TypeScript เข้าใจ
  const { username, password } = req.body as { username: string; password: string };

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  try {
    // ระบุ type ให้ user ชัดเจนว่า จะได้ users + shops[]
    const user = await prisma.users.findUnique({
      where: { username },
      include: { shops: true },
    }) as (users & { shops: shops[] }) | null;

    if (!user) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password || "");
    if (!isPasswordMatch) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const payload: any = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
    };

    if (user.role === "store" && user.shops.length > 0) {
      const shop_id = user.shops[0].shop_id;
      payload.shop_id = shop_id;
      console.log(`✅ ร้านค้าของ user ${user.user_id} คือร้าน ${shop_id}`);
    } else {
      console.log(`ℹ️ ผู้ใช้ ${user.user_id} ไม่ใช่ร้านค้า หรือไม่มีร้าน`);
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default loginRoute;
