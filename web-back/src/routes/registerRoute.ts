import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const registerRoute = Router();
const prisma = new PrismaClient();

// ✅ interface ที่ถูกต้องสำหรับเก็บข้อมูลผู้ใช้ชั่วคราว
interface userData {
  username: string;
  password: string;
  email: string;
  role: string;
}

// ✅ เก็บ OTP ชั่วคราวใน memory
const otpStore: Record<string, { otp: string; expires: number; userData: userData }> = {};

// ✅ สร้าง OTP 6 หลัก
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ✅ สมัครสมาชิก - ส่ง OTP ไปอีเมล
registerRoute.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { username, password, email, role } = req.body;

  if (!username || !password || !email || !role) {
    res.status(400).json({ message: "Username, password, email และ role จำเป็นต้องระบุ" });
    return;
  }

  try {
    // ตรวจสอบว่าอีเมลหรือชื่อผู้ใช้ซ้ำไหม
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      res.status(400).json({ message: "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้แล้ว" });
      return;
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // เก็บข้อมูลผู้ใช้ชั่วคราว (ยังไม่บันทึกลง DB)
    const userData: userData = {
      username,
      password: hashedPassword,
      email,
      role,
    };

    // สร้าง OTP และเก็บไว้
    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // หมดอายุใน 5 นาที

    otpStore[email] = { otp, expires, userData };

    // ส่ง OTP ทางอีเมล
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "รหัส OTP สำหรับการสมัครสมาชิก SupplyGo",
      html: `
        <h2>ยืนยันการสมัครสมาชิก</h2>
        <p>รหัส OTP ของคุณคือ: <strong>${otp}</strong></p>
        <p>รหัสนี้จะหมดอายุใน 5 นาที</p>
      `,
    });

    res.status(200).json({
      message: "ส่งรหัส OTP ไปยังอีเมลแล้ว กรุณาตรวจสอบอีเมลและกรอกรหัส OTP",
      email: email,
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({
      message: "Registration failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// ✅ ยืนยัน OTP และบันทึกผู้ใช้ลงฐานข้อมูล
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

    // ✅ สร้าง user ใหม่ในฐานข้อมูล
    const newUser = await prisma.users.create({
      data: {
        username: stored.userData.username,
        password: stored.userData.password,
        email: stored.userData.email,
        role: stored.userData.role,
      },
    });

    // ลบ OTP ที่ใช้แล้ว
    delete otpStore[email];

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      userId: newUser.user_id,
    });
  } catch (err) {
    console.error("Error during OTP verification:", err);
    res.status(500).json({
      message: "การยืนยัน OTP ล้มเหลว",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// ✅ ขอส่ง OTP ใหม่อีกครั้ง
registerRoute.post("/resend-otp", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "อีเมลจำเป็นต้องระบุ" });
    return;
  }

  try {
    const existingOTP = otpStore[email];
    if (!existingOTP) {
      res.status(400).json({ message: "ไม่พบข้อมูลการสมัคร กรุณาสมัครใหม่" });
      return;
    }

    // สร้าง OTP ใหม่
    const newOTP = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000;

    // อัปเดต OTP ใหม่ โดยยังคงข้อมูลผู้ใช้เดิมไว้
    otpStore[email] = {
      otp: newOTP,
      expires,
      userData: existingOTP.userData,
    };

    // ส่งอีเมลใหม่
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "รหัส OTP ใหม่สำหรับการสมัครสมาชิก SupplyGo",
      html: `
        <h2>รหัส OTP ใหม่</h2>
        <p>รหัส OTP ใหม่ของคุณคือ: <strong>${newOTP}</strong></p>
        <p>รหัสนี้จะหมดอายุใน 5 นาที</p>
        <p><small>หากคุณไม่ได้ขอส่งรหัสใหม่ กรุณาเพิกเฉยต่ออีเมลนี้</small></p>
      `,
    });

    res.status(200).json({ message: "ส่งรหัส OTP ใหม่แล้ว กรุณาตรวจสอบอีเมล" });
  } catch (err) {
    console.error("Error resending OTP:", err);
    res.status(500).json({
      message: "ส่ง OTP ใหม่ไม่สำเร็จ",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default registerRoute;
