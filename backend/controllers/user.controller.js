import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pdfDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import ConnectionRequest from '../models/connection.model.js';


const convertuserDataToPdf = async (userData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new pdfDocument();
      const outputPath = crypto.randomBytes(16).toString("hex") + ".pdf";
      const stream = fs.createWriteStream("uploads/" + outputPath);

      doc.pipe(stream);

      const picName = userData.userId?.profilePicture || "default.png";
      const imagePath = path.join("uploads", picName);

      if (fs.existsSync(imagePath)) {
        doc.image(imagePath, { align: 'center', width: 100, height: 100 });
      } else {
        doc.fontSize(12).text("[No Profile Picture Available]", { align: 'center' });
        doc.moveDown();
      }

      doc.fontSize(20).text(userData.userId?.name || "N/A", { align: 'center' });
      doc.fontSize(14).text(userData.userId?.username || "N/A", { align: 'center' });
      doc.fontSize(14).text(userData.userId?.email || "N/A", { align: 'center' });
      doc.moveDown();

      doc.fontSize(16).text("Bio:", { underline: true });
      doc.fontSize(14).text(userData.bio || "N/A");
      doc.moveDown();

      doc.fontSize(16).text("Current Post:", { underline: true });
      doc.fontSize(14).text(userData.currentPost || "N/A");
      doc.moveDown();

      doc.fontSize(16).text("Past Work:", { underline: true });

      const works = userData.pastWork || userData.pastwork || [];
      works.forEach((work) => {
        doc.fontSize(14).text(`Company Name: ${work.company || "N/A"}`);
        doc.fontSize(14).text(`Position: ${work.position || "N/A"}`);
        doc.fontSize(14).text(`Years: ${work.years || "N/A"}`);
        doc.moveDown(0.5);
      });

      doc.moveDown();
      doc.fontSize(16).text("Education:", { underline: true });
      const education = userData.education || userData.education || [];
      education.forEach((edu) => {
        doc.fontSize(14).text(`Institution: ${edu.school || "N/A"}`);
        doc.fontSize(14).text(`Degree: ${edu.degree || "N/A"}`);
        doc.fontSize(14).text(`Years: ${edu.fieldOfStudy || "N/A"}`);
        doc.moveDown(0.5);
      });

      doc.end();

      stream.on("finish", () => {
        resolve(outputPath);
      });

      stream.on("error", (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};




export const register = async (req, res) => {


  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password || !username) {
      return res.status(400).json({ message: "All field are required!" });
    }

    const user = await User.findOne({
      email
    })

    if (user) return res.status(400).json({ message: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username
    })

    await newUser.save();
    const profile = new Profile({ userId: newUser._id });
    await profile.save();
    return res.json({ message: "User created successfully!" });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All field are required!" });
    }

    const user = await User.findOne({
      email
    });

    if (!user) return res.status(404).json({ message: "User does not exist!" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid credentials!" });

    const token = crypto.randomBytes(32).toString("hex");

    await User.updateOne({ _id: user._id }, { token });
    return res.json({ message: "Login successful!", token, userId: user._id });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const uploadProfilePicture = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    user.profilePicture = req.file.filename;

    user.save();
    return res.json({ message: "Profile picture updated successfully!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const updateUserProfile = async (req, res) => {
  try {

    const { token, ...newUserData } = req.body;

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const { username, email } = newUserData;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser || existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Username or email already exists!" });
      }
    }

    Object.assign(user, newUserData);
    await user.save();

    return res.json({ message: "User profile updated successfully!" });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const userProfile = await Profile.findOne({ userId: user._id })
      .populate('userId', 'name email username profilePicture');


    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found!" });
    }

    return res.json({ userProfile });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

}

export const updateProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;

    const userProfile = await User.findOne({ token: token });
    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found!" });
    }

    const profile = await Profile.findOne({ userId: userProfile._id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found!" });
    }

    Object.assign(profile, newProfileData);
    await profile.save();
    return res.json({ message: "Profile data updated successfully!" });


  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const getAllUserProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate('userId', 'name email username profilePicture');

    return res.json({ profiles });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const downloadProfile = async (req, res) => {
  try {
    const user_id = req.query.id;

    const profile = await Profile.findOne({ userId: user_id })
      .populate('userId', 'name email username profilePicture');

    if (!profile) {
      return res.status(404).json({ message: "Profile not found!" });
    }

    const imagePath = path.join("uploads", profile.userId.profilePicture || "default.png");

    if (!fs.existsSync(imagePath)) {
      profile.userId.profilePicture = "default.png";
    }

    let outputPath = await convertuserDataToPdf(profile);

    return res.json({ message: outputPath });


  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}


export const sendConnectionRequest = async (req, res) => {

  const { token, connectionId } = req.body;
  try {

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const connectionUser = await User.findById(connectionId);
    if (!connectionUser) {
      return res.status(404).json({ message: "Connection user not found!" });
    }

    const existingRequest = await ConnectionRequest.findOne({
      userId: user._id,
      connectionId: connectionUser._id
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Connection request already sent!" });
    }

    const request = new ConnectionRequest({
      userId: user._id,
      connectionId: connectionUser._id
    });

    await request.save();
    return res.json({ message: "Connection request sent successfully!" });


  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const getMyConnectionRequests = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const connections = await ConnectionRequest.find({ userId: user._id })
      .populate('connectionId', 'name email username profilePicture');

    return res.json( connections );




  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const whatAreMyConnections = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const connections = await ConnectionRequest.find({ connectionId: user._id })
      .populate('userId', 'name email username profilePicture');

    return res.json( connections );


  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const acceptConnectionRequest = async (req, res) => {
  const { token, requestId , action_type} = req.body;
  
  try{

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    } 

    const connectionRequest = await ConnectionRequest.findById(requestId);
    if (!connectionRequest) {
      return res.status(404).json({ message: "Connection not found!" });
    }

    if(action_type === "accept"){
      connectionRequest.status_accepted = true;
      await connectionRequest.save();
      return res.json({ message: "Connection request accepted!" });
    }else{
      connectionRequest.status_accepted = false;
      await connectionRequest.save();
      return res.json({ message: "Connection request rejected!" });
    }

    await connectionRequest.save();
    return res.json({ message: "Connection request updated successfully!" });

  }catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
