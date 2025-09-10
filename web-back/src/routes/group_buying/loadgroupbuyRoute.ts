import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const loadgroupbuyRoute = Router();
const prisma = new PrismaClient();

loadgroupbuyRoute.get("/loadgroup", async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await prisma.group_buying.findMany({
      include: {
        product: {
          include: {
            product_images: true
          }
        }
      }
    });

    if (groups.length === 0) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // ประกอบ URL ของรูปให้สมบูรณ์
    const protocol = req.protocol;
    const host = req.headers.host;
    const groupsWithFullImages = groups.map(group => {
      const product = group.product;
      if (product && product.product_images) {
        product.product_images = product.product_images.map(img => ({
          ...img,
          image_url: img.image_url.startsWith("http")
            ? img.image_url
            : `${protocol}://${host}${img.image_url}`
        }));
      }
      return { ...group, product };
    });

    console.log("Loaded groups with full images:", groupsWithFullImages);
    res.json({ groups: groupsWithFullImages });
  } catch (error) {
    console.error('Error loading groups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default loadgroupbuyRoute;
