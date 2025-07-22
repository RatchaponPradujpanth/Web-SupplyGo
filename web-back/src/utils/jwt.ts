import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config;
const SECRET = process.env.JWT_SECRET as string;
