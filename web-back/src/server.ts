import express from "express";
import dotenv from "dotenv";
import loginRoute from "./routes/loginRoute";
import registerRoute from "./routes/registerRoute";
import cors from "cors";
import loadusernameRoute from "./routes/loadusernameRoute";
import manageproductsRoute from "./routes/manageproductsRoute";
import path from 'path';
import loadstorename from "./routes/loadstorenameRoute";
import storeregisstripe from "./stripe/CreateAccountstripe";
import storeconnect from "./stripe/connectStripe";
import cartRoute from "./routes/cartRoute";
import cartSummaryRoute from "./routes/cartSummaryRoute";
import paymentRoute from "./stripe/paymentRoute";
import addproductRoute from "./routes/addproductRoute";
import categoryRoute from "./routes/categoryRoute";
import checkroleRoute from "./routes/checkroleRoute";
import userproductRoute from "./routes/userproductRoute";
import cartStripe from "./stripe/cartStripe";
import addressRoute from "./routes/addressRoute";
import orderRoute from "./routes/orderRoute";
import loadaddressRoute from "./routes/loadaddressRoute";
import addtocartRoute from "./routes/addtocartRoute";
import orderhistoryRoute from "./routes/orderhistoryRoute";
import shoporderRoute from "./routes/shoporderRoute";
import primarypictureRoute from "./routes/primarypictureRoute";
import removecartitemRoute from "./routes/removecartitemRoute";
import savetransactionRoute from "./routes/savetransactionRoute";
import createorderRoute from "./routes/createorderRoute";
import loadbalanceRoute from "./routes/group_buying/loadbalanceRoute";
import loadgroupbuyRoute from "./routes/group_buying/loadgroupbuyRoute";

dotenv.config(); // โหลดค่า .env

const app = express();
app.use(express.json());
app.use(cors());
app.use('/upload', express.static(path.join(__dirname, '../uploads')));
app.use('/images',express.static(path.join(__dirname, 'picture')));
app.use("/api",registerRoute);
app.use("/api",loginRoute);
app.use("/api",loadusernameRoute);
app.use("/api",manageproductsRoute);
app.use('/api',loadstorename)
app.use("/api",storeregisstripe);
app.use("/api",storeconnect);
app.use("/api",cartRoute);
app.use("/api",cartSummaryRoute);
app.use("/api",paymentRoute);
app.use("/api",addproductRoute)
app.use("/api",categoryRoute);
app.use("/api",checkroleRoute);
app.use("/api",userproductRoute);
app.use("/api",cartStripe);
app.use("/api",addressRoute);
app.use("/api",orderRoute);
app.use("/api",loadaddressRoute);
app.use("/api",addtocartRoute);
app.use("/api",orderhistoryRoute);
app.use("/api",shoporderRoute)
app.use("/api",primarypictureRoute);
app.use("/api",removecartitemRoute)
app.use("/api",savetransactionRoute )
app.use("/api",createorderRoute)
app.use("/api",loadbalanceRoute)
app.use("/api",loadgroupbuyRoute)

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});