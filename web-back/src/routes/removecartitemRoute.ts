import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { Prisma, PrismaClient } from "@prisma/client";

const removecartitemRoute = Router();
const prisma = new PrismaClient()

removecartitemRoute.delete("/remove-cart", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.user_id;
  const { product_id, variant_id, variant_option_ids } = req.body;

  if (!userId || typeof userId !== "number") {
     res.status(401).json({ error: "ผู้ใช้ไม่ได้เข้าสู่ระบบหรือ user_id ไม่ถูกต้อง" });
    return
    }

  try {
    const searchcart = await prisma.cart.findUnique({
      where: { user_id: userId },
      select: { cart_id: true },
    });

    if (!searchcart) {
        res.status(404).json({ error: "Cart not found" });
        return
    }

    const searchitem = await prisma.cart_items.findMany({
      where: {
        cart_id: searchcart.cart_id,
        product_id,
        variant_id: variant_id ?? null,
      },
      include: { variant_option_links: true },
    });

    if (!variant_option_ids || variant_option_ids.length === 0) {
      const targetItem = searchitem[0];
      if (!targetItem) {
        res.status(404).json({ error: "Cart item not found" });
        return
    }
      await prisma.cart_items.delete({
        where: { cart_item_id: targetItem.cart_item_id },
      });

      res.status(200).json({ message: "Removed" });
      return
    }
    

    // ถ้ามี variant options: หา match เป๊ะ
    const matchedItem = searchitem.find(item => {
      const optionIds = item.variant_option_links.map(v => v.variant_option_id).sort();
      JSON.stringify(optionIds) === JSON.stringify([...variant_option_ids].sort());
      return
    
    });

    if (!matchedItem) {
      res.status(404).json({ error: "Variant option not found" });
      return
    }
    

    await prisma.cart_item_variant_options.deleteMany({
      where: { cart_item_id: matchedItem.cart_item_id },
    });

    await prisma.cart_items.delete({
      where: { cart_item_id: matchedItem.cart_item_id },
    });

   res.status(200).json({ message: "Removed successfully" });
    return
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  return
    }
});


export default removecartitemRoute; 