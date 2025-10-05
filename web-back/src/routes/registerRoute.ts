import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const registerRoute = Router();
const prisma = new PrismaClient();

registerRoute.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { username, password, email , role} = req.body;

  if (!username || !password || !email || !role) {
    res.status(400).json({ message: "Username, password and email are required" });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const register = await prisma.users.create({
      data : {
        username, 
        password: hashedPassword,
        email,
        role,
      }
    })

    res.status(201).json({ message: "User registered", userId: register.user_id }); // ✅ ใช้จาก Prisma
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

export default registerRoute;
