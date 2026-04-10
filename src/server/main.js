import express from "express";
import ViteExpress from "vite-express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

// 1. Only import the URL, avoid importing the 'db' client if you're using Mongoose
import { db_url } from "./database.js"; 

import userRouter from "./routes/user-routes.js";
import postRouter from "./routes/post-routes.js";
import commentRouter from "./routes/comment-routes.js";

const PORT = 3000;
const app = express();

app.use(express.json());
app.use(cors()); 
app.use(cookieParser());

// 2. Mongoose Connection with feedback
mongoose.connect(db_url, {
  dbName: 'cssecdv'
})
  .then(() => console.log("✅ Mongoose connected to MongoDB Atlas"))
  .catch(err => console.error("❌ Mongoose connection error:", err));

app.use(userRouter);
app.use(postRouter);
app.use(commentRouter);

ViteExpress.listen(app, PORT, () =>
  console.log(`🚀 Server is listening on port ${PORT}...`)
);