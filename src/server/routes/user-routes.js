import { Router } from "express";
const userRouter = Router();
import { hash, compare } from "bcrypt";

import jwt from "jsonwebtoken";
const { sign } = jwt;

import { PostModel, UserModel } from "../schemas.js";
import "dotenv/config";
import mongoose from "mongoose";
import { logEvent } from "../utils/logger.js";

/*For 2.3.3 - data length*/
const LIMITS = {
  username: { min: 3, max: 20 },
  password: { min: 8, max: 64 },
  fullname: { min: 2, max: 50 },
  email:    { min: 5, max: 100 },
};

/*For 2.3.1 | 2.3.3 - if failed, then reject; length validation */
const validateField = (name, value, { min, max }) => {
  if (!value || typeof value !== "string") return `${name} is required.`;
  if (value.length < min || value.length > max)
    return `${name} must be between ${min} and ${max} characters.`;
  return null;
};

userRouter.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip; /*|| req.connection.remoteAddress;*/

  /*For 2.3.1 | 2.3.3 - if failed, then reject; length validation */
  const usernameErr = validateField("Username", username, LIMITS.username);
  const passwordErr = validateField("Password", password, LIMITS.password);
  if (usernameErr || passwordErr) {
    /* For 2.4.5 - Log input validation failure */
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/login", ip, reason: usernameErr || passwordErr });
    /* For 2.4.1 | 2.4.2 - generic message, no debug info */
    return res.status(400).json({ message: "Invalid input." });
  }
 
  /* For 2.3.2 - Validate username character range (alphanumeric, period, hyphen, underscore) */
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/login", ip, reason: "Username contains invalid characters." });
    return res.status(400).json({ message: "Invalid input. It only allows alphanumeric, period, hyphen, and underscore." });
  }

  try {
    // 1. Find the user
    const user = await UserModel.findOne({ username }).lean().exec();

    if (!user) {
      /*For 2.4.6 - log authentication failure*/
      logEvent("AUTH", "FAILURE", { route: "POST /api/login", ip, username, reason: "User not found" });
      /*For 2.4.2: generic message*/
      return res.status(401).json({ message: "Invalid credentials." });
      // return res.status(404).json({ message: "User not found" });
    }

    // 2. Compare hashed password
    // This is the magic part: it decrypts and compares for you
    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      /*For 2.4.6 - Log authentication failure*/
      logEvent("AUTH", "FAILURE", { route: "POST /api/login", ip, username, reason: "Wrong password" });
      /*For 2.4.2: generic message*/
      return res.status(401).json({ message: "Invalid credentials." });
      //return res.status(401).json({ message: "Incorrect password" });
    }

    // 3. Create JWT token
    const token = sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    // 4. Set Cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    /*For 2.4.6 - Log successful authentication*/
    logEvent("AUTH", "SUCCESS", { route: "POST /api/login", ip, username });

    // 5. Send Response
    res.header("Access-Control-Expose-Headers", "*");
    return res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      token: token,
    });

  } catch (err) {
    /*For 2.4.6 - Log internal server error*/
    console.error("Login error:", err);
    return res.status(500).json({ message: "An error occurred. Please try again later." });
    //return res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.post("/api/signup", async (req, res) => {
  const data = req.body;
  const ip = req.ip;
 
  /*For 2.3.1 | 2.3.3 - if failed, then reject; length validation */
  const errors = [
    validateField("Username", data.username, LIMITS.username),
    validateField("Password", data.password, LIMITS.password),
    validateField("Full name", data.fullname, LIMITS.fullname),
    validateField("Email", data.email, LIMITS.email),
  ].filter(Boolean);
  if (errors.length > 0) {
    /*For 2.4.5 - Log validation failure*/
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, reason: errors.join("; ") });
    /*For 2.4.2 - Generic message */
    return res.status(400).json({ message: "Invalid input." });
  }
 
  /*Username - alphanumeric, period, hyphen, underscore only*/
  if (!/^[a-zA-Z0-9._-]+$/.test(data.username)) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, reason: "Username contains invalid characters." });
    return res.status(400).json({ message: "Invalid input." });
  }
 
  /*Full name - letters, spaces, and hyphens only*/
  if (!/^[a-zA-Z\s-]+$/.test(data.fullname)) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, reason: "Full name contains invalid characters." });
    return res.status(400).json({ message: "Invalid input." });
  }
 
  /*Email - basic format check*/
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, reason: "Invalid email format." });
    return res.status(400).json({ message: "Invalid input." });
  }
 
  /*Password - alphanumeric + !@#$* only*/
  if (!/^[a-zA-Z0-9!@#$*]+$/.test(data.password)) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, reason: "Password contains invalid characters." });
    return res.status(400).json({ message: "Invalid input. Password must be alphanumeric and contain at least one special character (!@#$*)." });
  }
  /*Password reqs - must contain uppercase, number, and special character */
  if (!/[A-Z]/.test(data.password) || !/[0-9]/.test(data.password) || !/[!@#$*]/.test(data.password)) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, reason: "Password does not meet requirements." });
    return res.status(400).json({ message: "Invalid input. Password must contain uppercase letters, numbers, and special characters (!@#$*)." });
  }

  try {
    // check if user exists
    const doesUserExist = await UserModel.exists({
      username: data.username,
    });

    // send error if user is in database
    if (doesUserExist) {
      /*For 2.4.5 - Log conflict as a validation failure*/
      logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, username: data.username, reason: "Username already taken." });
      res.sendStatus(400);
      return;
    }

    // create a hashed password
    hash(data.password, 10)
      .then(async (hash) => {
        try {
          // create new user with hashed password
          const newUser = new UserModel({
            displayName: data.fullname,
            username: data.username,
            email: data.email,
            password: hash,
            role: "user",
          });

          // save new user
          await newUser.save();
          logEvent("AUTH", "SUCCESS", { route: "POST /api/signup", ip, username: data.username }); /*For 2.4.6 - Log successful signup as an authentication success*/
          res.sendStatus(201);
        } catch (err) {
          console.error(err);
          res.sendStatus(500);
        }
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(500);
      });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

userRouter.get("/api/user/:username", async (req, res) => {
  const data = req.params;
  try {
    // get user in link
    const user = await UserModel.findOne({
      username: data.username,
    })
      .select("-password")
      .lean()
      .exec();

    // get user posts
    const userPosts = await PostModel.find({
      userID: user._id,
    })
      .populate("userID")
      .sort("-createdAt")
      .lean()
      .exec();

    // send user and user posts
    res.send(
      JSON.stringify({
        user: user,
        posts: userPosts,
      })
    );
  } catch (err) {
    console.error(err);
    res.sendStatus(404);
  }
});

userRouter.get("/api/user/:id/getvotes", async (req, res) => {
  const data = req.params;
  try {
    const userVotes = await UserModel.aggregate()
      .match({ _id: new mongoose.Types.ObjectId(data.id) })
      .lookup({
        from: "posts",
        localField: "_id",
        foreignField: "userID",
        as: "userPosts",
      })
      .unwind("$userPosts")
      .group({
        _id: "$_id",
        totalUpvotes: {
          $sum: {
            $size: "$userPosts.upvotes",
          },
        },
        totalDownvotes: {
          $sum: {
            $size: "$userPosts.downvotes",
          },
        },
      })
      .project({
        _id: 0,
        totalUpvotes: 1,
        totalDownvotes: 1,
      })
      .exec();

    res.send(userVotes);
  } catch (err) {
    console.error(err);
  }
});

export default userRouter;
