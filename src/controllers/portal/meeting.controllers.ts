import { NextFunction, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { AppError } from '@/middlewares/error';
import { sendEmail } from '@/services/emails';
import { validateMeeting } from '@/validations/subemployer';
import { Application } from '@/models/candidate/application.model';
import Employer from '@/models/portal/employer.model';


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
 
     const [applications] = await Application.aggregate([
      // Match applications based on employer ID
      {
        $match: {
          "meeting.createdBy": new Types.ObjectId(createdBy),
          meeting: { $exists: true },
        },
      },
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: 'meeting.createdBy',
          foreignField: '_id',
          as: 'creator',
        },
      },
      // Lookup candidate details
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
    
      // Lookup userType details
      {
        $lookup: {
          from: 'usertypes',
          localField: 'creator.userType',
          foreignField: '_id',
          as: 'userType',
        },
      },
      { $unwind: { path: '$userType', preserveNullAndEmptyArrays: true } },
    
      // Convert userType.name to lowercase
      {
        $addFields: {
          'userType.name': { $toLower: '$userType.name' },
        },
      },
    
      // Lookup employer details if userType is 'employer'
      {
        $lookup: {
          from: 'employers',
          localField: 'meeting.createdBy',
          foreignField: 'userId',
          as: 'employerDetails',
        },
      },
    
      // Lookup subEmployer details if userType is 'subemployer'
      {
        $lookup: {
          from: 'subemployers',
          localField: 'meeting.createdBy',
          foreignField: 'userId',
          as: 'subEmployerDetails',
        },
      },
    
      // Add scheduledBy field dynamically
      {
        $addFields: {
          scheduledBy: {
            $cond: {
              if: { $eq: ['$userType.name', 'employer'] },
              then: { $arrayElemAt: ['$employerDetails.name', 0] },
              else: {
                $cond: {
                  if: { $eq: ['$userType.name', 'subemployer'] },
                  then: { $arrayElemAt: ['$subEmployerDetails.name', 0] },
                  else: 'Unknown',
                },
              },
            },
          },
        },
      },
    
      // Project necessary fields
      {
        $project: {
          meeting: 1,
          'creator.name': 1,
          'creator.email': 1,
          'userType.name': 1,
          scheduledBy: 1,
          createdAt: 1,
          candidate:1
        },
      },
    
      // Sort by creation date
      {
        $sort: { createdAt: -1 },
      },
    
      // Use $facet for pagination and total count
      {
        $facet: {
          applications: [
            { $skip: skip },
            { $limit: pageSize },
          ],
          totalItems: [
            { $count: 'total' },
          ],
        },
      },
    
      // Handle totalItems gracefully
      {
        $project: {
          applications: 1,
          totalItems: { $arrayElemAt: ['$totalItems.total', 0] },
        },
      },
    ]);
    
    // Fallback values if applications or totalItems are undefined
    const data = applications?.applications || [];
    const totalItems = applications?.totalItems || 0;
    
    // Return the response
    return res.status(200).json({
      message: 'Applications fetched successfully',
      data: data,
      pagination: {
        currentPage: pageNumber,
        pageSize,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    });
    
    } catch (error) {
      next(error);
    }
  }

async  EmployerMeetingLinklists(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // Assuming `id` comes from route parameters
      let { page = 1, limit = 10 ,createdBy=""} = req.query;
  
      if (!id) {
        throw new Error('Employer ID is required');
      }
  
      const pageNumber = parseInt(page as string, 10) || 1;
      const pageSize = parseInt(limit as string, 10) || 10;
      const skip = (pageNumber - 1) * pageSize;
  
      // Aggregation Pipeline
      const applications = await Application.aggregate([
        // Match applications based on employer ID
        {
          $match: {
            employer: new Types.ObjectId(id),
            ...(createdBy && { 'meeting.createdBy': new Types.ObjectId(createdBy as string) }),
            meeting: { $exists: true },
          },
        },
        // Lookup user details
        {
          $lookup: {
            from: 'users',
            localField: 'meeting.createdBy',
            foreignField: '_id',
            as: 'creator',
          },
        },
        { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
        // Lookup candidate details
        {
          $lookup: {
            from: 'candidates',
            localField: 'candidate',
            foreignField: '_id',
            as: 'candidate',
          },
        },
        { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
        // Lookup userType details
        {
          $lookup: {
            from: 'usertypes',
            localField: 'creator.userType',
            foreignField: '_id',
            as: 'userType',
          },
        },
        { $unwind: { path: '$userType', preserveNullAndEmptyArrays: true } },
      // Convert userType.name to lowercase
      {
        $addFields: {
          'userType.name': { $toLower: '$userType.name' },
        },
      },
        // Lookup employer details if userType is 'employer'
        {
          $lookup: {
            from: 'employers',
            localField: 'meeting.createdBy',
            foreignField: 'userId',
            as: 'employerDetails',
          },
        },
  
        // Lookup subEmployer details if userType is 'subemployer'
        {
          $lookup: {
            from: 'subemployers',
            localField: 'meeting.createdBy',
            foreignField: 'userId',
            as: 'subEmployerDetails',
          },
        },
  
        // Add scheduledBy field dynamically
        {
          $addFields: {
            scheduledBy: {
              $cond: {
                if: { $eq: ['$userType.name', 'employer'] },
                then: { $arrayElemAt: ['$employerDetails.name', 0] },
                else: {
                  $cond: {
                    if: { $eq: ['$userType.name', 'subemployer'] },
                    then: { $arrayElemAt: ['$subEmployerDetails.name', 0] },
                    else: 'Unknown',
                  },
                },
              },
            },
          },
        },
  
        // Project necessary fields
        {
          $project: {
            'meeting': 1,
            'creator.name': 1,
            'creator.email': 1,
            'userType.name': 1,
            'scheduledBy': 1,
            'createdAt': 1,
            candidate:1
          },
        },
  
        // Sort by creation date
        {
          $sort: { createdAt: -1 },
        },
  
        // Use $facet for pagination and total count
        {
          $facet: {
            applications: [
              { $skip: skip },
              { $limit: pageSize },
            ],
            totalItems: [
              { $count: 'total' },
            ],
          },
        },
      ]);
      
      return res.status(200).json({
        message: 'Applications fetched successfully',
        data: applications?.[0]?.applications || [],
        pagination: {
          currentPage: pageNumber,
          pageSize,
          totalItems: applications?.[0]?.totalItems?.[0]?.total || 0,
          totalPages: Math.ceil((applications?.[0]?.totalItems?.[0]?.total || 0) / pageSize),
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
  
      const application:any = await Application.findById(id).session(session);
      if (!application) {
        throw new AppError('Application not found', 404);
      }
      application.meeting = undefined;
      await application.save({ session });
      
      await session.commitTransaction();
      await session.endSession();
  
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
