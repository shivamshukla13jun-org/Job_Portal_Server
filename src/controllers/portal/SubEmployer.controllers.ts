import { NextFunction, Request, Response } from 'express';
import SubEmployer from '@/models/portal/SubEmployer.model';
import mongoose, { Types } from 'mongoose';
import { AppError } from '@/middlewares/error';
import User from '@/models/admin/user.model';
import { UserType } from '@/models/admin/userType.model';
import { generateNumber } from '@/libs/random';
import Employer from '@/models/portal/employer.model';
import { sendEmail } from '@/services/emails';
import { validateMeeting } from '@/validations/subemployer';
import path from 'path';
import ejs from "ejs"

class SubEmployerController {
    async  createSubEmployer(req: Request, res: Response, next: NextFunction) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            const { 
                name, 
                email, 
                phone, 
                dashboardPermissions 
            } = req.body;
            const password= generateNumber(4)
            // Step 1: Validate Parent Employer
            const parentEmployer = await Employer.findOne({ userId: res.locals.userId });
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
                password:password,
                phone,
                userType: userType._id,
                user_otp: activationOTP,
                parentEmployerId: parentEmployer._id,
            });
    
            // Step 6: Create SubEmployer
            const newSubEmployer = new SubEmployer({
                parentEmployerId: parentEmployer._id,
                userId: newUser._id,
                name,
                email,
                phone,
                dashboardPermissions,
                createdBy: res.locals.userId,
            });
    
            // Step 7: Save in Transaction
            newUser.subEmployerId=newSubEmployer._id as Types.ObjectId
            await newUser.save({ session });
            await newSubEmployer.save({ session });
           console.log({password})
            // Step 8: Send Activation Email
            await sendEmail({
                email,
                subject: "Account Activation",
                text: `Your OTP is: ${activationOTP}   and your Password for Loginis ${password}`,
            });
    
            await session.commitTransaction();
            res.status(201).json({
                message: "Sub-employer created successfully",
                data: newSubEmployer,
                success: true,
            });
        } catch (error) {
            console.log(error)
            await session.abortTransaction();
           await session.endSession();
            next(error);
        } finally {
           await session.endSession();
        }
    }
    async getSubEmployers(req: Request, res: Response, next: NextFunction) {
        try {
            const parentEmployer = await Employer.findOne({ userId: res.locals.userId });
            if(!parentEmployer){
                
                throw new AppError("Employer not found", 400);
            }
            const subEmployers = await SubEmployer.find({ 
                parentEmployerId: parentEmployer._id 
            }).populate('userId', 'name email isActive');

            res.status(200).json({sucesess:true,data:subEmployers});
        } catch (error) {
            next(error);
        }
    }
    async getSubEmployersDetails(req: Request, res: Response, next: NextFunction) {
        try {
          
            const subEmployers = await SubEmployer.findById({ 
                userId: req.params.id 
            }).populate('userId dashboardPermissions', 'name email isActive');

            res.status(200).json({sucesess:true,data:subEmployers});
        } catch (error) {
            next(error);
        }
    }

    async updateSubEmployerPermissions(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { dashboardPermissions } = req.body;

            const subEmployer = await SubEmployer.findByIdAndUpdate(
                id, 
                req.body, 
                { new: true }
            );

            res.status(200).json({sucesess:true,data:subEmployer});
        } catch (error) {
            next(error);
        }
    }
    async CreateMeetingLink(req: Request, res: Response, next: NextFunction) {
        try {
            const { date, time, timeDuration, email, phone, message, meetingLink } = req.body;
    
            // Validate the data
            const check = await validateMeeting(req.body);
            if (!check) {
                return;
            }
    
            // Generate a meeting link if not provided
            const generatedLink = meetingLink;
    
            // Save to the database (mocked with an in-memory object)
            const newMeeting = {
                date,
                time,
                timeDuration,
                email,
                phone,
                message,
                meetingLink: generatedLink,
            };
    
            console.log('Meeting Created:', newMeeting);
    
            // Render the EJS template
            const templatePath = path.join(process.cwd(), 'views','meeting-email.ejs');
            const emailContent = await ejs.renderFile(templatePath, {
                date,
                time,
                timeDuration,
                message,
                meetingLink: generatedLink,
            });
    
            // Send email
            await sendEmail({
                email,
                subject: 'Your Meeting Details',
                html: emailContent,
            });
    
            // Respond with the created meeting details
            return res.status(201).json({
                message: 'Meeting scheduled successfully',
                data: newMeeting,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new SubEmployerController();