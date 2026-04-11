import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  displayName: String,
  username: String,
  email: String,
  password: { type: String, required: true },
  lastPasswordChange: { type: Date, default: Date.now },
  // Store an array of previous password hashes (e.g., the last 5)
  passwordHistory: { type: [String], default: [] },
  role: String,
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number },
  lastActivity: {
    method: { type: String }, // "Successful" or "Unsuccessful"
    timestamp: { type: Date },
    ip: { type: String }
  },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true }, // This will be a hash
  resetPasswordToken: { type: String, default: undefined },
  resetPasswordExpires: { type: Date, default: undefined },
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