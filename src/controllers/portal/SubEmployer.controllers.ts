import { NextFunction, Request, Response } from "express";
import SubEmployer from "@/models/portal/SubEmployer.model";
import mongoose, { Types } from "mongoose";
import { AppError } from "@/middlewares/error";
import User from "@/models/admin/user.model";
import { UserType } from "@/models/admin/userType.model";
import { generateNumber } from "@/libs/random";
import Employer from "@/models/portal/employer.model";
import { sendEmail } from "@/services/emails";
import { validateMeeting } from "@/validations/subemployer";
import path from "path";
import ForwardedCV from "@/models/portal/Forwarwardedcv.model";
import Meeting from "@/models/portal/CreateMeetingLink.model";
import { Application } from "@/models/candidate/application.model";
import { candidateaddresslokup, FilterApplications } from "@/utils/ApplicationStats";
import { postedatesCondition } from "@/utils/postedadate";

class SubEmployerController {
  async createSubEmployer(req: Request, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { name, email, phone, password, department } = req.body;
      // Step 1: Validate Parent Employer
      const parentEmployer = await Employer.findOne({
        userId: res.locals.userId,
      });
      if (!parentEmployer) {
        throw new AppError("Parent employer not found", 404);
      }

      // Step 2: Check if User Already Exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError("User already exists with this email", 400);
      }

      // Step 3: Get UserType for SubEmployer
      const userType = await UserType.findOne({ name: "Subemployer" });
      if (!userType) {
        throw new AppError("Subemployer user type not found", 400);
      }

      // Step 5: Create User
      const activationOTP = generateNumber(4);
      const newUser = new User({
        name,
        email,
        password: password,
        phone,
        userType: userType._id,
        user_otp: activationOTP,
        createdBy: res.locals.userId,
        parentEmployerId: parentEmployer._id,
      });

      // Step 6: Create SubEmployer
      const newSubEmployer = new SubEmployer({
        parentEmployerId: parentEmployer._id,
        userId: newUser._id,
        name,
        email,
        phone,
        department: department,
        createdBy: res.locals.userId,
      });

      // Step 7: Save in Transaction
      newUser.subEmployerId = newSubEmployer._id as Types.ObjectId;
      await newUser.save({ session });
      await newSubEmployer.save({ session });
      // Step 8: Send Activation Email
      sendEmail({
        email,
        subject: "Account Activation",
        text: `Your  Password for Login is ${password}`,
      });

