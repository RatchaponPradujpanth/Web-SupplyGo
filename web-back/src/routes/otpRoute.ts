import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";
import { PrismaClient , users } from "@prisma/client";

const otpRoute = Router();
const prisma = new PrismaClient();

// เก็บ OTP ชั่วคราว (production ควรใช้ Redis)
const otpStore: Record<string, { otp: string; expires: number; userData: users }> = {};

// สร้าง OTP 6 หลัก
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ส่ง OTP ไปอีเมล
otpRoute.post("/send-otp", async (req: Request, res: Response) => {
  const { email, userData } = req.body;
  
  const otp = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000; // หมดอายุใน 5 นาที
  
  otpStore[email] = { otp, expires, userData };
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'รหัส OTP สำหรับการสมัครสมาชิก',
      text: `รหัส OTP ของคุณคือ: ${otp} (หมดอายุใน 5 นาที)`
    });
    
    res.json({ message: "ส่ง OTP สำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "ส่ง OTP ไม่สำเร็จ" });
  }
});

// ยืนยัน OTP และสร้าง user
otpRoute.post("/verify-otp", async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  
  const stored = otpStore[email];
  if (!stored) {
    res.status(400).json({ message: "ไม่พบ OTP" });
    return
  }
  
  if (Date.now() > stored.expires) {
    delete otpStore[email];
    res.status(400).json({ message: "OTP หมดอายุ" });
    return
  }
  
  if (stored.otp !== otp) {
    res.status(400).json({ message: "OTP ไม่ถูกต้อง" });
    return
  }
  
  try {
    // สร้าง user ในฐานข้อมูล
    const newUser = await prisma.users.create({
      data: stored.userData
    });
    
    delete otpStore[email]; // ลบ OTP ที่ใช้แล้ว
    res.json({ message: "สมัครสมาชิกสำเร็จ", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "สร้าง user ไม่สำเร็จ" });
  }
});

export default otpRoute;