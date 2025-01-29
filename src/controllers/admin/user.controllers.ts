import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import mongoose, { Types } from "mongoose";

import { AppError } from "@/middlewares/error";
import { generateToken } from "@/middlewares/auth";
import { sendEmail } from "@/services/emails";
import { generateNumber } from "@/libs/random";

import User, { IUser } from "@/models/admin/user.model";
import { IUserType, UserType } from "@/models/admin/userType.model";
import Candidate from "@/models/portal/candidate.model";
import Employer from "@/models/portal/employer.model";
import { Application } from "@/models/candidate/application.model";
import Job from "@/models/portal/job.model";
import { SavedJobs } from "@/models/candidate/savedjobs";
import { Subscription } from "@/models/portal/subscription.model";
import { JobportalPlan } from "@/models/portal/plan.model";
import { IJobportalPlan } from "@/types/plan";
import { date } from "yup";
import SubEmployer from "@/models/portal/SubEmployer.model";
import path from "path";
import ejs from "ejs"
import ForwardedCV from "@/models/portal/Forwarwardedcv.model";
/**
 @desc    Register a new user 
 @route   POST /api/v1/user/register
 @access  Public
**/
const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payload: IUser = req.body;

    if (!payload.userType) {
      throw new AppError("Usertype does not exist!", 400);
    }

    const type = await UserType.findById(payload.userType);
    if (!type) {
      throw new AppError("Usertype does not exist!", 400);
    }

    // check if user exists or not verified
    const checkUser = await User.findOne({
      email: payload.email.toLowerCase(),
    });
    if (checkUser) {
      if (checkUser.user_verified) {
        throw new AppError("User already exist!", 400);
      } else {
        await checkUser.deleteOne({ _id: checkUser._id });
        type.name.toLowerCase()==="employer" && await  Subscription.deleteOne({userId:checkUser._id},{session:session})

      }
    }

    payload["email"] = payload.email.toLowerCase();
    payload["userType"] = type._id as Types.ObjectId;
    
    const user = await User.create(payload);
    if (!user) {
      throw new AppError("Failed to create the user", 400);
    }

    const otp = generateNumber(4);

    user.user_otp = otp;
    await user.save();

    sendEmail({
      email: payload.email,
      subject: `OTP for verification`,
      text: `Here's your otp : ${otp}`,
    });

    const { password, isBlocked, user_verified, ...userData } = user.toObject();
     
      // create a free packge
      const  plan=await JobportalPlan.findOne({price:0}).session(session)
      type.name.toLowerCase()==="employer" && plan && await  Subscription.create([{userId:user._id,plan_id:plan._id,type:"Free",orderId:"order_free_"+Date.now()}],{session:session})
      await session.commitTransaction()
      await session.endSession();
    res.status(201).json({
      success: true,
      data: userData,
      message: "User created, please verify!",
    });
  } catch (error) {
    await session.abortTransaction();
   await session.endSession();
    next(error);
  }
};

/**
 @desc    Login an existing user
 @route   POST /api/v1/user/login
 @access  Public
**/
const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload: IUser = req.body;
    payload["email"] = payload.email.toLowerCase();

    const checkUser = await User.findOne({ email: payload.email });
    if (!checkUser) {
      throw new AppError("No user found with provided email", 400);
    }

    const otp = generateNumber(4);
    if (!checkUser.user_verified) {
      checkUser.user_otp = otp;
      await checkUser.save();

      sendEmail({
        email: payload.email,
        subject: `OTP for verification`,
        text: `Here's your otp : ${otp}`,
      });

      return res.status(200).json({
        success: true,
        data: {
          user_verified: false,
          email: payload.email,
        },
        message: "User not verified yet!",
      });
    }
    if(!checkUser.isActive){
      throw new AppError("Account is Deactivate by owner!", 400);
    }
    if (checkUser.isBlocked) {
      throw new AppError("User blocked by owner!", 400);
    }

    const isMatch = await checkUser.matchPassword(payload.password as string);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 400);
    }

    const { password, isBlocked, user_verified, ...userData } =
      checkUser.toObject();

    const token = generateToken(checkUser);

    res
      .status(200)
      .json({
        success: true,
        data: userData,
        message: "Login successful",
        token,
      });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Login using google auth
 @route   GET /api/v1/user/google
 @access  Public
