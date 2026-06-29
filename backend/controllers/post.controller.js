import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import bcrypt from "bcrypt";
import Post from "../models/post.model.js";


export const activeCheck = async (req, res) => {
  return res.status(200).json({ message: "running" })
}

export const createPost = async (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = new Post({
      userId: user._id,
      body: req.body.body || "",
      media: req.file != undefined ? req.file.filename : "",
      fileType: req.file && req.file.mimetype ? req.file.mimetype.split("/")[1] : "",
    })

    await post.save();
    return res.status(201).json({ message: "Post created successfully" });

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", " name username email profilePicture")
    return res.status(200).json({ posts });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}

export const deletePost = async (req, res) => {
  const { token, post_id } = req.body;

  try {
    const user = await User.findOne({ token })
      .select("_id");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findOne({ _id: post_id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    await Post.deleteOne({ _id: post_id });
    return res.status(200).json({ message: "Post deleted successfully" });

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}