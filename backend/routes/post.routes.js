import { Router } from "express";
import { activeCheck, commentPost, deleteComment, getCommentsByPost, incrementLikes } from "../controllers/post.controller.js";
import { createPost } from "../controllers/post.controller.js";
import multer from "multer";
import { getAllPosts } from "../controllers/post.controller.js";
import { deletePost } from "../controllers/post.controller.js";

const storage = multer.diskStorage({  
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null,  file.originalname);
  }
});

const upload = multer({ storage: storage });
const router = Router();

router.route("/").get(activeCheck)
router.route("/post").post(upload.single('media'), createPost);
router.route("/posts").get(getAllPosts);
router.route("/delete_post").post(deletePost);
router.route("/comment").post(commentPost);
router.route("/get_comment").get(getCommentsByPost);
router.route("/delete_comment").delete(deleteComment);
router.route("/increment_likes").post(incrementLikes);


export default router;