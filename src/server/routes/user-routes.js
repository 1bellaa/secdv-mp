import { Router } from "express";
const userRouter = Router();
import { hash, compare } from "bcrypt";
import crypto from "crypto"; // Built-in Node tool

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
    // 1. Find the user (removed .lean() so we can interact with the document if needed)
    const user = await UserModel.findOne({ username }).exec();

    if (!user) {
      /*For 2.4.6 - log authentication failure*/
      logEvent("AUTH", "FAILURE", { route: "POST /api/login", ip, username, reason: "User not found" });
      /*For 2.4.2: generic message*/
      return res.status(401).json({ message: "Invalid credentials." });
      // return res.status(404).json({ message: "User not found" });
    }

    // 2. Check if account is currently locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ 
        message: `Account locked. Try again in ${remainingTime} minutes.` 
      });
    }

    //2.1.12
    const lastLoginNotice = user.lastActivity || null;

    // 3. Compare hashed password
    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      //2.1.12
      await UserModel.updateOne({ _id: user._id }, {
        $set: { "lastActivity": { method: "Unsuccessful", timestamp: new Date(), ip: ip } }
      });
      /*For 2.4.6 - Log authentication failure*/
      logEvent("AUTH", "FAILURE", { route: "POST /api/login", ip, username, reason: "Wrong password" });
      /*For 2.4.2: generic message*/
      return res.status(401).json({ message: "Invalid credentials." });
      //return res.status(401).json({ message: "Incorrect password" });
    }

    //2.1.12
    await UserModel.updateOne({ _id: user._id }, {
      $set: { 
        loginAttempts: 0,
        "lastActivity": { method: "Successful", timestamp: new Date(), ip: ip } 
      },
      $unset: { lockUntil: 1 }
    });

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

    // 6. Set Cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    /*For 2.4.6 - Log successful authentication*/
    logEvent("AUTH", "SUCCESS", { route: "POST /api/login", ip, username });

    // 7. Send Response
    res.header("Access-Control-Expose-Headers", "*");
    return res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        securityQuestion: user.securityQuestion,
      },
      token: token,
      lastNotice: lastLoginNotice,
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

  // 1. Add Security Question/Answer to your initial validation list
  const errors = [
    validateField("Username", data.username, LIMITS.username),
    validateField("Password", data.password, LIMITS.password),
    validateField("Full name", data.fullname, LIMITS.fullname),
    validateField("Email", data.email, LIMITS.email),
    // Validate that the question and answer exist
    !data.securityQuestion ? "Security question is required." : null,
    !data.securityAnswer ? "Security answer is required." : null,
  ].filter(Boolean);

  if (errors.length > 0) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, reason: errors.join("; ") });
    return res.status(400).json({ message: "Invalid input." });
  }

  // ... (Keep your existing Regex checks for username, email, etc.) ...

  try {
    const doesUserExist = await UserModel.exists({ username: data.username });
    if (doesUserExist) {
      logEvent("VALIDATION", "FAILURE", { route: "POST /api/signup", ip, username: data.username, reason: "Username taken." });
      return res.sendStatus(400);
    }

    // 2. Hash BOTH the password and the security answer
    // Note: I've switched to async/await for cleaner code
    const hashedPassword = await hash(data.password, 10);
    
    // Normalize the answer (lowercase + trim) so 'Cat' and 'cat' both work
    const normalizedAnswer = data.securityAnswer.toLowerCase().trim();
    const hashedAnswer = await hash(normalizedAnswer, 10);

    const newUser = new UserModel({
      displayName: data.fullname,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      securityQuestion: data.securityQuestion, // Plain text (e.g., "What is your pet's name?")
      securityAnswer: hashedAnswer,           // Hashed
      role: "user",
    });

    await newUser.save();
    logEvent("AUTH", "SUCCESS", { route: "POST /api/signup", ip, username: data.username });
    res.sendStatus(201);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

userRouter.post("/api/user/change-password", async (req, res) => {
  const { userId, oldPassword, newPassword, securityAnswer } = req.body;
  const ip = req.ip;

  // const MIN_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const MIN_AGE = 60 * 1000; // 1 min FOR TESTING ONLY
  const HISTORY_LIMIT = 5;

  // 1. Validate New Password Complexity (Reusing your Signup logic)
  const passwordErr = validateField("Password", newPassword, LIMITS.password);
  if (passwordErr) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/user/change-password", ip, userId, reason: passwordErr });
    return res.status(400).json({ message: "Invalid input." });
  }

  if (!/^[a-zA-Z0-9!@#$*]+$/.test(newPassword) || 
      !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$*]/.test(newPassword)) {
    logEvent("VALIDATION", "FAILURE", { route: "POST /api/user/change-password", ip, userId, reason: "Password complexity failed." });
    return res.status(400).json({ message: "Password does not meet security requirements." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Verify Security Answer
    const normalizedAttempt = securityAnswer.toLowerCase().trim();
    const isAnswerCorrect = await compare(normalizedAttempt, user.securityAnswer);
    
    if (!isAnswerCorrect) {
      logEvent("AUTH", "FAILURE", { route: "POST /api/user/change-password", ip, userId, reason: "Wrong security answer" });
      return res.status(401).json({ message: "Security answer is incorrect." });
    }

    // 2. [Requirement 2.1.11] Check Password Age
    const timeSinceLastChange = Date.now() - new Date(user.lastPasswordChange || 0).getTime();
    if (timeSinceLastChange < MIN_AGE) {
      logEvent("AUTH", "FAILURE", { route: "POST /api/user/change-password", ip, userId, reason: "Password changed too recently." });
      return res.status(403).json({ message: "Password must be at least one day old before it can be changed." });
    }

    // 3. Verify Current Password
    const isMatch = await compare(oldPassword, user.password);
    if (!isMatch) {
      logEvent("AUTH", "FAILURE", { route: "POST /api/user/change-password", ip, userId, reason: "Incorrect old password." });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 4. [Requirement 2.1.10] Prevent Password Re-use (Current & History)
    const isSameAsCurrent = await compare(newPassword, user.password);
    if (isSameAsCurrent) {
      return res.status(400).json({ message: "New password cannot be the same as the current password." });
    }

    for (const historicHash of user.passwordHistory || []) {
      const wasUsedBefore = await compare(newPassword, historicHash);
      if (wasUsedBefore) {
        logEvent("VALIDATION", "FAILURE", { route: "POST /api/user/change-password", ip, userId, reason: "Attempted to reuse old password." });
        return res.status(400).json({ message: "You cannot reuse any of your last 5 passwords." });
      }
    }

    // 5. Success - Hash, Update History, and Save
    const hashedNewPassword = await hash(newPassword, 10);
    
    // Push current hash to history and slice to limit
    let updatedHistory = [user.password, ...(user.passwordHistory || [])].slice(0, HISTORY_LIMIT);

    await UserModel.updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedNewPassword,
          lastPasswordChange: Date.now(),
          passwordHistory: updatedHistory
        } 
      }
    );

    logEvent("AUTH", "SUCCESS", { route: "POST /api/user/change-password", ip, userId });
    return res.status(200).json({ message: "Password updated successfully." });

  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "An error occurred. Please try again later." });
  }
});

