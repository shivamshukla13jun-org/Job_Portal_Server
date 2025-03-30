import { StatusPayload } from './../../models/candidate/application.model';
import mongoose, { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";
import { sendEmail } from "@/services/emails";
import Candidate, { ICandidate } from "@/models/portal/candidate.model";
import Job, { IJob } from "@/models/portal/job.model";
import { Application, IApplication } from "@/models/candidate/application.model";
import { AppError } from "@/middlewares/error";
import { generateToken } from "@/middlewares/auth";
import Employer, { IEmployer } from "@/models/portal/employer.model";
import { postedatesCondition } from "@/utils/postedadate";
import SubEmployer, { ISubEmployer } from "@/models/portal/SubEmployer.model";
import { ApplicationJOblookup, ApplicationQuery, Applicationsstats, ApplicationsstatsUnwindPath, candidateaddresslokup, FilterApplications } from "@/utils/ApplicationStats";
import ForwardedCV, { ForwardingStatus } from "@/models/portal/Forwarwardedcv.model";
import ejs from "ejs"
import path from "path";
import User, { IUser } from '@/models/admin/user.model';
const applyJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = res.locals.userId as Types.ObjectId;

    const jobId: Types.ObjectId = new mongoose.Types.ObjectId(req.params.id);

    if (!jobId) {
      res.status(400).json({ message: "Job ID is required.", success: false });
      return;
    }

    // Check candidate and resume
    const checkUser = await Candidate.findOne({ userId: userId })
      .populate("userId")
      .session(session);
    if (!checkUser) {
      throw new AppError(
        "Please Complete Your Profile and Resume Section to apply for job!",
        400
      );
    }
    
    // Fetch the job details and employer
    const job: any = await Job.findById(jobId)
      .populate("employerId")
      .session(session);
    if (!job) {
      throw new AppError("Failed to find job!", 400);
    }

    // Check if the user has already applied for this job
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: checkUser._id,
    }).session(session);
    if (existingApplication) {
      throw new AppError("You have already applied for this job!", 400);
    }

    // Create new application
    const [newApplication]: any = await Application.create(
      [
        {
          job: jobId,
          employer: job.employerId._id,
          candidate: checkUser._id,
        },
      ],
      { session }
    );

    // Update the job's applications array
    await Job.updateOne(
      { _id: jobId },
      { $addToSet: { applications: newApplication._id } },
      { session }
    );
   
    // Send email notification
    sendEmail({
      email: job.employerId.email,
      subject: `Application for ${job.title} at ${job.employerId.name}`,
      template: "jobApplicationNotification",
      data: {
        employerName: job.employerId.name,
        jobTitle: job.title,
        candidateName: checkUser.name,
        candidateEmail: checkUser.email,
      }
    });
    
    
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Job applied successfully!",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    next(error);
  }
};
const WIdrawJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = res.locals.userId as Types.ObjectId;
    const appId: Types.ObjectId = new mongoose.Types.ObjectId(req.params.id);

    // Check candidate and resume
    const checkUser = await Candidate.findOne({ userId: userId })
      .populate("userId")
      .session(session);
    if (!checkUser) {
      throw new AppError(
        "Please Complete Your Profile and Resume Section to apply for job!",
        400
      );
    }
   

    // Check if the user has already applied for this job
    const existingApplication = await Application.findById(appId).session(
      session
    );
    if (!existingApplication) {
      throw new AppError("You have already applied for this job!", 400);
    }

    // Update the job's applications array
   const job:any= await Job.findByIdAndUpdate(existingApplication.job,
      { $unset: { applications: appId } },
      { session }
    );

    // Send email notification
    sendEmail({
      email: job.employerId.email,
      subject: `Application Withdrawal for ${job.title} at ${job.employerId.name}`,
      template: "jobWithdrawalNotification",
      data: {
        employerName: job.employerId.name,
        candidateName: checkUser.name,
        jobTitle: job.title,
      },
    });
    
    await ForwardedCV.deleteOne({
      candidateId: existingApplication.candidate,
      fromEmployerId: existingApplication.employer,
    }).session(session);
    await session.commitTransaction();
    session.endSession();
   
    res.status(200).json({
      success: true,
      message: "Job applied successfully!",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    next(error);
  }
};

const getAppliedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.userId as Types.ObjectId;
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const status: string = (req.query.status as string) || "";
    const skip: number = (page - 1) * limit;
    // Check candidate and resume
    const checkUser = await Candidate.findOne({ userId: userId });
    // .session(session);
    if (!checkUser) {
      throw new AppError("Failed to find user to apply for job!", 400);
    }
    const matchstage: any = {
      candidate: checkUser._id,
    };
    if (status) {
      matchstage["status"] = status;
    }
    const results = await Application.aggregate([
      { $match: matchstage },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "employers",
                localField: "employerId",
                foreignField: "_id",
                as: "employerId",
              },
            },
            {
              $unwind: {
                path: "$employerId",
                preserveNullAndEmptyArrays: true,
              },
            },
            // {
            //   $project: {
            //     "employerId": 1,
            //     title: 1,
            //     company: 1,
            //     location: 1,
            //   },
            // },
          ],
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },

      // {
      //   $project:{
      //     "job.title":1,
      //   }
      // },
      {
        $facet: {
          total: [{ $count: "count" }],
          application: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    const application = results[0]?.application || [];
    const totalApplications: number = results[0]?.total[0]?.count || 0;

    res.status(200).json({
      data: application,
      currentPage: page,
      totalPages: Math.ceil(totalApplications / limit),
      count: totalApplications,
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllApplicants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.userId as Types.ObjectId;
    let { page = "1", limit = "10", status, jobid, qualification, keyword, category, experience_from, experience_to, createdAt, ...queries } = req.query as ApplicationQuery;

    const checkEmployer = await Employer.findOne({ userId: userId });
    if (!checkEmployer) {
      throw new AppError(`Failed to find an employer`, 400);
    }

    const pageOptions = {
      page: parseInt(page, 0) || 1,
      limit: parseInt(limit, 0) || 10,
    };

    const matchQueriesupper: Record<string, any> = {
      employer: checkEmployer._id,
    };
    if (jobid) {
      matchQueriesupper["job"] = new Types.ObjectId(jobid);
    }
    if (status) {
      matchQueriesupper["status"] = status;
    }
    if (createdAt) {
      let startDate = postedatesCondition(createdAt as string);
      if (startDate) {
        matchQueriesupper["createdAt"] = { $gte: startDate };
      }
    }
   const{matchQueries}= FilterApplications(req)
    const [results] = await Application.aggregate([
      { $match: matchQueriesupper },
      {
        $lookup: {
          from: "subemployers",
          localField: "toSubEmployers.subEmployerId",
          foreignField: "_id",
          as: "subEmployerDetails",
        },
      },
      { $unwind: { path: "$subEmployerDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "employers",
          localField: "employer",
          foreignField: "_id",
          as: "employerDetails",
        },
      },
      { $unwind: { path: "$employerDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          selectedBy: {
            $cond: {
              if: { $eq: ["$shortlistedby", "$subEmployerDetails.userId"] },
              then: {
                $concat: [
                  "shortlisted By ",
                  // "$subEmployerDetails.name",
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
                          // "$subEmployerDetails.name",
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
                              "$employerDetails.name",
                              "(Employer)",
                            ],
                          },
                          else: null,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      ...ApplicationJOblookup,
      {
        $lookup: {
          from: "candidates",
          localField: "candidate",
          foreignField: "_id",
          pipeline:[
             ...candidateaddresslokup
          ],
          as: "candidate",
        },
      },
      { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: true } },
      { $match: matchQueries },
      { $project: { employerDetails: 0,  } },
      {
        $group: {
          _id: "$_id", // Unique identifier
          doc: { $first: "$$ROOT" } // Pick the first occurrence
        }
      },
      {
        $replaceRoot: { newRoot: "$doc" }
      },
      {
        $facet: {
          total: [{ $count: "count" }],
          application: [
            { $skip: (pageOptions.page - 1) * pageOptions.limit },
            { $limit: pageOptions.limit },
          ],
          ...Applicationsstats,
        },
      },
      ...ApplicationsstatsUnwindPath,
    ]);

    const application = results?.application || [];
    const totalApplications: number = results?.total[0]?.count || 0;

    res.status(200).json({
      data: application,
      stats: results.stats,
      currentPage: pageOptions.page,
      totalPages: Math.ceil(totalApplications / pageOptions.limit),
      count: totalApplications,
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
const getAllShortlistApplicants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.userId as Types.ObjectId;
    const { page, limit, status, createdAt, ...queries } = req.query;

    const checkEmployer = await SubEmployer.findOne({ userId: userId });
    if (!checkEmployer) {
      throw new AppError(`Failed to find an employer`, 400);
    }

    const pageOptions = {
      page: parseInt(page as string, 0) || 1,
      limit: parseInt(limit as string, 0) || 10,
    };

    const matchQueriesupper: Record<string, any> = {
      employer: checkEmployer.parentEmployerId,
      status: "shortlisted",
    };
    const matchQueries: Record<string, any> = {};
    const createRegex = (value: string) =>
      new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");
    // Handle date filter
    if (createdAt) {
      let startDate = postedatesCondition(createdAt as string);
      if (startDate) {
        matchQueriesupper["createdAt"] = { $gte: startDate };
      }
    }

    for (const [key, value] of Object.entries(queries)) {
      if (
        typeof value === "string" &&
        value !== "" &&
        !["createdAt", "status", "name"].includes(key)
      ) {
        matchQueries[key] = createRegex(value);
      }
      if (typeof value === "string" && value !== "") {
        if (key === "name") {
          matchQueries["candidate.name"] = createRegex(value);
        }
      }
    }
    const results = await Application.aggregate([
      {
        $match: matchQueriesupper,
      },
      {
        $lookup: {
          from: "jobs",
          let: { jobId: "$job" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$jobId"],
                },
              },
            },
          ],
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "candidates",
          let: { candidateId: "$candidate" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$userId", "$$candidateId"],
                },
              },
            },
            ...candidateaddresslokup
          ],
          as: "candidate",
        },
      },
      { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "resumes",
          let: { candidateId: "$candidate._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$candidateId", "$$candidateId"],
                },
              },
            },
          ],
          as: "resume",
        },
      },
      { $unwind: { path: "$resume", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          ...matchQueries,
        },
      },
      {
        $facet: {
          total: [{ $count: "count" }],
          application: [
            { $skip: (pageOptions.page - 1) * pageOptions.limit },
            { $limit: pageOptions.limit },
          ],
        },
      },
    ]);
    const application = results[0]?.application || [];
    const totalApplications: number = results[0]?.total[0]?.count || 0;

    res.status(200).json({
      data: application,
      currentPage: pageOptions.page,
      totalPages: Math.ceil(totalApplications / pageOptions.limit),
      count: totalApplications,
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getApplicants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.userId as Types.ObjectId;
    // const jobId = res.query.jobId as Types.ObjectId
    let {
      page = 1,
      status = "",
      limit = 10,
      fromdate = "" as any,
      todate = "" as any,
      islatest = "" as any,
    } = req.query;
    let jobId = req.params.id as any;
    // Manually cast jobId to ObjectId if it's a valid ID
    jobId = jobId ? new Types.ObjectId(jobId) : jobId;
    islatest = islatest ? -1 : 1;
    const options = {
      page: parseInt(page as string, 10) || 1,
      limit: parseInt(limit as string, 10) || 8,
    };

    const applicationMatchStage: any = {
      // "employer": userId,
      job: jobId,
    };
    if (status) {
      applicationMatchStage["status"] = status;
    }
    if (fromdate && todate) {
      let date: Date = new Date(todate);
      let gatedate: number = date.getDate();
      todate = date.setDate(gatedate + 1);
      applicationMatchStage["createdAt"] = {
        $gte: new Date(fromdate),
        $lte: new Date(todate),
      };
    }
    const results = await Application.aggregate([
      // {
      //   $lookup: {
      //     from: "jobs",
      //     let: { jobId: "$job" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $eq: ["$_id", "$$jobId"],
      //           },
      //         },
      //       },
      //       { $sort: { createdAt: islatest } },
      //     ],
      //     as: "job",
      //   },
      // },
      // { $unwind:{path: "$job",preserveNullAndEmptyArrays:true} },
      {
        $lookup: {
          from: "candidates",
          let: { candidateId: "$candidate" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$userId", "$$candidateId"],
                },
              },
            },
            ...candidateaddresslokup
          ],
          as: "candidate",
        },
      },
      { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "resumes",
          let: { candidateId: "$candidate._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$candidateId", "$$candidateId"],
                },
              },
            },
          ],
          as: "resume",
        },
      },
      { $unwind: { path: "$resume", preserveNullAndEmptyArrays: true } },
      { $match: applicationMatchStage },
      {
        $facet: {
          total: [{ $count: "count" }],
          application: [
            { $skip: (options.page - 1) * options.limit },
            { $limit: options.limit },
          ],
        },
      },
    ]);
    const stats = await Application.aggregate([
      { $match: applicationMatchStage },
      {
        $facet: {
          totals: [
            {
              $match: { status: "pending" },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
              },
            },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          approved: [
            {
              $match: { status: "shortlisted" },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
              },
            },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          rejected: [
            {
              $match: { status: "rejected" },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
              },
            },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
        },
      },
      { $unwind: { path: "$totals", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$approved", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$rejected", preserveNullAndEmptyArrays: true } },
    ]);
    const application = results[0]?.application || [];
    const totalApplications: number = results[0]?.total[0]?.count || 0;
    
    res.status(200).json({
      data: application,
      stats: stats[0],
      currentPage: options.page,
      totalPages: Math.ceil(totalApplications / options.limit),
      count: totalApplications,
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
const singleApplicant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const applicantId = req.params.applicantId as any;
 
    // Manually cast jobId to ObjectId if it's a valid ID
  
    const applicationMatchStage: any = {
       _id:new Types.ObjectId(applicantId)
    };
 
  
    const [results] = await Application.aggregate([
      // {
      //   $lookup: {
      //     from: "jobs",
      //     let: { jobId: "$job" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $eq: ["$_id", "$$jobId"],
      //           },
      //         },
      //       },
      //       { $sort: { createdAt: islatest } },
      //     ],
      //     as: "job",
      //   },
      // },
      // { $unwind:{path: "$job",preserveNullAndEmptyArrays:true} },
      {
        $match:applicationMatchStage
      },
      {
        $lookup: {
          from: "candidates",
          let: { candidateId: "$candidate" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$userId", "$$candidateId"],
                },
              },
            },
            ...candidateaddresslokup
          ],
          as: "candidate",
        },
      },
      { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: true } },
     
    ]).limit(1)
    
   
    res.status(200).json({
      data: results,
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let payload:StatusPayload = req.body;
    const userId = res.locals.userId as Types.ObjectId;
    const applicationId: Types.ObjectId = new mongoose.Types.ObjectId(req.params.id);

    if (!payload.status) {
      res.status(400).json({
        message: "Status is required.",
        success: false,
      });
      return;
    }
   


    // Fetch the application
    const application = await Application.findById(applicationId).populate("candidate job employer") as IApplication | null;
    if (!application) {
      res.status(400).json({
        message: "Application not found.",
        success: false,
      });
      return;
    }
    application.status=payload.status;
    if (payload.status === "shortlisted") {
      application.shortlistedby = userId; // Set the shortlistedby field
      application.rejectedby = undefined; // Mark rejectedby for removal
    } else if (payload.status === "rejected") {
      application.rejectedby = userId; // Set the rejectedby field
      application.shortlistedby = undefined; // Mark shortlistedby for removal
    }
    
    // Use unset to remove fields marked as undefined
    const updateFields = { status: payload.status } as IApplication 
    if (payload.status === "shortlisted") {
      updateFields.shortlistedby = userId;
    } else if (payload.status === "rejected") {
      updateFields.rejectedby = userId;
    }

    const unsetFields = {} as any;
    if (payload.status === "shortlisted") {
      unsetFields.rejectedby = "";
    } else if (payload.status === "rejected") {
      unsetFields.shortlistedby = "";
    }

    const data = await Application.findByIdAndUpdate(
      applicationId,
      { $set: updateFields, $unset: unsetFields },
      { new: true }
    ).populate("candidate job shortlistedby rejectedby employer")

       // Get action performer details
       let hrName = '';
       let hrRole = '';
       const performer = await User.findById(userId) 
         .populate({
           path: 'subEmployerId',
           select: 'name department'
         })
         .populate({
           path: 'employerId',
           select: 'business_name'
         }) as IUser
   
       if (performer?.subEmployerId) {
        let subemployerpermer=performer.subEmployerId as unknown  as ISubEmployer
         hrName =subemployerpermer.name.split(' ')[0]; // First name
         hrRole =subemployerpermer.department;
       } else if (performer?.employerId) {
        let employerpermer=performer.employerId as unknown  as IEmployer

         hrName = employerpermer.business_name
         hrRole = 'Employer';
       }
       let subject="Application Update"
       if (payload.status === "shortlisted") {
        subject="Your Profile Has Been Shortlisted"
      } else if (payload.status === "rejected") {
        subject="Your Profile Has Been Rejected"
      }
      console.log({ websiteLink: `${process.env.CLIENT_URL}/job/${(application.job as unknown  as IJob)?._id}`,
    })
       sendEmail({
         email: (application.candidate as any)?.email,
         subject:subject,
         template: "applicationStatusUpdate",
         data: {
           candidateName: (application.candidate as unknown  as ICandidate)?.name,
           jobTitle: (application.job as unknown  as IJob)?.title,
          websiteLink: `${process.env.CLIENT_URL}/job/${(application.job as unknown  as IJob)?._id}`,
           employerName: (application.employer as unknown  as IEmployer)?.business_name,
           applicationStatus: payload.status,
           hrName,
           hrRole
         }
       });
    res.status(200).json({
      message: `Applicant  ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)} successfully.`,
      success: true,
      data
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const interviewconfirmation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const applicationId: Types.ObjectId = new mongoose.Types.ObjectId(
      req.params.id
    );
    const result:any= await Application.findByIdAndUpdate(applicationId,{
      $set:{"meeting.intrviewConfirmation":req.body.intrviewConfirmation}
    }).populate("employer job")
   
    if (!result) {
      res.status(400).json({
        message: "Application not found.",
        success: false,
      });
      return;
    }
    if (result?.employer?.email) {
      sendEmail({
        email: result?.employer?.email,
        subject: "Interview Confirmation",
        template: "interviewConfirmation",
        data: {
          employerName: result?.employer?.name,
          jobTitle: result?.job?.title,
          interviewDate: result?.meeting?.date,
          interviewTime: result?.meeting?.time,
          interviewLocation: result?.meeting?.location,
        }
      });
      
    }

    res.status(200).json({
      message: `Information Send To Employer.`,
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
const deleteapplication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const applicationId: Types.ObjectId = new mongoose.Types.ObjectId(
      req.params.applicationId
    );
    const jobId: Types.ObjectId = new mongoose.Types.ObjectId(req.params.jobId);
  
   

   const result:any= await Application.findByIdAndDelete(applicationId).populate("candidate employer").session(session);
   const jobresult:any= await Job.findByIdAndUpdate(jobId, {
      $pull: { applications: applicationId },
    }).session(session);
    if (!result) {
      res.status(400).json({
        message: "Application not found.",
        success: false,
      });
      return;
    }
    if (!jobresult) {
      res.status(400).json({
        message: "Job  not found.",
        success: false,
      });
      return;
    }
    console.log({result})
    console.log({jobresult})
      // Send email notification
      sendEmail({
        email: result.employer.email,
        subject: `Application Withdrawal for ${jobresult.title} at ${result.employer.name}`,
        template: "jobWithdrawalNotification",
        data: {
          employerName: result.employer.name,
          candidateName:result.candidate.name,
          jobTitle: jobresult.title,
        },
      });
       sendEmail({
        email: result.candidate.email,
        subject: `Application Withdrawal for ${jobresult.title} at ${result.employer.name}`,
        template: "jobWithdrawalNotification",
        data: {
          employerName: jobresult.employerId.name,
          candidateName:result.candidate.name,
          jobTitle: jobresult.title,
        },
      });
    await session.commitTransaction();
    session.endSession();
   
    res.status(200).json({
      message: `Apllicant  deleted successfully.`,
      success: true,
    });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
const getEmployerJobNamesOnly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = new Types.ObjectId(res.locals.userId);
    const checkEmployer = await Employer.findOne({ userId });
    if (!checkEmployer) {
      throw new AppError("Failed to find employer", 400);
    }

    const jobs = await Application.aggregate([
      {
        $match: {
          employer: checkEmployer._id,
        },
      },
      {
        $group: {
          _id: "$job",
        },
      },
      {
        $lookup: {
          from: "jobs",
          let: { jobId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$jobId"],
                },
              },
            },
            {
              $project: {
                title: 1,
              },
            },
          ],
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          job: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Candidate fetched!",
      data: jobs,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
export {
  applyJob,
  getAppliedJobs,
  WIdrawJob,
  getApplicants,
  updateStatus,singleApplicant,
  deleteapplication,
  getAllApplicants,
  getEmployerJobNamesOnly,
  getAllShortlistApplicants,interviewconfirmation
};
