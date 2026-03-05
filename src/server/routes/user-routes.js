import { Router } from "express";
const userRouter = Router();
import { hash, compare } from "bcrypt";

import jwt from "jsonwebtoken";
const { sign } = jwt;

import { PostModel, UserModel } from "../schemas.js";
import "dotenv/config";
import mongoose from "mongoose";

userRouter.post("/api/login", async (req, res) => {
  const data = req.body;
  try {
    // get user with username
    const user = await UserModel.findOne({
      username: data.username,
    })
      .lean()
      .exec();

    // throw error when user isnt found
    if (!user) {
      res.sendStatus(404);
      return;
    }

    // validate password
    compare(data.password, user.password, (err, result) => {
      if (!result) {
        // throw unauthorized error
        res.sendStatus(401);
        return;
      }

      // create jwt token
      const token = sign(
        {
          id: user._id,
          username: user.username,
          role: user.role,
        },
        process.env.SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );

      res.cookie("jwt", token, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      // send user object and jwt token
      res.header("Access-Control-Expose-Headers", "*");
      res.send(
        JSON.stringify({
          user: {
            id: user._id,
            username: user.username,
            role: user.role,
          },
          token: token,
        })
      );
    });
  } catch (err) {
    res.sendStatus(500);
  }
});

userRouter.post("/api/signup", async (req, res) => {
  const data = req.body;

  try {
    // check if user exists
    const doesUserExist = await UserModel.exists({
      username: data.username,
    });

    // send error if user is in database
    if (doesUserExist) {
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