**/
const authenticateByGoogle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  try {
    const { state } = req.query as { state: string };
   
    // Set the redirect URI based on the 'state' parameter
    const redirectUri =
      state === "candidate" || "employer"
        ? process.env.GOOGLE_REDIRECT_URI_REGISTER
        : process.env.GOOGLE_REDIRECT_URI_LOGIN;

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      state,
    });

    res.status(201).json({ success: true, data: url });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Callback for google auth
 @route   GET /api/v1/user/google/callback
 @access  Public
**/
const callbackByGoogle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code, state } = req.query as { code: string; state: string };
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Set the redirect URI based on the 'state' parameter
   
    const redirectUri =
      state === "candidate" || "employer"
        ? process.env.GOOGLE_REDIRECT_URI_REGISTER
        : process.env.GOOGLE_REDIRECT_URI_LOGIN;

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const { data }: { data: { email: string } } = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!data) {
      return new AppError("Failed to login", 400);
    }
    const userType = await UserType.find({ forAdmin: false });
    let user = await User.findOne({ email: data.email }).session(session)
    if (!user) {
      let [newUser] = await User.create([{
        email: data.email,
        oauth: "google",
        user_verified: true,
        userType: userType.find(
          (item) => item.name.toLowerCase() === state.toLowerCase()
        )?._id,
      }],{session:session});

      if (!newUser) {
        return new AppError("Failed to create user", 400);
      }
      // create a free packge
       // create a free packge
       const  plan=await JobportalPlan.findOne({price:0}).session(session)
      state.toLowerCase()==="employer" && await  Subscription.create([{userId:newUser._id,plan_id:plan?._id,type:"Free",orderId:"order_free_"+Date.now()}],{session:session})
      // Ensure user_verified is included in the response
      const { password, isBlocked, ...userData } = newUser.toObject();
      const token = generateToken(newUser);
      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({
        success: true,
        data: userData,
        token,
        message: "User created!",
      });
    }

    const token = generateToken(user);

    // Ensure user_verified is included in the response
    const { password, isBlocked, ...userData } = user.toObject();
    userData.user_verified = user.user_verified; // Add user_verified to the response
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      success: true,
      data: userData,
      token,
      message: "User fetched!",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log({error});
    next(error);
  }
};

