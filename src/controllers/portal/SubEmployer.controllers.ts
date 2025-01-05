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
import ejs from "ejs";
import ForwardedCV from "@/models/portal/Forwarwardedcv.model";
import Meeting from "@/models/portal/CreateMeetingLink.model";

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
       template:"meeting-email",
       data:req.body
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
      let { page = 1, limit = 10,createdBy } = req.query;

      const options = {
        page: parseInt(page as string, 10) || 1,
        limit: parseInt(limit as string, 10) || 8,
      };
  
      // Calculate skip value for pagination
      const skip = (options.page - 1) * options.limit;
  
      // Save to the database
      const newMeeting = await Meeting.find({ createdBy: createdBy }).skip(skip).limit(options.limit)
      const totalItems=await Meeting.countDocuments()
      // Respond with the created meeting details
      return res.status(201).json({
        message: "Meeting scheduled successfully",
        data: newMeeting,
        totalPages:Math.ceil((totalItems)/options.limit)
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
      // Destructure and validate query parameters
      const { SubEmployerId, EmployerId, page = '1', limit = '10' } = req.query as {
        SubEmployerId?: string;
        EmployerId?: string;
        page?: string;
        limit?: string;
      };
  
      const currentPage = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const skip = (currentPage - 1) * pageSize;
  
      // Build the match filter dynamically
      const match: any = {};
      if (SubEmployerId) {
        match['toSubEmployerId'] = new Types.ObjectId(SubEmployerId);
      }
      if (EmployerId) {
        match['fromEmployerId'] = new Types.ObjectId(EmployerId);
      }
  
      // Run Aggregation Pipeline with Pagination
      const [data, total] = await Promise.all([
        ForwardedCV.aggregate([
          { $match: match }, // Filter documents based on conditions
          
          // Lookup SubEmployer Details
          {
            $lookup: {
              from: 'subemployers',
              localField: 'toSubEmployerId',
              foreignField: '_id',
              as: 'subEmployerDetails',
            },
          },
          {
            $unwind: {
              path: '$subEmployerDetails',
              preserveNullAndEmptyArrays: true,
            },
          },
      
          // Lookup Employer Details
          {
            $lookup: {
              from: 'employers',
              localField: 'fromEmployerId',
              foreignField: '_id',
              as: 'employerDetails',
            },
          },
          {
            $unwind: {
              path: '$employerDetails',
              preserveNullAndEmptyArrays: true,
            },
          },
      
          // Add dynamic department field
          {
            $addFields: {
              department: {
                $cond: {
                  if: { $ne: ['$subEmployerDetails', null] }, // If SubEmployer exists
                  then: '$subEmployerDetails.department',
                  else: 'Employer', // Default department
                },
              },
            },
          },
          {
            $addFields: {
              department: { 
                $ifNull: ["$subEmployerDetails.department", "Employer"]
              }
            }
          },
          
      
          // Lookup Candidate Details
          {
            $lookup: {
              from: 'candidates',
              localField: 'candidateId',
              foreignField: '_id',
              as: 'candidateDetails',
            },
          },
          {
            $unwind: {
              path: '$candidateDetails',
              preserveNullAndEmptyArrays: true,
            },
          },
      
          // Group by candidateId
          {
            $group: {
              _id: '$candidateId',
              originalIds: { $first: '$_id' }, // Preserve original _id values
              mergedData: { $first: '$$ROOT' }, // Take the first document and spread it

            },
          },
          {
            $replaceRoot: { newRoot: { $mergeObjects: ['$mergedData', { candidateId: '$_id' ,},{_id:"$originalIds"}] } }
          },
         
      
         
      
          // Apply Pagination
          { $skip: skip },
          { $limit: pageSize },
        ]),
      
        // Total count for pagination metadata
        ForwardedCV.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$candidateId',
            },
          },
          { $count: 'total' },
        ]).then((res) => (res[0] ? res[0].total : 0)),
      ]);
      
  
      // Respond with paginated data
      return res.status(200).json({
        message: 'Data fetched successfully',
        data,
        pagination: {
          currentPage,
          pageSize,
          totalItems: total,
          totalPages: Math.ceil(total / pageSize),
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
        success:true
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
