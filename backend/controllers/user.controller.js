import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const register = async(req, res) =>{
 

  try{
     const {name, email, password, username} = req.body;

     if(!name || !email || !password || !username) {
      return res.status(400).json({message: "All field are required!"});
     }

     const user = await User.findOne({
      email
     })

     if(user) return res.status(400).json({message: "User already exists!"});

     const hashedPassword = await bcrypt.hash(password, 10);

     const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username
     })

     await newUser.save();
     const profile = new Profile({userId: newUser._id});
     await profile.save();
     return res.json({message: "User created successfully!"});

  }catch (err){
return res.status(500).json({message: err.message});
  }
}

export const login = async(req, res) => {
  try{
    const {email, password} = req.body;

    if(!email || !password) {
      return res.status(400).json({message: "All field are required!"});
     }

     const user = await User.findOne({
      email
     });

     if(!user) return res.status(404).json({message: "User does not exist!"});

     const isMatch = await bcrypt.compare(password, user.password);

     if(!isMatch) return res.status(400).json({message: "Invalid credentials!"});

     const token = crypto.randomBytes(32).toString("hex");

     await User.updateOne({_id: user._id}, {token});
     return res.json({message: "Login successful!", token, userId: user._id});
    
  }catch (err){
    return res.status(500).json({message: err.message});
  }
}

export const uploadProfilePicture = async (req, res) => {
  const { token } = req.body;

  try {
    const user =    await User.findOne({  token});
    if(!user) {
      return res.status(404).json({message: "User not found!"});
    }

    user.profilePicture = req.file.filename;

    user.save();
    return res.json({message: "Profile picture updated successfully!"});
  } catch (err) {
    return res.status(500).json({message: err.message});
  }
}

export const updateUserProfile = async (req, res) => {
  try{

    const {token, ...newUserData} = req.body;

    const user = await User.findOne({token});
    if(!user) {
      return res.status(404).json({message: "User not found!"});
    }

    const {username, email} = newUserData;

    const existingUser = await User.findOne({$or: [{username}, {email}]});
    if(existingUser){
      if(existingUser || existingUser._id.toString() !== user._id.toString()){
        return res.status(400).json({message: "Username or email already exists!"});
      }
    }

    Object.assign(user, newUserData);
    await user.save();

    return res.json({message: "User profile updated successfully!"});

  }catch (err){
    return res.status(500).json({message: err.message});
  }
}

export const getUserAndProfile = async (req, res) => {
  try{
    const {token} = req.body;

    const user = await User.findOne({token});
    if(!user) {
      return res.status(404).json({message: "User not found!"});
    }

    const userProfile = await Profile.findOne({userId: user._id})
    .populate('userId', 'name email username profilePicture');


    if(!userProfile) {
      return res.status(404).json({message: "Profile not found!"});
    }

    return res.json({ userProfile});
  }catch (err){ 
    return res.status(500).json({message: err.message});
  } 

}

export const updateProfileData = async (req, res) => {
  try{
    const {token, ...newProfileData} = req.body;  

    const userProfile = await User.findOne({token: token});
    if(!userProfile) {
      return res.status(404).json({message: "Profile not found!"});
    } 

    const profile = await Profile.findOne({userId: userProfile._id});
    if(!profile) {
      return res.status(404).json({message: "Profile not found!"});
    }

    Object.assign(profile, newProfileData);
    await profile.save();
    return res.json({message: "Profile data updated successfully!"});


  }catch(err){
    return res.status(500).json({message: err.message});
  }
} 

export const getAllUserProfiles = async (req, res) => {
  try{
    const profiles = await Profile.find()
    .populate('userId', 'name email username profilePicture');

    return res.json({ profiles});
  }catch (err){
    return res.status(500).json({message: err.message});
  }
}