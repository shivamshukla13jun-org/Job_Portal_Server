import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@/middlewares/error';
import { sendEmail } from '@/services/emails';
import { validateMeeting } from '@/validations/subemployer';
import { Application } from '@/models/candidate/application.model';


class MeetingController {
  async CreateMeetingLink(req: Request, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { applicationId, date, time, timeDuration, email, phone, message, meetingLink } = req.body;

      if (!applicationId) {
        throw new AppError('Application ID is required', 400);
      }

      // Validate meeting details
      const isValid = await validateMeeting(req.body);
      if (!isValid) {
        throw new AppError('Invalid meeting data', 400);
      }

      // Update Application with Meeting details
      const application = await Application.findById(applicationId).session(session);
      if (!application) {
        throw new AppError('Application not found', 404);
      }

      application.meeting = {
        date,
        time,
        timeDuration,
        email,
        phone,
        
        message,
        meetingLink,
        createdBy: res.locals.userId,
        intrviewConfirmation: { message: '', confirm: false },
      };

      await application.save({ session });

      // Send email
      await sendEmail({
        email,
        subject: 'Your Meeting Details',
        template: 'meeting-email',
        data: req.body,
      });

      await session.commitTransaction();
      await session.endSession();

      return res.status(201).json({
        message: 'Meeting link added to application successfully',
        data: application,
      });
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      next(error);
    }
  }

  async MeetingLinklists(req: Request, res: Response, next: NextFunction) {
    try {
     const createdBy=res.locals.userId
     let { page = 1, limit = 10 } = req.query;
 
     if (!createdBy) {
       throw new AppError('createdBy parameter is required', 400);
     }
 
     const pageNumber = parseInt(page as string, 10) || 1;
     const pageSize = parseInt(limit as string, 10) || 10;
     const skip = (pageNumber - 1) * pageSize;
 
     // Query the database for applications where meeting details are present
     const [applications, totalItems] = await Promise.all([
       Application.find({ 'meeting.createdBy': createdBy })
         .populate('meeting.createdBy', 'name email') // Populate the 'createdBy' field of the meeting (optional)
         .skip(skip)
         .limit(pageSize)
         .sort({ createdAt: -1 }), // Sort by application creation date (latest first)
 
       Application.countDocuments({ 'meeting.createdBy': createdBy })
     ]);
 
     return res.status(200).json({
       message: 'Applications fetched successfully',
       data: applications,
       pagination: {
         currentPage: pageNumber,
         pageSize,
         totalItems,
         totalPages: Math.ceil(totalItems / pageSize),
       },
     });
    } catch (error) {
      next(error);
    }
  }

  async deleteMeetingLink(req: Request, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { id } = req.params;
  
      if (!id) {
        throw new AppError('Application ID is required', 400);
      }
  
      const application = await Application.findById(id).session(session);
      if (!application) {
        throw new AppError('Application not found', 404);
      }
  
      // Use $unset to remove the 'meeting' field explicitly
      await Application.updateOne(
        { _id: id },
        { $unset: { meeting: "" } }, // Removes the meeting field
        { session }
      );
  
      await session.commitTransaction();
  
      return res.status(200).json({
        message: 'Meeting link removed successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  }
  
}

export default new MeetingController();
