import express from "express";
import dotenv from "dotenv";
import loginRoute from "./routes/loginRoute";
import registerRoute from "./routes/registerRoute";
import cors from "cors";
import loadusernameRoute from "./routes/loadusernameRoute";
import productRoute from "./routes/productRoute";
import path from 'path';
import loadstorename from "./routes/loadstorenameRoute";
import storeregisstripe from "./stripe/CreateAccountstripe";
import storeconnect from "./stripe/connectStripe";
import cartRoute from "./routes/cartRoute";
import cartSummaryRoute from "./routes/cartSummaryRoute";
import paymentRoute from "./stripe/paymentRoute";
import additemRoute from "./routes/addItemRoute";
import addproductRoute from "./routes/addproductRoute";
import categoryRoute from "./routes/categoryRoute";

dotenv.config(); // โหลดค่า .env

const app = express();
app.use(express.json());
app.use(cors());
app.use('/upload', express.static(path.join(__dirname, '../upload')));
app.use('/images',express.static(path.join(__dirname, 'picture')));
app.use("/api",registerRoute);
app.use("/api",loginRoute);
app.use("/api",loadusernameRoute);
app.use("/api",productRoute);
app.use('/api',loadstorename)
app.use("/api",storeregisstripe);
app.use("/api",storeconnect);
app.use("/api",cartRoute);
app.use("/api",cartSummaryRoute);
app.use("/api",paymentRoute);
app.use("/api",additemRoute)
app.use("/api",addproductRoute)
app.use("/api",categoryRoute);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});