import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  displayName: String,
  username: String,
  email: String,
  password: String,
  role: String
})
export const UserModel = mongoose.model("users", UserSchema, "users")

const CommentSchema = new Schema({
  body: String,
  createdAt: Date,
  commentorID: {
    type: Schema.Types.ObjectId,
    ref: UserModel
  },
  upvotes: [{
    type: Schema.Types.ObjectId,
    ref: UserModel,
  }],
  downvotes: [{
    type: Schema.Types.ObjectId,
    ref: UserModel,
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
})
CommentSchema.add({
  comments: [CommentSchema]
})
export const CommentModel = mongoose.model("comments", CommentSchema, "comments")

const PostSchema = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    ref: UserModel,
  },
  title: String,
  body: String,
  upvotes: [{
    type: Schema.Types.ObjectId,
    ref: UserModel,
  }],
  downvotes: [{
    type: Schema.Types.ObjectId,
    ref: UserModel,
  }],
  createdAt: Date,
  comments: [{
    type: Schema.Types.ObjectId,
    ref: CommentModel
  }],
  reports: [{
    type: Schema.Types.ObjectId,
    ref: UserModel,
  }]
})
export const PostModel = mongoose.model("posts", PostSchema, "posts")