import express from "express";
import dotenv from "dotenv";
import loginRoute from "./routes/loginRoute";
import registerRoute from "./routes/registerRoute";
import cors from "cors";
import loadusernameRoute from "./routes/loadusernameRoute";
import productRoute from "./routes/productRoute";
import path from 'path';

dotenv.config(); // โหลดค่า .env

const app = express();
app.use(express.json());
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'picture')));
// ใช้งาน route
app.use("/api", registerRoute);
app.use("/api", loginRoute);
app.use("/api",loadusernameRoute);
app.use("/api",productRoute);
app.use(express.json());

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});