userRouter.post("/api/request-reset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found." });

    // 1. Generate a random 40-character hex token
    const token = crypto.randomBytes(20).toString("hex");

    // 2. Set token and expiry (Valid for 1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    // 3. Instead of sending an email, we print it to the console for testing
    const resetUrl = `http://localhost:3000/reset-password/${token}`;
    console.log("------------------------------------------");
    console.log(`PASSWORD RESET EMAIL SENT TO: ${email}`);
    console.log(`LINK: ${resetUrl}`);
    console.log("------------------------------------------");

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

userRouter.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword, securityAnswer } = req.body; // Added securityAnswer
  const ip = req.ip;
  const HISTORY_LIMIT = 5;

  try {
    // 1. Find user by token and check expiry
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      logEvent("AUTH", "FAILURE", { route: "POST /api/reset-password", ip, reason: "Invalid or expired token" });
      return res.status(400).json({ message: "Link has expired or is invalid." });
    }

    // 2. Verify Security Answer (New Addition)
    if (!securityAnswer) {
        return res.status(400).json({ message: "Security answer is required." });
    }
    const isAnswerCorrect = await compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);
    if (!isAnswerCorrect) {
      logEvent("AUTH", "FAILURE", { route: "POST /api/reset-password", ip, userId: user._id, reason: "Wrong security answer during reset" });
      return res.status(401).json({ message: "Security answer is incorrect." });
    }

    // 3. Complexity check
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$*]).{8,64}$/.test(newPassword)) {
      return res.status(400).json({ message: "Password does not meet complexity requirements." });
    }

    // 4. Prevent Re-use
    const isSameAsCurrent = await compare(newPassword, user.password);
    if (isSameAsCurrent) {
      return res.status(400).json({ message: "Cannot use your current forgotten password." });
    }

    for (const historicHash of user.passwordHistory || []) {
      if (await compare(newPassword, historicHash)) {
        return res.status(400).json({ message: "You cannot reuse any of your last 5 passwords." });
      }
    }

    // 5. Success - Update everything
    const hashedNewPassword = await hash(newPassword, 10);
    user.passwordHistory = [user.password, ...(user.passwordHistory || [])].slice(0, HISTORY_LIMIT);
    user.password = hashedNewPassword;
    user.lastPasswordChange = Date.now();
    
    // Clear reset tokens and lockouts
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    logEvent("AUTH", "SUCCESS", { route: "POST /api/reset-password", ip, userId: user._id });
    return res.status(200).json({ message: "Password updated successfully!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

userRouter.get("/api/get-question-by-token/:token", async (req, res) => {
  const user = await UserModel.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) return res.status(404).json({ message: "Invalid token" });
  res.json({ question: user.securityQuestion });
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
