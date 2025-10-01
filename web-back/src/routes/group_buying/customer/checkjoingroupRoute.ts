import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../../../middleware/authMiddleware";

const checkjoingroupRoute = Router();
const prisma = new PrismaClient();

checkjoingroupRoute.get("/check-join", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // ดึง user id จาก token
    if (!userId) {
       res.status(401).json({ message: "Unauthorized" });
        return
    }

    // หา group ที่ user ยังอยู่ (left_at ยังเป็น null)
    const groups = await prisma.group_members.findMany({
      where: {
        user_id: userId,
        left_at: null,
      },
      select: {
        group_buying_id: true,
      },
    });

    const groupIds = groups.map((g) => g.group_buying_id);

     res.json({
      success: true,
      groupIds,
    });
    return
  } catch (error) {
    console.error("Error in /check-join:", error);
     res.status(500).json({ success: false, message: "Server error" });
    return
    }
});

export default checkjoingroupRoute;
