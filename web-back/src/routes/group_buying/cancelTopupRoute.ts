import { Router, Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../../middleware/authMiddleware';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();

const cancelTopupRoute = Router()