/**
 @desc      Resend the otp
 @route     POST /api/v1/user/resend
 @access    Pubic
**/
const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;

    const checkUser = await User.findOne({
      email: payload.email.toLowerCase(),
    });
    if (!checkUser) {
      throw new AppError("No user found with provided email", 400);
    }

    const otp = generateNumber(4);
    checkUser.user_otp = otp;
    await checkUser.save();

    sendEmail({
      email: payload.email,
      subject: `OTP for verification`,
      text: `Here's your otp : ${otp}`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent!",
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc      Verify the email via otp
 @route     POST /api/v1/user/verify
 @access    Pubic
**/
const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp }: { email: string; otp: number } = req.body;

    if (!email || !otp) {
      throw new AppError("Please share email & otp!", 400);
    }

    const checkUser = await User.findOne({ email: email.toLowerCase() });
    if (!checkUser) {
      throw new AppError("No user found with provided email", 400);
    }

    if (checkUser.isBlocked) {
      throw new AppError("User blocked by owner!", 400);
    }

    if (checkUser.user_otp !== Number(otp)) {
      throw new AppError("Invalid otp!", 400);
    }

    checkUser.user_verified = true;
    await checkUser.save();

    const { password, isBlocked, user_verified, ...userData } =
      checkUser.toObject();
    const token = generateToken(checkUser);

    res.status(200).json({
      success: true,
      data: userData,
      token,
      message: "User verified!",
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all users
 @route   GET /api/v1/user/
 @access  Admin
**/
const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, ...queries } = req.query;

    const pageOptions = {
      page: parseInt(page as string, 0) || 0,
      limit: parseInt(limit as string, 10) || 10,
    };

    const matchQueries: { [key: string]: RegExp } = {};
    const createRegex = (value: string) =>
      new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");

    for (const [key, value] of Object.entries(queries)) {
      if (typeof value === "string" && value !== "") {
        matchQueries[key] = createRegex(value);
      }
    }

    const users = await User.aggregate([
      {
        $match: {
          ...matchQueries,
        },
      },
      {
        $facet: {
          data: [
            { $skip: (pageOptions.page-1) * pageOptions.limit },
            { $limit: pageOptions.limit },
          ],
          count: [{ $count: "total" }],
        },
      },
    ]);
    if (!users) {
      new AppError("Failed to fetch users!", 400);
    }
    res
      .status(200)
      .json({ success: true, data: users, message: "Users fetched!" });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single user
 @route   GET /api/v1/user/:id
 @access  Public
**/
const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: IUser | null = await User.findById(req.params.id).populate({
      path: "userType",
      select: "_id name",
    });

    if (!user) {
      throw new AppError("Failed to fetch user!", 400);
    }

    let userTypeValue;
    if ((user?.userType as IUserType).name.toLowerCase() === "employer") {
      userTypeValue = await Employer.findOne({ userId: user._id });
    }
    if ((user?.userType as IUserType).name.toLowerCase() === "candidate") {
      userTypeValue = await Candidate.findOne({ userId: user._id });
    }
    if ((user?.userType as IUserType).name.toLowerCase() === "subemployer") {
      userTypeValue = await SubEmployer.findOne({ userId: user._id });
    }

    const { password, isBlocked, user_verified, ...userData } =
      user?.toObject();
    res
      .status(200)
      .json({
        success: true,
        data: { ...userData, userTypeValue },
        message: "User fetched!",
      });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 @desc    Forgot password
 @route   POST /api/v1/user/frogot
 @access  Public
**/
const forgotUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email }: IUser = req.body;

    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      throw new AppError("No user exists with provided email", 400);
    }
    // Create JWT reset token
    const token = generateToken(checkUser, "10m");
    const resetURL = `${process.env.CLIENT_URL}/resetPassword?token=${token}`;
   
    sendEmail({
        email: checkUser.email,
        subject: 'Password Reset Token (Valid for 10 minutes)',
        data:{ resetURL },
        template:'resetPasswordEmail'
    })
    res.status(200).json({
      status: "success",
      success:true,
      message: "Password Reset Token (Valid for 10 minutes) to email!",
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

/**
 @desc    Reset an existing user password
 @route   POST /api/v1/user/reset
 @access  Public
**/
const resetUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const  { newPassword, }:{newPassword:string} = req.body;
    
    const user = await User.findById(new Types.ObjectId(res.locals.userId));
    if(user){
       user.password =newPassword
       await user.save()
       const { password, isBlocked, user_verified, ...userData } =
       user.toObject();
 
     const token = generateToken(user);
     res .status(200) .json({ success: true, data: userData, message: "Login successful", token, });
       await user.save()

    }
      res.status(200).json({
        status: 'success',
        message: 'Password reset successful!',
      });
  

  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update an user
 @route   PUT /api/v1/user/:id
 @access  Public
**/
const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload: IUser = req.body;
    payload["email"] = payload.email.toLowerCase();

    const checkUser = await User.findById(req.params.id);
    if (!checkUser) {
      throw new AppError("Failed to find the user", 400);
    }

    const updateUser = await User.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!updateUser) {
      throw new AppError("Failed to update user!", 400);
    }

    res
      .status(200)
      .json({ success: true, data: updateUser, message: "User updated!" });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete single user
 @route   GET /api/v1/user/:id
 @access  Public
**/
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    // Check if the user exists with populated userType
    const user = await User.findById(id).populate("userType").session(session);
    if (!user) throw new AppError("User not found!", 400);

    // Check if the user is a Candidate
    if ((user.userType as IUserType)?.name === "Candidate") {
      const candidate = await Candidate.findOneAndDelete({ userId: user._id }).session(session);
      await SavedJobs.deleteMany({ userId: user._id }).session(session);
      if (candidate) {
        // Delete candidate applications and remove references in jobs
        const candidateApplications = await Application.find({ candidate: id }).session(session);
        const candidateApplicationIds = candidateApplications.map((app) => app._id);
        
        if (candidateApplicationIds.length > 0) {
          await Job.updateMany(
            { applications: { $in: candidateApplicationIds } },
            { $pull: { applications: { $in: candidateApplicationIds } } }
          ).session(session);
        }
        
        await Application.deleteMany({ candidate: id }).session(session);
      }
    }
    if ((user.userType as IUserType)?.name === "Subemployer") {
      const candidate = await SubEmployer.findOneAndDelete({ userId: user._id }).session(session);
      if (candidate) {
        await ForwardedCV.deleteMany({ toSubEmployerId: candidate._id }).session(session);
      }
    }

    // Check if the user is an Employer
    if ((user.userType as IUserType)?.name === "Employer") {

      const employer = await Employer.findOneAndDelete({ userId: user._id }).session(session);
      
      if (employer) {
        // Delete employer-related applications and jobs
        await Subscription.deleteOne({ userId:id }).session(session);
        await Application.deleteMany({ employer: employer._id }).session(session);
        await Job.deleteMany({ employerId: employer._id }).session(session);
      }
    }

    // Finally, delete the user
    await User.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    await session.endSession()
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession()
    next(error);
  } finally {
    session.endSession();
  }
};


