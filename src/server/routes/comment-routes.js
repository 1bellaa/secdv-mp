import { Router } from "express";
import { CommentModel, PostModel } from "../schemas.js";
import mongoose from "mongoose";
import { ReturnDocument } from "mongodb";
const commentRouter = Router();

commentRouter.post("/api/comment", async (req, res) => {
  const data = req.body;

  // create comment
  const newComment = new CommentModel({
    body: data.comment,
    createdAt: Date.now(),
    commentorID: data.userId,
    upvotes: [data.userId],
    downvotes: [],
    comments: [],
    isDeleted: false,
  });

  try {
    const addedComment = await newComment.save();
    const post = await PostModel.findByIdAndUpdate(data.postId, {
      $addToSet: {
        comments: addedComment,
      },
    }).exec();
    res.send(addedComment);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

commentRouter.post("/api/reply", async (req, res) => {
  const data = req.body;

  // create reply
  const newReply = new CommentModel({
    body: data.reply,
    createdAt: Date.now(),
    commentorID: data.userId,
    upvotes: [data.userId],
    downvotes: [],
    comments: [],
  });

  try {
    const addedReply = await newReply.save();
    const comment = await CommentModel.findByIdAndUpdate(data.commentId, {
      $addToSet: {
        comments: addedReply,
      },
    }).exec();

    res.send(addedReply);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

commentRouter.get("/api/:id/replies", async (req, res) => {
  const data = req.params;

  try {
    const comment = await CommentModel.findById(data.id)
      .populate("commentorID")
      .lean()
      .exec();
    res.send(comment);
  } catch (err) {
    res.sendStatus(500);
  }
});

commentRouter.get("/api/comment/:id/getvotes", async (req, res) => {
  const data = req.params;

  try {
    const votes = await CommentModel.aggregate()
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

commentRouter.put("/api/comments/updatevote", async (req, res) => {
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

    const comment = await CommentModel.findOneAndUpdate(
      {
        _id: data.commentID,
      },
      updateValue,
      {
        returnDocument: "after",
      }
    ).exec();

    res.send(
      JSON.stringify({
        votes: comment.upvotes.length - comment.downvotes.length,
      })
    );
  } catch (err) {
    console.error(err);
  }
});

commentRouter.patch("/api/comment/:id", async (req, res) => {
  const data = req.params;

  try {
    const comment = await CommentModel.findByIdAndUpdate(data.id,
      {
        $set: {
          isDeleted: true,
        },
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});
export default commentRouter;
