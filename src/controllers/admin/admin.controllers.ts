import { createRegex } from "@/libs";
import { generateToken } from "@/middlewares/auth";
import { AppError } from "@/middlewares/error";
import Admin from "@/models/admin/admin.model";
import User from "@/models/admin/user.model";
import { Application } from "@/models/candidate/application.model";
import Candidate from "@/models/portal/candidate.model";
import Employer from "@/models/portal/employer.model";
import Job from "@/models/portal/job.model";
import { JobportalPlan } from "@/models/portal/plan.model";
import SubEmployer from "@/models/portal/SubEmployer.model";
import {
  getDashboardstats,
  getNumericPercentageStats,
  getStringPercentageStats,
} from "@/utils/DashboardStats";
import { OptionsQuery } from "@/utils/Options";
import { postedatesCondition } from "@/utils/postedadate";
import { NextFunction, Request, Response } from "express";
import mongoose, { Types, PipelineStage } from "mongoose";

interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: string;
  sortBy?: string;
  sort?: "asc" | "desc";
  fromdate?: Date;
  todate?: Date;
  categories?: string;
  jobtype?: string;
  status?: string;
}
interface PaginatedResult {
  data: {
    label: string;
    value: string;
  }[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  success: boolean;
}
export const Options = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = {};
    const { type } = req.params;
    const queryFunction = OptionsQuery[type as keyof typeof OptionsQuery];
    console.log(queryFunction)
    if (typeof queryFunction === "function") {
      result = await queryFunction();
    } else {
      throw new AppError("Invalid type", 400);
    }
    res.status(200).json({data:result});
  } catch (error) {
    console.error("Error in listUsers:", error);
    next(error);
  }
};
export const getAllLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;

    const result = await Job.aggregate([
      { $group: { _id: "$location" } },

      {
        $project: {
          label: "$_id",
          value: "$_id",
        },
      },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const locations = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const response: PaginatedResult = {
      data: locations,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user: any = await User.findOne({ email }).populate("userType");

    if (user) {
      if (!user?.userType?.forAdmin) {
        throw new AppError("Loagin as A admin Email", 400);
      }
      const isMatch = await user.matchPassword(password as string);
      if (!isMatch) {
        throw new AppError("Invalid credentials", 400);
      }
      const token = generateToken(user);
      res.json({
        _id: user._id,
        name: user.name || "Admin",
        email: user.email,
        token,
      });
    } else {
      throw new AppError("Invalid Credentials", 401);
    }
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sort = "desc",
      categories='',
      fromdate,
      todate,
    } = req.query as ListQueryParams;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const matchQueries: Record<string, any> = {};
    const searchMatch: Record<string, any> = {};

    if (search) {
      searchMatch["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (fromdate || todate) {
      matchQueries["createdAt"] = {};
    }
    if (fromdate) {
      matchQueries["createdAt"]["$gte"] = new Date(fromdate);
    }
    if (todate) {
      matchQueries["createdAt"]["$lte"] = new Date(todate);
    }

    if (categories) {
      matchQueries["employment"] = {
        $elemMatch: {
          categories: {
            $elemMatch: {
              value: { $in: categories.split(",") }
            }
          }
        }
      };
    }
    const sortStage = {
      [sortBy]: sort === "asc" ? 1 : -1,
    }

    const aggregationPipeline: any[] = [
      { $match: matchQueries },
      { $match: searchMatch },
      {
        $lookup: {
          from: "applications",
          localField: "userId",
          foreignField: "candidate",
          as: "applicationsSubmitted",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          totalApplicationsSubmitted: { $size: "$applicationsSubmitted" },
        },
      },
      // {
      //   $project:{
      //     "user.email":1,"user.isActive":1
      //   }
      // }
    ];

    const [results, totalCount] = await Promise.all([
      Candidate.aggregate([
        ...aggregationPipeline,
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limitNumber },
      ]),
      Candidate.aggregate([...aggregationPipeline, { $count: "total" }]),
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      users: results,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers: total,
        pageSize: limitNumber,
      },
    });
  } catch (error) {
    console.error("Error in listUsers:", error);
    next(error);
  }
};
export const  subemployers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sort = "desc",
      fromdate,
      todate,
    } = req.query as ListQueryParams;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const matchQueries: Record<string, any> = {};
    const searchMatch: Record<string, any> = {};

    if (search) {
      searchMatch["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (fromdate || todate) {
      matchQueries["createdAt"] = {};
    }
    if (fromdate) {
      matchQueries["createdAt"]["$gte"] = new Date(fromdate);
    }
    if (todate) {
      matchQueries["createdAt"]["$lte"] = new Date(todate);
    }

    const sortStage = {
      [sortBy]: sort === "asc" ? 1 : -1,
    };

    const aggregationPipeline: any[] = [
      { $match: matchQueries },
      { $match: searchMatch },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // {
      //   $project:{
      //     "user.email":1,"user.isActive":1
      //   }
      // }
    ];

    const [results, totalCount] = await Promise.all([
      SubEmployer.aggregate([
        ...aggregationPipeline,
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limitNumber },
      ]),
      SubEmployer.aggregate([...aggregationPipeline, { $count: "total" }]),
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      users: results,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers: total,
        pageSize: limitNumber,
      },
    });
  } catch (error) {
    console.error("Error in listUsers:", error);
    next(error);
  }
};
export const Employers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      fromdate,
      todate,
      sort = "desc",
      ...queries
    } = req.query as ListQueryParams;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const matchQueries: Record<string, any> = {};
    const matchjobQueries: Record<string, any> = {};
    const searchMatch: Record<string, any> = {};

    // Date range filter
    if (fromdate || todate) {
      matchQueries.createdAt = {};
      if (fromdate) matchQueries.createdAt.$gte = new Date(fromdate);
      if (todate) matchQueries.createdAt.$lte = new Date(todate);
    }
   
    // Process other query parameters
    for (const [key, value] of Object.entries(queries)) {
      if (typeof value !== 'string' || value === '') continue;

      switch(key) {
        case 'keyword':
          searchMatch.$or = [
            { name: createRegex(value) },
            { business_name: createRegex(value) },
            { keywords: createRegex(value) }
          ];
          break;

        case 'location':
          const locations = value.split(',');
          matchQueries.$or = [
            { 
              'contact.current_address.city': { 
                $regex: new RegExp(locations.join('|'), 'i') 
              } 
            }
          ];
          break;

        case 'categories':
          const categoryValues = value.split(',');
          matchQueries.categories = {
            $elemMatch: {
              value: { $in: categoryValues }
            }
          };
          break;

        case 'jobtype':
          const jobtypes = value.split(',');
          matchjobQueries['jobsPosted.jobtype'] = { 
            $regex: new RegExp(jobtypes.join('|'), 'i')
          };
          break;

        case 'status':
          matchQueries.isActive = value === "1";
          break;

        default:
          if (!['sort'].includes(key)) {
            matchQueries[key] = createRegex(value);
          }
      }
    }

    const aggregationPipeline: any[] = [
      // Initial matches
      { $match: matchQueries },
      ...(Object.keys(searchMatch).length ? [{ $match: searchMatch }] : []),

      // Lookups
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "employerId",
          as: "jobsPosted",
        },
      },
      ...(Object.keys(matchjobQueries).length ? [{ $match: matchjobQueries }] : []),
      {
        $lookup: {
          from: "applications",
          localField: "jobsPosted._id",
          foreignField: "job",
          as: "applicationsReceived",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Add computed fields
      {
        $addFields: {
          totalJobsPosted: { $size: "$jobsPosted" },
          totalApplicationsReceived: { $size: "$applicationsReceived" },
        },
      },

      // Remove unnecessary arrays from output
      {
        $project: {
          applicationsReceived: 0,
          jobsPosted: 0,
        },
      },

      // Sort, paginate and get total count
      {
        $facet: {
          data: [
            { $sort: { createdAt: sort === "asc" ? 1 : -1 } },
            { $skip: skip },
            { $limit: limitNumber },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ];

    const result = await Employer.aggregate(aggregationPipeline);

    const results = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      users: results,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers: totalCount,
        pageSize: limitNumber,
      },
    });
  } catch (error) {
    console.error("Error in listUsers:", error);
    next(error);
  }
};
export const UpdateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id;
    // Step 3: Delete Associated User
    await User.findByIdAndUpdate(id, req.body, { session });
    // Commit the transaction
    await session.commitTransaction();
    await session.endSession();
    res.status(200).json({
      message: `Updated   successfully`,
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
};
export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!job) {
      throw new AppError("Failed to update job", 400);
    }
    // Commit the transaction
    await session.commitTransaction();
    await session.endSession();
    res.status(200).json({
      message: `Updated   successfully`,
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
};

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      // Similar lookup stages as in listUsers
      {
        $lookup: {
          from: "usertypes",
          localField: "userType",
          foreignField: "_id",
          as: "userType",
        },
      },
      { $unwind: "$userType" },
      {
        $lookup: {
          from: "candidates",
          localField: "candidateId",
          foreignField: "_id",
          as: "candidateDetails",
        },
      },
      {
        $lookup: {
          from: "employers",
          localField: "employerId",
          foreignField: "_id",
          as: "employerDetails",
        },
      },
      {
        $lookup: {
          from: "subemployers",
          localField: "subEmployerId",
          foreignField: "_id",
          as: "subEmployerDetails",
        },
      },
      {
        $unwind: {
          path: "$candidateDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: { path: "$employerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: {
          path: "$subEmployerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          // Exclude sensitive information
          password: 0,
          user_otp: 0,
        },
      },
    ]);

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user[0]);
  } catch (error) {
    console.error("Error in getUserDetails:", error);
    res.status(500).json({
      message: "Error retrieving user details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
export const planList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const planData = await JobportalPlan.find()
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    let count = await JobportalPlan.countDocuments();

    return res.status(200).json({
      status: 200,
      message: "data found",
      data: planData || [],
      total: count,
    });
  } catch (error) {
    next(error);
  }
};
export const getJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page: reqPage,
      fromdate,
      todate,
      limit: reqLimit,
      createdAt,
      experience_from,
      experience_to,
      ...queries
    } = req.query;
    const today = new Date();

    // Parse and set page and limit with fallback
    const page = parseInt(reqPage as string, 10) || 1; // Ensure page is at least 0
    const limit = parseInt(reqLimit as string, 10) || 10; // Ensure limit is at least 1

    // Pagination options
    const pageOptions = {
      skip: (page - 1) * limit,
      limit: limit,
    };
    const matchQueries: Record<string, any> = {};
    const createRegex = (value: string) =>
      new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");
    // Handle date filter
    if (fromdate || todate) {
      matchQueries["createdAt"] = {};
    }
    if (fromdate) {
      matchQueries["createdAt"]["$gte"] = new Date(fromdate as string);
    }
    if (todate) {
      matchQueries["createdAt"]["$lte"] = new Date(todate as string);
    }
    for (let [key, value] of Object.entries(queries)) {
      if (
        typeof value === "string" &&
        value !== "" &&
        !["keyword", "sort", "location","status", "categories", "jobtype"].includes(key)
      ) {
        matchQueries[key] = createRegex(value);
      }
      if (typeof value === "string" && value !== "" && key === "keyword") {
        matchQueries["$and"] = [
          {
            $or: [
              {
                title: createRegex(value),
              },
              {
                "company.name": createRegex(value),
              },
              {
                "employerId.keywords": createRegex(value),
              },
            ],
          },
        ];
      }

      if (typeof value === "string" && value !== "" && key === "location") {
        matchQueries["$or"] = [
          {
            location: { $in: value.split(",") },
          },
          {
            place: { $in: value.split(",")},
          },
        ];
      }

      if (typeof value === "string" && value !== "" && key === "categories") {
        matchQueries["categories"] = {$elemMatch:{value:{ $in: value.split(",") }}};
      }
      if (typeof value === "string" && value !== "" && key === "status") {
        matchQueries["isActive"] = value=="1"?true:false
      }
      if (typeof value === "string" && value !== "" && key === "jobtype") {
        matchQueries["jobtype"] = { $in: value.split(",") };
      }
      // Salary range filter
      if (key === "candidate_requirement.salary_from" && value) {
        matchQueries["candidate_requirement.salary_from"] = {
          $gte: parseInt(value as string),
        };
      }
      if (key === "candidate_requirement.salary_to" && value) {
        matchQueries["candidate_requirement.salary_to"] = {
          $lte: parseInt(value as string),
        };
      }
      if (key === "candidate_requirement.experience" && value) {
        matchQueries["candidate_requirement.experience"] = {
          $lte: parseInt(value as string),
        };
      }
    }

    if (experience_to && experience_from) {
      matchQueries["candidate_requirement.experience"] = {
        $gte: parseInt(experience_from as string),
        $lte: parseInt(experience_to as string),
      };
    }

    const jobs = await Job.aggregate([
      {
        $match: {
          ...matchQueries,
        },
      },
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
        $addFields: {
          applicants_count: {
            $cond: {
              if: { $isArray: "$applications" },
              then: { $size: "$applications" },
              else: "NA",
            },
          },
        },
      },

      {
        $facet: {
          data: [
            { $skip: pageOptions.skip },
            { $limit: pageOptions.limit },
            {
              $sort: { createdAt: -1 },
            },
          ],
          count: [{ $count: "total" }],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Candidate fetched!",
      data: jobs[0]?.data || [],
      count: jobs[0]?.count?.[0]?.total || 0,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
export const getAllApplicants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { page, limit, status, job, createdAt, ...queries } = req.query as {
      page?: string;
      limit?: string;
      status?: string;
      job?: Types.ObjectId;
      createdAt?: string;
      [key: string]: unknown;
    };
    const pageOptions = {
      page: parseInt(page as string, 0) || 1,
      limit: parseInt(limit as string, 0) || 10,
    };
    const matchQueriesupper: Record<string, any> = {};
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
    if (job) {
      matchQueriesupper["job"] = new mongoose.Types.ObjectId(job);
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
          localField: "candidate",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: true } },
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
    const stats = await Application.aggregate([
      {
        $match: matchQueriesupper,
      },
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
export const getJobNamesOnly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobs = await Application.aggregate([
      {
        $match: {},
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

// Create Admin
export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      throw new AppError("Admin already exists", 400);
    }

    const admin = await Admin.create({ name, email, password });
    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (error) {
    next(error);
  }
};

// Get All Admins
export const getAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admins = await Admin.find({});
    res.json(admins);
  } catch (error) {
    next(error);
  }
};

// Update Admin
export const updateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) {
      throw new AppError("Admin not found", 404);
    }

    admin.name = req.body.name || admin.name;
    admin.email = req.body.email || admin.email;

    if (req.body.password) {
      admin.password = req.body.password;
    }

    const updatedAdmin = await admin.save();
    res.json({ message: "Admin updated successfully", updatedAdmin });
  } catch (error) {
    next(error);
  }
};

