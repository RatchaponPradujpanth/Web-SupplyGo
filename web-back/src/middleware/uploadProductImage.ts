import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination:(req , file, cb) =>{
        cb(null , 'upload/products');
    },
    filename: (req , file , cb) =>{
        const unique = Date.now()+file.originalname;
        cb(null , unique)
    }
})

const uploadProductImage = multer({storage});
export default uploadProductImage;