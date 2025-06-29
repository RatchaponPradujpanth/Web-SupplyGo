import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config;
const SECRET = process.env.JWT_SECRET as string;

export function generateEmailToken(user_id: number): string {
  return jwt.sign({ user_id }, SECRET, { expiresIn: '1d' }); // หมดอายุใน 1 วัน
}