      await session.commitTransaction();
      res.status(201).json({
        message: "Sub-employer created successfully",
        data: newSubEmployer,
        success: true,
      });
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      await session.endSession();
      next(error);
    } finally {
      await session.endSession();
    }
  }
  async updateSubEmployer(req: Request, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { name, email, phone, password, isActive, dashboardPermissions } =
        req.body;
      const subEmployerId = req.params.id;
      // Step 1: Find Existing SubEmployer
      const existingSubEmployer = await SubEmployer.findById(subEmployerId);
      if (!existingSubEmployer) {
        throw new AppError("Sub-employer not found", 404);
      }

      // Step 2: Verify Parent Employer Authorization
      const parentEmployer = await Employer.findOne({
        userId: res.locals.userId,
      });
      if (
        !parentEmployer ||
        !existingSubEmployer.parentEmployerId === parentEmployer._id
      ) {
        throw new AppError("Unauthorized to update this sub-employer", 403);
      }
      // Step 3: Check if Email is Already in Use by Another User
      if (email && email !== existingSubEmployer.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new AppError("Email already in use", 400);
        }
      }

      // Step 4: Update User Details
      const userUpdateData: any = {};
      if (name) userUpdateData.name = name;
      if (email) userUpdateData.email = email;
      if (phone) userUpdateData.phone = phone;
      if (password) userUpdateData.password = password;

      if (Object.keys(userUpdateData).length > 0) {
        await User.findByIdAndUpdate(
          existingSubEmployer.userId,
          userUpdateData,
          { runValidators: true, session }
        );
      }

      // Step 5: Update SubEmployer Details
      const subEmployerUpdateData: any = {};
      if (name) subEmployerUpdateData.name = name;
      if (email) subEmployerUpdateData.email = email;
      if (phone) subEmployerUpdateData.phone = phone;
      if (dashboardPermissions)
        subEmployerUpdateData.dashboardPermissions = dashboardPermissions;

      const updatedSubEmployer = await SubEmployer.findByIdAndUpdate(
        subEmployerId,
        subEmployerUpdateData,
        { session, runValidators: true, new: true }
      );

      await session.commitTransaction();
      res.status(200).json({
        message: "Sub-employer updated successfully",
        data: updatedSubEmployer,
        success: true,
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  }
  async getSubEmployers(req: Request, res: Response, next: NextFunction) {
    try {
      const parentEmployer = await Employer.findOne({
        userId: res.locals.userId,
      });
      if (!parentEmployer) {
        throw new AppError("Employer not found", 400);
      }
      const subEmployers = await SubEmployer.find({
        parentEmployerId: parentEmployer._id,
      }).populate("userId", "name email isActive");

      res.status(200).json({ sucesess: true, data: subEmployers });
    } catch (error) {
      next(error);
    }
  }
  async getSubEmployersDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const subEmployers = await SubEmployer.findById({
        userId: req.params.id,
      }).populate("userId ", "name email isActive");

      res.status(200).json({ sucesess: true, data: subEmployers });
    } catch (error) {
      next(error);
    }
  }
  async CreateMeetingLink(req: Request, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { email } = req.body;

      // Validate the data
      const isValid = await validateMeeting(req.body);
      if (!isValid) {
        throw new AppError("Invalid meeting data", 400);
      }

      // Generate a meeting link if not provided
      // Save to the database
      const newMeeting = new Meeting({
        ...req.body,
        createdBy: res.locals.userId,
      });

      await newMeeting.save({ session });

      // Render the EJS template
      const templatePath = path.join(
        process.cwd(),
        "views",
        "meeting-email.ejs"
      );

      // Send email
      sendEmail({
        email,
        subject: "Your Meeting Details",
        template: "meeting-email",
        data: req.body,
      });
      await session.commitTransaction();
      await session.endSession();
      // Respond with the created meeting details
      return res.status(201).json({
        message: "Meeting scheduled successfully",
        data: newMeeting,
      });
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      next(error);
    } finally {
      await session.endSession();
    }
  }
  async MeetingLinklists(req: Request, res: Response, next: NextFunction) {
    try {
      let { page = 1, limit = 10, createdBy } = req.query;

      const options = {
        page: parseInt(page as string, 10) || 1,
        limit: parseInt(limit as string, 10) || 8,
      };

      // Calculate skip value for pagination
      const skip = (options.page - 1) * options.limit;

      // Save to the database
      const newMeeting = await Meeting.find({ createdBy: createdBy })
        .skip(skip)
        .limit(options.limit);
      const totalItems = await Meeting.countDocuments();
      // Respond with the created meeting details
      return res.status(201).json({
        message: "Meeting scheduled successfully",
        data: newMeeting,
        totalPages: Math.ceil(totalItems / options.limit),
      });
    } catch (error) {
      next(error);
    }
  }
  async deleteMeetingLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Id is Required", 400);
      }
      // Save to the database
      const newMeeting = await Meeting.deleteOne({ _id: id });

      // Respond with the created meeting details
      return res.status(201).json({
        message: "Meeting deleted successfully",
        data: newMeeting,
      });
    } catch (error) {
      next(error);
    }
  }
  async getForwardedCVs(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        SubEmployerId,
        EmployerId,
        page = 1 as any,
        limit = 10 as any,
        jobid = "",
        createdAt = "",
        status = ""
      } = req.query as {
        SubEmployerId?: Types.ObjectId;
        EmployerId?: Types.ObjectId;
        page?: string;
        limit?: string;
        jobid?: string;
        createdAt?: string;
        status?: string;
      };
  
      const currentPage = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const skip = (currentPage - 1) * pageSize;
  
      const match: Record<string, any> = {
        "toSubEmployers.subEmployerId": { $exists: true },
      };
  
      if (SubEmployerId) {
        match["toSubEmployers"] = {
          $elemMatch: { subEmployerId: new Types.ObjectId(SubEmployerId as Types.ObjectId) },
        };
      }
  
      if (EmployerId) {
        match["employer"] = new Types.ObjectId(EmployerId as Types.ObjectId);
      }
      if (jobid) {
        match["job"] = new Types.ObjectId(jobid);
      }
      if (status) {
        match["status"] = status;
      }
      if (createdAt) {
        let startDate = postedatesCondition(createdAt);
        if (startDate) {
          match["createdAt"] = { $gte: startDate };
        }
      }
  
      const { matchQueries } = FilterApplications(req);
      const result = await Application.aggregate([
        { $match: match },
          {
            $lookup: {
              from: "candidates",
              localField: "candidate",
              pipeline:candidateaddresslokup,
              foreignField: "_id",
              as: "candidate",
            },
          },
          { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "jobs",
              localField: "job",
              foreignField: "_id",
              as: "job",
            },
          },
          { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
          { $match: matchQueries },
          {
            $lookup: {
              from: "subemployers",
              localField: "toSubEmployers.subEmployerId",
              foreignField: "_id",
              as: "subEmployerDetails",
            },
          },
          {
            $unwind: {
              path: "$subEmployerDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "employers",
              localField: "employer",
              foreignField: "_id",
              as: "employerDetails",
            },
          },
          {
            $unwind: {
              path: "$employerDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              selectedBy: {
                $cond: {
                  if: { $eq: ["$shortlistedby", "$subEmployerDetails.userId"] },
                  then: {
                    $concat: [
                      "shortlisted By ",
                      { $arrayElemAt: [{ $split: ["$subEmployerDetails.name", " "] }, 0] },
                      "(",
                      "$subEmployerDetails.department",
                      ")",
                    ],
                  },
                  else: {
                    $cond: {
                      if: { $eq: ["$shortlistedby", "$employerDetails.userId"] },
                      then: {
                        $concat: [
                          "shortlisted By ",
                          { $arrayElemAt: [{ $split: ["$employerDetails.name", " "] }, 0] },
                          "(Employer)",
                        ],
                      },
                      else: {
                        $cond: {
                          if: { $eq: ["$rejectedby", "$subEmployerDetails.userId"] },
                          then: {
                            $concat: [
                              "rejected By ",
                              { $arrayElemAt: [{ $split: ["$subEmployerDetails.name", " "] }, 0] },
                              "(",
                              "$subEmployerDetails.department",
                              ")",
                            ],
                          },
                          else: {
                            $cond: {
                              if: { $eq: ["$rejectedby", "$employerDetails.userId"] },
                              then: {
                                $concat: [
                                  "rejected By ",
                                  { $arrayElemAt: [{ $split: ["$employerDetails.name", " "] }, 0] },
                                  "(Employer)",
                                ],
                              },
                              else: null
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: "$_id",
              employer: { $first: "$employerDetails" },
              candidate: { $first: "$candidate" },
              subEmployers: { $push: "$toSubEmployers" },
              department: { $first: "$department" },
              job: { $first: "$job" },
              selectedBy: { $first: "$selectedBy" },
              meeting: { $first: "$meeting" },
            }
          },
        
        {
          $facet: {
            data:[
              
                { $skip: skip },
                { $limit: pageSize }
              
            ],
            total: [
              { $count: "count" }
            ]
          }
        }
      ]);
  
      const data = result[0].data;
      const totalItems = result[0].total[0]?.count || 0;
  
      return res.status(200).json({
        message: "Data fetched successfully",
        data,
        pagination: {
          currentPage,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteForwardedCVs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ForwardedCV.findByIdAndDelete(req.query.id);

      // Respond with the created meeting details
      return res.status(200).json({
        message: "CV deleted successfully",
        data: data,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
  async deleteSubEmployer(req: Request, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    await session.startTransaction();
    try {
      const subEmployerId = req.params.id;

      // Step 1: Find Existing SubEmployer
      const existingSubEmployer = await SubEmployer.findById(subEmployerId);
      if (!existingSubEmployer) {
        throw new AppError("Sub-employer not found", 404);
      }

      // Step 2: Verify Parent Employer Authorization
      const parentEmployer = await Employer.findOne({
        userId: res.locals.userId,
      });
      if (
        !parentEmployer ||
        !existingSubEmployer.parentEmployerId === parentEmployer._id
      ) {
        throw new AppError("Unauthorized to update this sub-employer", 403);
      }

      // Step 3: Delete Associated User
      await User.findByIdAndDelete(existingSubEmployer.userId, { session });

      // Step 4: Delete SubEmployer
      await SubEmployer.findByIdAndDelete(subEmployerId, { session });
      // Step 4: Delete Forwardedcvs
      await ForwardedCV.deleteOne(
        { toSubEmployerId: subEmployerId },
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
      await session.endSession();
      res.status(200).json({
        message: "Sub-employer deleted successfully",
        success: true,
      });
    } catch (error) {
      // Abort the transaction in case of any error
      await session.abortTransaction();
      await session.endSession();
      next(error);
    } finally {
      // End the session
      await session.endSession();
    }
  }
  async ActivateDeactivate(req: Request, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const subEmployerId = req.params.id;
      let { isActive } = req.body;

      // Step 1: Find Existing SubEmployer
      const existingSubEmployer = await SubEmployer.findById(subEmployerId);
      if (!existingSubEmployer) {
        throw new AppError("Sub-employer not found", 404);
      }

      // Step 2: Verify Parent Employer Authorization
      const parentEmployer = await Employer.findOne({
        userId: res.locals.userId,
      });
      if (
        !parentEmployer ||
        !existingSubEmployer.parentEmployerId === parentEmployer._id
      ) {
        throw new AppError("Unauthorized to update this sub-employer", 403);
      }

      // Step 3: Delete Associated User
      await User.findByIdAndUpdate(
        existingSubEmployer.userId,
        { isActive: isActive },
        { session }
      );
      // Commit the transaction
      await session.commitTransaction();
      await session.endSession();
      res.status(200).json({
        message: `Sub-employer ${
          !isActive ? "deactivated" : "Activted"
        }  successfully`,
        success: true,
      });
    } catch (error) {
      // Abort the transaction in case of any error
      await session.abortTransaction();
      await session.endSession();
      next(error);
    } finally {
      // End the session
      await session.endSession();
    }
  }
}

export default new SubEmployerController();
