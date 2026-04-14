import { authenticateToken } from "../utils/auth.js";
import { logEvent } from "../utils/logger.js"; // For auditing
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

// postRouter.get("/api/reported", async (req, res) => {
//   try {
//     const posts = await PostModel.find({ reports: { $ne: [] } });

//     try {
//       const reportCounts = await PostModel.aggregate()
//         .match({
//           reports: { $ne: [] },
//         })
//         .project({
//           _id: 1,
//           reportsCount: {
//             $size: "$reports",
//           },
//         });

//       res.send(
//         JSON.stringify({
//           reportedPosts: posts,
//           reportCounts: reportCounts,
//         })
//       );

//     } catch (err) {
//       console.error(err);
//       res.sendStatus(500);
//     }

//     // res.send(posts)
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// });

postRouter.get("/api/reported", authenticateToken, async (req, res) => {
  // Only Admin and Manager can see this dashboard data
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "Access denied." });
  }

  try {
    const posts = await PostModel.find({ reports: { $ne: [] } }).populate("userID");
    const reportCounts = await PostModel.aggregate()
      .match({ reports: { $ne: [] } })
      .project({
        _id: 1,
        reportsCount: { $size: "$reports" },
      });

    res.json({
      reportedPosts: posts,
      reportCounts: reportCounts,
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

postRouter.post("/api/create", authenticateToken, async (req, res) => {
  const { title, body } = req.body;

  const newPost = new PostModel({
    title,
    body,
    userID: req.user.id, // Securely set from verified JWT
    createdAt: new Date(),
    comments: [],
    upvotes: [req.user.id],
    downvotes: [],
  });

  try {
    await newPost.save();
    res.sendStatus(200);
  } catch (err) {}
});

// postRouter.get("/api/post/:id", async (req, res) => {
//   const data = req.params;

//   try {
//     const post = await PostModel.findById(data.id)
//       .populate("userID")
//       .lean()
//       .exec();
//     res.send(post);
//   } catch (err) {
//     res.sendStatus(500);
//   }
// });

postRouter.get("/api/post/:id", async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id)
      .populate("userID", "username displayName role") // ONLY these fields
      .lean()
      .exec();

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Requirement 2.4: You could log that a post was viewed, 
    // but usually, we only log sensitive actions (Write/Delete).
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// postRouter.patch("/api/post/:id", async (req, res) => {
//   const params = req.params;
//   const data = req.body;

//   try {
//     const post = await PostModel.findByIdAndUpdate(params.id, {
//       title: data.title,
//       body: data.body,
//     });
//     res.sendStatus(200);
//   } catch (err) {
//     res.sendStatus(500);
//   }
// });

postRouter.patch("/api/post/:id", authenticateToken, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (post.userID.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own posts." });
    }
    
    post.title = req.body.title;
    post.body = req.body.body;
    await post.save();
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

// postRouter.get("/api/post/:id/getvotes", async (req, res) => {
//   const data = req.params;

//   try {
//     const votes = await PostModel.aggregate()
//       .match({
//         _id: new mongoose.Types.ObjectId(data.id),
//       })
//       .project({
//         userID: "$userID",
//         upvotes: "$upvotes",
//         downvotes: "$downvotes",
//         totalVotes: {
//           $subtract: [
//             {
//               $size: "$upvotes",
//             },
//             {
//               $size: "$downvotes",
//             },
//           ],
//         },
//       })
//       .exec();

//     res.send(votes);
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// });

postRouter.get("/api/post/:id/getvotes", async (req, res) => {
  try {
    const votes = await PostModel.aggregate()
      .match({ _id: new mongoose.Types.ObjectId(req.params.id) })
      .project({
        // Only return the lengths and the calculated total
        upvotesCount: { $size: "$upvotes" },
        downvotesCount: { $size: "$downvotes" },
        totalVotes: {
          $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }]
        }
      })
      .exec();

    if (!votes || votes.length === 0) return res.status(404).json({ message: "Post not found" });
    
    res.json(votes[0]); // Return the object directly rather than an array
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching votes" });
  }
});

// postRouter.put("/api/post/:id/report", async (req, res) => {
//   const params = req.params;
//   const data = req.body;
//   try {
//     const post = await PostModel.findOne({
//       _id: params.id,
//       reports: {
//         $in: [data.userID],
//       },
//     });

//     let update = {};

//     if (!post) {
//       // add user to reports
//       update = {
//         $addToSet: {
//           reports: data.userID,
//         },
//       };
//     } else {
//       // remove user from reports
//       update = {
//         $pull: {
//           reports: data.userID,
//         },
//       };
//     }

//     const updatedPost = await PostModel.findByIdAndUpdate(
//       {
//         _id: params.id,
//       },
//       update
//     );

//     res.sendStatus(200);
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// });

postRouter.put("/api/post/:id/report", authenticateToken, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    
    // Safety check: prevent crashing if the post ID is invalid or already deleted
    if (!post) return res.status(404).json({ message: "Post not found" });

    const hasReported = post.reports.includes(req.user.id);

    const update = hasReported 
      ? { $pull: { reports: req.user.id } } 
      : { $addToSet: { reports: req.user.id } };

    await PostModel.findByIdAndUpdate(req.params.id, update);
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

// postRouter.put("/api/posts/updatevote", async (req, res) => {
//   const data = req.body;
//   let updateValue = {};

//   try {
//     // check if adding an upvote
//     switch (data.count) {
//       case 1:
//         // user is upvoting
//         updateValue = {
//           $addToSet: {
//             upvotes: data.userID,
//           },
//           $pull: {
//             downvotes: data.userID,
//           },
//         };
//         break;
//       case 0:
//         // user is resetting upvote/downvote
//         updateValue = {
//           $pull: {
//             upvotes: data.userID,
//             downvotes: data.userID,
//           },
//         };
//         break;
//       case -1:
//         // user is downvoting
//         updateValue = {
//           $addToSet: {
//             downvotes: data.userID,
//           },
//           $pull: {
//             upvotes: data.userID,
//           },
//         };
//         break;
//     }

//     const post = await PostModel.findOneAndUpdate(
//       {
//         _id: data.postID,
//       },
//       updateValue,
//       {
//         returnDocument: "after",
//       }
//     ).exec();

//     res.send(
//       JSON.stringify({
//         votes: post.upvotes.length - post.downvotes.length,
//       })
//     );
//   } catch (err) {
//     console.error(err);
//   }
// });

postRouter.put("/api/posts/updatevote", authenticateToken, async (req, res) => {
  const { postID, count } = req.body;
  const userId = req.user.id; // Securely retrieved from the token
  let updateValue = {};

  try {
    switch (count) {
      case 1: // Upvote
        updateValue = {
          $addToSet: { upvotes: userId },
          $pull: { downvotes: userId },
        };
        break;
      case 0: // Reset
        updateValue = {
          $pull: { upvotes: userId, downvotes: userId },
        };
        break;
      case -1: // Downvote
        updateValue = {
          $addToSet: { downvotes: userId },
          $pull: { upvotes: userId },
        };
        break;
      default:
        return res.status(400).json({ message: "Invalid vote count." });
    }

    const post = await PostModel.findOneAndUpdate(
      { _id: postID },
      updateValue,
      { returnDocument: "after" }
    ).exec();

    if (!post) return res.status(404).json({ message: "Post not found." });

    res.json({
      votes: post.upvotes.length - post.downvotes.length,
    });
  } catch (err) {
    console.error("Voting error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

postRouter.delete("/api/post/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const post = await PostModel.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Requirement 2.2.3: Check if Owner OR Admin OR Manager
    const isOwner = post.userID.toString() === req.user.id;
    const isPrivileged = req.user.role === "admin" || req.user.role === "manager";

    if (isOwner || isPrivileged) {
      await PostModel.findByIdAndDelete(id);
      
      // Audit Log for Requirement 2.4
      logEvent("ACCESS_CONTROL", "SUCCESS", { 
        action: "DELETE_POST", 
        deletedBy: req.user.username, 
        role: req.user.role,
        postID: id 
      });
      
      return res.sendStatus(200);
    }

    // unauthorized attempt
    logEvent("ACCESS_CONTROL", "FAILURE", { 
      action: "DELETE_POST", 
      attemptedBy: req.user.username, 
      reason: "Unauthorized attempt to delete foreign post" 
    });
    res.status(403).json({ message: "You don't have permission to delete this." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default postRouter;
