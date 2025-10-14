import express from "express";
import "dotenv/config";
//import dotenv from 'dotenv'
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
import admindashboardRoute from "./routes/admin/admindashboardRoute";
import confirmPaymentRoute from "./routes/order/confirmPaymentRoute";
import cancelorderRoute from "./routes/order/cancelorder";
import confirmTopupRoute from "./routes/group_buying/confirmTopupRoute";
import topuppointRoute from "./routes/group_buying/topuppointRoute";
import creategroupRoute from "./routes/group_buying/shop/creategroupRoute";
import manageGroupsRoute from "./routes/group_buying/shop/managegroupRoute";
import joingroupRoute from "./routes/group_buying/customer/joingroupRoute";
import leaveGroupRoute from "./routes/group_buying/customer/leaveGroupRoute";
import confirmgrouporderRoute from "./routes/group_buying/shop/confirmgrouporderRoute";
import cancelgrouporderRoute from "./routes/group_buying/shop/cancelgroupRoute";
import historygroupRoute from "./routes/group_buying/customer/historygroupRoute";
import withdrawRoute from "./routes/group_buying/shop/withdrawRoute";
import approvewithdrawRoute from "./routes/group_buying/admin/approvewithdrawRoute";
import loadwithdrawRoute from "./routes/group_buying/admin/loadwithdrawRoute";
import paymenthistoryRoute from "./routes/admin/paymenthistoryRoute";
import allOrderHistoryRoute from "./routes/admin/allOrderHistoryRoute";
import checkjoingroupRoute from "./routes/group_buying/customer/checkjoingroupRoute";
import categoryproductRoute from "./routes/categoryproductRoute";
import updatestatusRoute from "./routes/shop/updatestatusRoute";
import webhookRoute from "./stripe/stripeWebhook";

// dotenv.config({path:".env"}); // โหลดค่า .env

const app = express();
app.use('/stripe-webhook', webhookRoute);
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
app.use("/api",admindashboardRoute);
app.use("/api",confirmPaymentRoute)
app.use("/api",cancelorderRoute)
app.use("/api",createorderRoute);
app.use("/api",confirmTopupRoute)
app.use("/api",topuppointRoute)
app.use("/api",creategroupRoute)
app.use("/api",manageGroupsRoute)
app.use("/api",joingroupRoute)
app.use("/api",leaveGroupRoute)
app.use("/api",confirmgrouporderRoute)
app.use("/api",cancelgrouporderRoute)
app.use("/api",historygroupRoute)
app.use("/api",withdrawRoute)
app.use("/api",approvewithdrawRoute)
app.use("/api",loadwithdrawRoute)
app.use("/api",paymenthistoryRoute);
app.use("/api",allOrderHistoryRoute)
app.use("/api",checkjoingroupRoute)
app.use("/api",categoryproductRoute)
app.use("/api",updatestatusRoute);


app.listen(5001, () => {
  console.log("Server is running on port 5000");
});