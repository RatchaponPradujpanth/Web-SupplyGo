import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const registerRoute = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

interface userData {
  username: string;
  password: string;
  email: string;
  role: string;
  shop_name?: string; // ✅ เพิ่ม shop_name
}

const otpStore: Record<string, { otp: string; expires: number; userData: userData }> = {};
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ✅ สร้าง transporter ครั้งเดียวตอน init (เร็วกว่า)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ✅ สมัครสมาชิก - ส่ง OTP ไปอีเมล
registerRoute.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { username, password, email, role, shop_name } = req.body;

  if (!username || !password || !email || !role) {
    res.status(400).json({ message: "Username, password, email และ role จำเป็นต้องระบุ" });
    return;
  }

  // ✅ ถ้าเป็นร้านค้า ต้องมีชื่อร้าน
  if (role === "STORE" && !shop_name) {
    res.status(400).json({ message: "กรุณากรอกชื่อร้านค้าของคุณ" });
    return;
  }

  try {
    const existingUser = await prisma.users.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      res.status(400).json({ message: "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้แล้ว" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ เก็บข้อมูลทั้งหมดรวม shop_name (ถ้ามี)
    const userData: userData = {
      username,
      password: hashedPassword,
      email,
      role,
      shop_name,
    };

    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000;

    otpStore[email] = { otp, expires, userData };

    // ✅ ส่งอีเมล OTP แบบ async (ไม่รอ - เร็วกว่า)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "รหัส OTP สำหรับการสมัครสมาชิก SupplyGo",
      html: `
        <h2>ยืนยันการสมัครสมาชิก</h2>
        <p>รหัส OTP ของคุณคือ: <strong>${otp}</strong></p>
        <p>รหัสนี้จะหมดอายุใน 5 นาที</p>
      `,
    }).catch(err => {
      console.error("❌ Email sending failed:", err);
    });

    // ตอบกลับทันทีโดยไม่รอส่งเมล
    res.status(200).json({
      message: "ส่งรหัส OTP ไปยังอีเมลแล้ว กรุณาตรวจสอบอีเมลและกรอกรหัส OTP",
      email,
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ✅ ยืนยัน OTP และสร้าง user (พร้อมร้าน)
registerRoute.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ message: "อีเมลและรหัส OTP จำเป็นต้องระบุ" });
    return;
  }

  try {
    const stored = otpStore[email];
    if (!stored) {
      res.status(400).json({ message: "ไม่พบรหัส OTP หรือหมดอายุแล้ว" });
      return;
    }

    if (Date.now() > stored.expires) {
      delete otpStore[email];
      res.status(400).json({ message: "รหัส OTP หมดอายุแล้ว กรุณาลงทะเบียนใหม่" });
      return;
    }

    if (stored.otp !== otp) {
      res.status(400).json({ message: "รหัส OTP ไม่ถูกต้อง" });
      return;
    }

    // ✅ Transaction: สร้าง user และร้านถ้าเป็น STORE
    // ✅ Transaction: สร้าง user และร้านถ้าเป็น STORE
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.users.create({
    data: {
      username: stored.userData.username,
      password: stored.userData.password,
      email: stored.userData.email,
      role: stored.userData.role,
    },
  });

  console.log("DEBUG - Shop name:", stored.userData.shop_name);
console.log("DEBUG - User ID:", user.user_id);
  let shop = null;
  if (stored.userData.role === "store" && stored.userData.shop_name) {
    shop = await tx.shops.create({
      data: {
        shop_name: stored.userData.shop_name,
        user_id: user.user_id,
      },
    });

    // ✅ เพิ่ม console log เพื่อตรวจสอบ
    console.log("🛒 สร้างร้านค้าเรียบร้อย:", shop);
  }

  console.log("👤 สร้างผู้ใช้เรียบร้อย:", user);

  return { user, shop };
});


    delete otpStore[email];

    // ✅ ออก JWT พร้อม shop_id ถ้ามี
    const token = jwt.sign(
      {
        id: result.user.user_id,
        role: result.user.role,
        shop_id: result.shop ? result.shop.shop_id : null,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user: result.user,
      shop: result.shop,
      token,
    });
  } catch (err) {
    console.error("Error during OTP verification:", err);
    res.status(500).json({ message: "การยืนยัน OTP ล้มเหลว" });
  }
});

export default registerRoute;
