import mongoose, { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";
import { sendEmail } from "@/services/emails";
import Candidate from "@/models/portal/candidate.model";
import Job from "@/models/portal/job.model";
import { Application } from "@/models/candidate/application.model";
import { AppError } from "@/middlewares/error";
import { generateToken } from "@/middlewares/auth";
import Employer from "@/models/portal/employer.model";
import { postedatesCondition } from "@/utils/postedadate";
import SubEmployer from "@/models/portal/SubEmployer.model";

const applyJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = res.locals.userId as Types.ObjectId;
    console.log("UserId", userId);
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
    if (!checkUser.isresume) {
      throw new AppError("Please fill Resume Details to apply for job!", 400);
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
          candidate: userId,
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
    //  sendEmail({
    //   email: job.employerId.email,
    //   subject: `Application for ${job.title} at ${job.employerId.name}`,
    //   text: `You have a new application for the position of ${job.title}.`
    // });

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
    if (!checkUser.isresume) {
      throw new AppError("Please fill Resume Details to apply for job!", 400);
    }

    // Check if the user has already applied for this job
    const existingApplication = await Application.findById(appId).session(
      session
    );
    if (!existingApplication) {
      throw new AppError("You have already applied for this job!", 400);
    }

    // Update the job's applications array
    await Job.updateOne(
      { _id: existingApplication.job },
      { $unset: { applications: appId } },
      { session }
    );

    // Send email notification
    //  sendEmail({
    //   email: job.employerId.email,
    //   subject: `Application for ${job.title} at ${job.employerId.name}`,
    //   text: `You have a new application for the position of ${job.title}.`
    // });

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
      candidate: userId,
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
            {
              $project: {
                "employerId.logo": 1,
                title: 1,
                company: 1,
                location: 1,
              },
            },
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
interface ApplicationQuery {
  page?:string;
  limit?:string;
  status?:string;
  jobid?:Types.ObjectId;
  createdAt?:any;
  queries?:object

}
const getAllApplicants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.userId as Types.ObjectId;
    let { page="1", limit="10", status,jobid, createdAt, ...queries } = req.query as ApplicationQuery;
    
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
    if(jobid){
      matchQueriesupper["job"]=new Types.ObjectId(jobid)
    }
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
    if (status) {
      matchQueriesupper["status"] = status;
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
    console.log({ matchQueries, matchQueriesupper });
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
      { $match: { job: jobId } },
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

const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { status }: { status: string } = req.body;
    const applicationId: Types.ObjectId = new mongoose.Types.ObjectId(
      req.params.id
    );

    if (!status) {
      res.status(400).json({
        message: "status is required",
        success: false,
      });
      return;
    }

    status = status.toLowerCase();
    const [result] = await Application.aggregate([
      { $match: { _id: applicationId } },
    ]);

    if (!result) {
      res.status(400).json({
        message: "Application not found.",
        success: false,
      });
      return;
    }

    await Application.updateOne(
      { _id: applicationId },
      { $set: { status: status } }
    );

    // if (result?.applicant?.email) {
    //   let text: string = status === 'rejected' ? 'Update on Your Job Decline Application for the Position of' : 'Update on Your Application for the Position of';
    //   sendEmail({
    //     to: result?.applicant?.email,
    //     subject: `${text}  ${result.job.title}`,
    //     template: "jobSeekerEmail",
    //     data: {
    //       link: process.env.clienturl,
    //       name: result.applicant?.personalDetails?.first_name,
    //       jobTitle: result.job.title,
    //       company: result?.company?.name,
    //       status: status,
    //     },
    //   });
    // }

    res.status(200).json({
      message: `Apllicant  ${
        status.charAt(0).toUpperCase() + status.slice(1)
      } successfully.`,
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
    const result = await Application.findById(applicationId).session(session);
    const jobresult = await Job.findById(jobId).session(session);

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

    await Application.findByIdAndDelete(applicationId).session(session);
    await Job.findByIdAndUpdate(jobId, {
      $pull: { applications: applicationId },
    }).session(session);
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
  updateStatus,
  deleteapplication,
  getAllApplicants,
  getEmployerJobNamesOnly,
  getAllShortlistApplicants,
};