// Delete Admin
export const deleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) {
      res.status(404);
      throw new AppError("Admin not found", 404);
    }

    await Admin.deleteOne({ _id: id });
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    next(error);
  }
};
export const Dashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { createdAt = "12m" } = req.query;
    const matchStage: Record<string, any> = {};
    if (createdAt) {
      let startDate = postedatesCondition(createdAt as string);
      if (startDate) {
        matchStage["createdAt"] = { $gte: startDate };
      }
    }
    let baseStats = getDashboardstats(req, matchStage, "Jobs");
    // Jobs statistics
    const [jobStats] = await Job.aggregate([
      { $match: matchStage },
      {
        $facet: {
          total: [
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          active: [
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          stats: baseStats, // Wrap `baseStats` in an array
        },
      },
      { $unwind: { path: "$total", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$active", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$stats", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          total: "$total.total",
          active: "$active.total",
          stats: "$stats",
        },
      },
    ]);
    baseStats = getDashboardstats(req, matchStage, "Employers");
    const [EmployersStats] = await Employer.aggregate([
      { $match: matchStage },
      {
        $facet: {
          total: [
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          active: [
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          stats: baseStats, // Wrap `baseStats` in an array
        },
      },
      { $unwind: { path: "$total", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$active", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$stats", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          total: "$total.total",
          active: "$active.total",
          stats: "$stats",
        },
      },
    ]);
    baseStats = getDashboardstats(req, matchStage, "Candidates");
    const [candidateStats] = await Candidate.aggregate([
      { $match: matchStage },
      {
        $facet: {
          total: [
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          active: [
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          stats: baseStats, // Wrap `baseStats` in an array
        },
      },
      { $unwind: { path: "$total", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$active", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$stats", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          total: "$total.total",
          active: "$active.total",
          stats: "$stats",
        },
      },
    ]);

    baseStats = getDashboardstats(req, matchStage, "Applications");
    const [applicationStats] = await Application.aggregate([
      { $match: matchStage },
      {
        $facet: {
          total: [
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          pending: [
            { $match: { status: "pending" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          shortlisted: [
            { $match: { status: "shortlisted" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          rejected: [
            { $match: { status: "rejected" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          source: [
            {
              $lookup: {
                from: "candidates",
                localField: "candidate",
                foreignField: "_id",
                as: "candidateInfo",
              },
            },
            {
              $unwind: {
                path: "$candidateInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                hear_about_us: {
                  $cond: {
                    if: { $isArray: "$candidateInfo.hear_about_us" },
                    then: "$candidateInfo.hear_about_us",
                    else: [],
                  },
                },
              },
            },
            {
              $unwind: {
                path: "$hear_about_us",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: "$hear_about_us",
                total: { $sum: 1 },
              },
            },
            { $match: { _id: { $ne: null } } },
            {
              $project: {
                _id: "$_id",
                total: 1,
              },
            },
            { $sort: { total: -1 } },
          ],
          jobtypes: [
            {
              $lookup: {
                from: "jobs",
                localField: "job",
                foreignField: "_id",
                as: "jobInfo",
              },
            },
            { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: "$jobInfo.jobtype",
                total: { $sum: 1 },
              },
            },
            {
              $project: {
                total: 1,
                _id: 1,
              },
            },
          ],
          categories: [
            {
              $lookup: {
                from: "jobs",
                localField: "job",
                foreignField: "_id",
                as: "jobInfo",
              },
            },
            { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },
            {
              $unwind: {
                path: "$jobInfo.categories",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: "$jobInfo.categories",
                total: { $sum: 1 },
              },
            },
            {
              $project: {
                total: 1,
                _id: 1,
              },
            },
          ],
          stats: baseStats, // Wrap `baseStats` in an array
          shortlistedstats: baseStats,
        },
      },
      // Unwind each facet result, preserving empty or null fields
      { $unwind: { path: "$total", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$pending", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$shortlisted", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$rejected", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$interviews", preserveNullAndEmptyArrays: true } },
      {
        $unwind: { path: "$newApplications", preserveNullAndEmptyArrays: true },
      },
      { $unwind: { path: "$categories", preserveNullAndEmptyArrays: true } },

      // Add percentages for numeric stats
      ...getNumericPercentageStats([
        "pending",
        "shortlisted",
        "rejected",
        "interviews",
        "newApplications",
      ]),

      // Add percentages for string-based stats
      ...getStringPercentageStats(["source", "jobtypes"]),

      // Final projection
      {
        $project: {
          total: "$total.total",
          pending: "$pending",
          shortlisted: "$shortlisted",
          rejected: "$rejected.total",
          interviews: "$interviews",
          source: "$source",
          stats: "$stats",
          newApplications: "$newApplications",
          jobtypes: "$jobtypes",
          categories: "$categories",
        },
      },
    ]);

    baseStats = getDashboardstats(req, matchStage, "SubEmployers");
    const [suemployersStats] = await SubEmployer.aggregate([
      { $match: matchStage },
      {
        $facet: {
          total: [
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          active: [
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          stats: baseStats, // Wrap `baseStats` in an array
        },
      },
      { $unwind: { path: "$total", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$active", preserveNullAndEmptyArrays: true } },
      {
        $unwind: { path: "$stats", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          total: "$total.total",
          active: "$active.total",
          stats: "$stats",
        },
      },
    ]);
    if (jobStats.total && applicationStats.total) {
      // convert to percentage how many peoples applied from allposted jobs
      applicationStats.totalAppliedPercentage = (
        (applicationStats.total / jobStats.total) *
        100
      ).toFixed(2);
    }
    const data = {
      jobStats,
      applicationStats,
      EmployersStats,
      candidateStats,
      suemployersStats,
    };

    res
      .status(200)
      .json({ data, message: "Dashboard data fetched successfully" });
  } catch (error) {
    next(error);
  }
};
