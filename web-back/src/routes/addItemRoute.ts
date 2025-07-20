import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';

const additemRoute = Router();

additemRoute.post(
  "/upload",
  upload.array('images', 10),  // ต้องใส่ multer middleware ก่อน handler
  async (req: Request, res: Response) => {
    const { username, password, email } = req.body;
    const files = req.files as Express.Multer.File[]; // อาจเป็น undefined

    if (!files || files.length === 0) {
      res.status(400).json({ message: "ไม่ได้อัพโหลดไฟล์" });
    }

    const fileNames = files.map(file => file.filename);
    res.status(200).json({ message: "อัปโหลดสำเร็จ", files: fileNames });
  }
);



export default additemRoute;
