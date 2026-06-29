import express from "express";
import { register, login, whatAreMyConnections } from "../controllers/user.controller.js";
import multer from "multer";
import { uploadProfilePicture } from "../controllers/user.controller.js";
import { updateUserProfile } from "../controllers/user.controller.js";
import { getUserAndProfile } from "../controllers/user.controller.js";
import { updateProfileData } from "../controllers/user.controller.js";
import { getAllUserProfiles } from "../controllers/user.controller.js";
import { downloadProfile } from "../controllers/user.controller.js";
import { sendConnectionRequest } from "../controllers/user.controller.js";
import { getMyConnectionRequests } from "../controllers/user.controller.js";
import { acceptConnectionRequest } from "../controllers/user.controller.js";


const router = express.Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.route("/update_profile_picture")
  .post(upload.single('profilePicture'), uploadProfilePicture);



router.route("/register").post(register);
router.route("/login").post(login);
router.route("/user_update").post(updateUserProfile);
router.route("/get_user_and_profile").get(getUserAndProfile);
router.route("/update_profile_data").post(updateProfileData); 
router.route("/user/get_all_users").get(getAllUserProfiles);
router.route("/user/download_resume").get(downloadProfile);
router.route("/user/send_connection_request").post(sendConnectionRequest);
router.route("/user/get_connection_requests").get(getMyConnectionRequests);
router.route("/user/user_connection_requests").get(whatAreMyConnections);
router.route("/user/accept_connection_request").post(acceptConnectionRequest);

export default router;