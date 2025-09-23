import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../../../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const cancelgroupRoute = Router();
const prisma = new PrismaClient();