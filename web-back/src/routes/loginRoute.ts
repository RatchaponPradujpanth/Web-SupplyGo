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

interface JWTPayload {
  user_id: number;
  username: string;
  role: string;
  shop_id?: number;
}

interface LoginRequest {
  username: string;
  password: string;
}

loginRoute.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as LoginRequest;

  console.log("🟢 Login attempt:", { username, passwordLength: password?.length });

  if (!username || !password) {
    console.warn("⚠️ Missing username or password");
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  try {
    type UserWithShops = users & { shops: shops[] };
    
    const user = await prisma.users.findUnique({
      where: { username },
      include: { shops: true },
    }) as UserWithShops | null;

    console.log("🔍 Fetched user:", user ? {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      shop_count: user.shops.length,
      shops: user.shops.map(s => ({ shop_id: s.shop_id, shop_name: s.shop_name }))
    } : "❌ Not found");

    if (!user) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password || "");
    console.log("🔑 Password match:", isPasswordMatch);

    if (!isPasswordMatch) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const payload: JWTPayload = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
    };

    if (user.role === "store" && user.shops.length > 0) {
      const shop_id = user.shops[0].shop_id;
      payload.shop_id = shop_id;
      console.log(`🏪 ร้านค้าของ user ${user.user_id}:`, {
        shop_id,
        shop_name: user.shops[0].shop_name,
      });
    } else {
      console.log(`ℹ️ ผู้ใช้ ${user.user_id} ไม่ใช่ร้านค้า หรือไม่มีร้าน`);
    }

    console.log("🧾 JWT Payload:", payload);

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });

    console.log("✅ Token created successfully");
    console.log("------------------------------------------------------------");

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default loginRoute;
