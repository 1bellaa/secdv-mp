import { Router, response } from "express";
import { CommentModel, PostModel } from "../schemas.js";
import mongoose from "mongoose";
const postRouter = Router();

postRouter.get("/api/posts", async (req, res) => {
  try {
    const posts = await PostModel.find({})
      .populate("userID")
      .sort("-createdAt")
      .lean()
      .exec();
    res.send(posts);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

postRouter.get("/api/posts/:search", async (req, res) => {
  const data = req.params;
  try {
    const posts = await PostModel.find({
      title: { $regex: data.search, $options: "i" },
    });
    res.send(posts);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

postRouter.get("/api/reported", async (req, res) => {
  try {
    const posts = await PostModel.find({ reports: { $ne: [] } });

    try {
      const reportCounts = await PostModel.aggregate()
        .match({
          reports: { $ne: [] },
        })
        .project({
          _id: 1,
          reportsCount: {
            $size: "$reports",
          },
        });

      res.send(
        JSON.stringify({
          reportedPosts: posts,
          reportCounts: reportCounts,
        })
      );

    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }

    // res.send(posts)
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

postRouter.post("/api/create", async (req, res) => {
  const data = req.body;

  const newPost = new PostModel({
    title: data.title,
    body: data.body,
    userID: data.id,
    createdAt: new Date(),
    comments: [],
    upvotes: [data.id],
    downvotes: [],
  });

  try {
    await newPost.save();
    res.sendStatus(200);
  } catch (err) {}
});

postRouter.get("/api/post/:id", async (req, res) => {
  const data = req.params;

  try {
    const post = await PostModel.findById(data.id)
      .populate("userID")
      .lean()
      .exec();
    res.send(post);
  } catch (err) {
    res.sendStatus(500);
  }
});

postRouter.patch("/api/post/:id", async (req, res) => {
  const params = req.params;
  const data = req.body;

  try {
    const post = await PostModel.findByIdAndUpdate(params.id, {
      title: data.title,
      body: data.body,
    });
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

postRouter.get("/api/post/:id/getvotes", async (req, res) => {
  const data = req.params;

  try {
    const votes = await PostModel.aggregate()
      .match({
        _id: new mongoose.Types.ObjectId(data.id),
      })
      .project({
        userID: "$userID",
        upvotes: "$upvotes",
        downvotes: "$downvotes",
        totalVotes: {
          $subtract: [
            {
              $size: "$upvotes",
            },
            {
              $size: "$downvotes",
            },
          ],
        },
      })
      .exec();

    res.send(votes);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

postRouter.put("/api/post/:id/report", async (req, res) => {
  const params = req.params;
  const data = req.body;
  try {
    const post = await PostModel.findOne({
      _id: params.id,
      reports: {
        $in: [data.userID],
      },
    });

    let update = {};

    if (!post) {
      // add user to reports
      update = {
        $addToSet: {
          reports: data.userID,
        },
      };
    } else {
      // remove user from reports
      update = {
        $pull: {
          reports: data.userID,
        },
      };
    }

    const updatedPost = await PostModel.findByIdAndUpdate(
      {
        _id: params.id,
      },
      update
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

postRouter.get("/api/post/:username/:postId", async (req, res) => {
  const params = req.params;

  try {
    const post = await PostModel.find({
      _id: params.postId,
    })
      .populate({
        path: "userID",
        match: {
          username: params.username,
        },
        select: "-password",
      })
      .populate({
        path: "comments",
      })
      .lean()
      .exec();

    res.send(post);
  } catch (err) {}
});

postRouter.put("/api/posts/updatevote", async (req, res) => {
  const data = req.body;
  let updateValue = {};

  try {
    // check if adding an upvote
    switch (data.count) {
      case 1:
        // user is upvoting
        updateValue = {
          $addToSet: {
            upvotes: data.userID,
          },
          $pull: {
            downvotes: data.userID,
          },
        };
        break;
      case 0:
        // user is resetting upvote/downvote
        updateValue = {
          $pull: {
            upvotes: data.userID,
            downvotes: data.userID,
          },
        };
        break;
      case -1:
        // user is downvoting
        updateValue = {
          $addToSet: {
            downvotes: data.userID,
          },
          $pull: {
            upvotes: data.userID,
          },
        };
        break;
    }

    const post = await PostModel.findOneAndUpdate(
      {
        _id: data.postID,
      },
      updateValue,
      {
        returnDocument: "after",
      }
    ).exec();

    res.send(
      JSON.stringify({
        votes: post.upvotes.length - post.downvotes.length,
      })
    );
  } catch (err) {
    console.error(err);
  }
});

postRouter.delete("/api/post/:id", async (req, res) => {
  const data = req.params;
  try {
    const post = await PostModel.findByIdAndDelete(data.id).exec();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
  }
});

export default postRouter;
