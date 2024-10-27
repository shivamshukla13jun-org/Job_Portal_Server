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

    res.status(201).json({
      success: true,
      data: userData,
      message: "User created, please verify!",
    });
  } catch (error) {
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

    let user = await User.findOne({ email: data.email });
    if (!user) {
      let newUser = await User.create({
        email: data.email,
        oauth: "google",
        user_verified: true,
        userType: userType.find(
          (item) => item.name.toLowerCase() === state.toLowerCase()
        )?._id,
      });

      if (!newUser) {
        return new AppError("Failed to create user", 400);
      }

      // Ensure user_verified is included in the response
      const { password, isBlocked, ...userData } = newUser.toObject();
      const token = generateToken(newUser);

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

    res.status(200).json({
      success: true,
      data: userData,
      token,
      message: "User fetched!",
    });
  } catch (error) {
    console.log(error);
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
            { $skip: pageOptions.page * pageOptions.limit },
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
    const message = `You requested a password reset. Click the link below to reset your password:\n\n${resetURL}\n\nIf you did not request this, please ignore this email.`;
       
    sendEmail({
        email: checkUser.email,
        subject: 'Password Reset Token (Valid for 10 minutes)',
        text:message,
    })
    res.status(200).json({
      status: "success",
      message: "Password Reset Token (Valid for 10 minutes) to email!",
    });
  } catch (error) {
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
     res
       .status(200)
       .json({
         success: true,
         data: userData,
         message: "Login successful",
         token,
       });
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
    const id = req.params.id;
    const checkUser = await User.findById(id)
      .populate("userType")
      .session(session);
    if (!checkUser) {
      throw new AppError("Failed to find user!", 400);
    }

    const user = await User.findByIdAndDelete(req.params.id).session(session);
    if (!user) {
      throw new AppError("Failed to delete user!", 400);
    }

    if ((checkUser.userType as IUserType)?.name === "Candidate") {
      const checkCandidate = await Candidate.findOne({
        userId: checkUser._id,
      }).session(session);
      if (checkCandidate) {
        const deleteCandidateRef = await Candidate.findByIdAndDelete(
          checkCandidate._id
        ).session(session);
        if (!deleteCandidateRef) {
          throw new AppError("Failed to delete user's Candidate profile!", 400);
        }
      }
    }
    if ((checkUser.userType as IUserType)?.name === "Employer") {
      const checkEmployer = await Employer.findOne({
        userId: checkUser._id,
      }).session(session);
      if (checkEmployer) {
        const deleteEmployeeRef = await Employer.findByIdAndDelete(
          checkEmployer._id
        ).session(session);
        if (!deleteEmployeeRef) {
          throw new AppError("Failed to delete user's Employee profile!", 400);
        }
      }
    }
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: {}, message: "User deleted!" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
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
const shortlistedUserJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.userId;
    const checkUser = await User.aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $unwind: {
          path: "$shortListedJobs",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "shortListedJobs.jobId",
          foreignField: "_id",
          as: "shortListedJobs.jobId",
        },
      },
      {
        $unwind: {
          path: "$shortListedJobs.jobId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "employers",
          localField: "shortListedJobs.jobId.employerId",
          foreignField: "_id",
          as: "shortListedJobs.jobId.employerId",
        },
      },
      {
        $unwind: {
          path: "$shortListedJobs.jobId.employerId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          shortListedJobs: { $push: "$shortListedJobs" },
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
      message: "Fetched shortlisted jobs of an user!",
    });
  } catch (error) {
    next(error);
  }
};

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
  shortlistedUserJobs,
};