/**
 @desc    Reset password by comparing old password
 @route   PUT /api/v1/user/reset/:id
 @access  Private
 */
const resetAuthenticatedUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const checkUser = await User.findById(req.params.id);
    if (!checkUser) {
      throw new AppError("Failed to find user!", 400);
    }

    const compare = await checkUser.matchPassword(oldPassword);
    if (compare) {
      checkUser.password = newPassword;
      await checkUser.save();
    } else {
      throw new AppError("Old password is incorrect!", 400);
    }

    res
      .status(200)
      .json({ success: true, data: {}, message: "User password updated!" });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get applied jobs
 @route   GET /api/v1/user/job/applied
 @access  Private
 */
const appliedUserJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.userId;
    const checkUser = await Application.aggregate([
      {
        $match: {
          candidate: userId,
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobs.jobId",
          foreignField: "_id",
          as: "jobs.jobId",
        },
      },
      {
        $unwind: {
          path: "$jobs.jobId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "employers",
          localField: "jobs.jobId.employerId",
          foreignField: "_id",
          as: "jobs.jobId.employerId",
        },
      },
      {
        $unwind: {
          path: "$jobs.jobId.employerId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          jobs: { $push: "$jobs" },
          userType: { $first: "$userType" },
          oauth: { $first: "$oauth" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
    ]);
    if (!checkUser) {
      throw new AppError("Failed to find user!", 400);
    }

    res.status(200).json({
      success: true,
      data: checkUser?.[0],
      message: "Fetched applied jobs of an user!",
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get shortlisted jobs
 @route   GET /api/v1/user/job/shortlisted
 @access  Private
 */


export {
  registerUser,
  loginUser,
  authenticateByGoogle,
  callbackByGoogle,
  verifyUser,
  resendOtp,
  getUsers,
  getUser,
  forgotUser,
  resetUser,
  updateUser,
  deleteUser,
  resetAuthenticatedUser,
  appliedUserJobs,
};
