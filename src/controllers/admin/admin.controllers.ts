import { createRegex } from "@/libs";
import { generateToken } from "@/middlewares/auth";
import { AppError } from "@/middlewares/error";
import Admin, { IAdmin } from "@/models/admin/admin.model";
import User from "@/models/admin/user.model";
import { Application } from "@/models/candidate/application.model";
import Candidate from "@/models/portal/candidate.model";
import Employer from "@/models/portal/employer.model";
import Job from "@/models/portal/job.model";
import { JobportalPlan } from "@/models/portal/plan.model";
import SubEmployer from "@/models/portal/SubEmployer.model";
import { candidateaddresslokup } from "@/utils/ApplicationStats";
import {
  getDashboardstats,
  getNumericPercentageStats,
  getStringPercentageStats,
} from "@/utils/DashboardStats";
import { FilterAdminJob, FilterJob } from "@/utils/FilterJobs";
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
  location?: string;
  status?: string;
  department?: string;
  keyword?: string;
  qualification?:string
  gender?:string
  createdAt?:string
  
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
      { $group: { _id: "$place" } },
      {
        $lookup:{
          from:"cities",
          localField:"place",
          foreignField:"_id",
          as:"place"
        }
      },
      {
        $unwind: "$place"
      },
      {
        $project: {
          label: "$place.name",
          value: "$place._id",
        },
      },
      {
        $facet: {
          data:[],
          // data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
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

    const user: IAdmin |null= await Admin.findOne({ email })
    console.log(user)
    if (!user) {
      throw new AppError("Invalid Credentials", 401);
    }
    if (user) {
      
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
      location='',
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
    if (location) {
      const locations = location.split(',');
      matchQueries.$or = [
        { 
      'contact.current_address.city': { 
        $regex: new RegExp(locations.join('|'), 'i') 
      } 
        }
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
      ...candidateaddresslokup,
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
      department = "",
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
    if(department){
      matchQueries["department"] = {$in:department.split(",")}
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
      jobtype,
      location,
      categories,
      status,
      keyword,
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

    // Location filter (city, state, country)
    if (location) {
      const locations = location.split(',').map(loc => new Types.ObjectId(loc));
      matchQueries['address.city._id'] = { $in: locations };

    }

    // Keyword search (name or email)
    if (keyword) {
      searchMatch.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ];
    }

    // Employer categories filter
    if (categories) {
      const categoriesList = categories.split(',').map(cat => new Types.ObjectId(cat));
      matchQueries["categories"] = { $in: categoriesList };
    }

    // Jobtype filter (jobs' categories)
    if (jobtype) {
      const jobtypeList = jobtype.split(',');
      matchjobQueries["jobsPosted.jobtype"] = { $in: jobtypeList };
    }

    console.log("matchQueries", matchQueries);
    console.log("searchMatch", searchMatch);
    console.log("matchjobQueries", matchjobQueries);

    const aggregationPipeline: any[] = [
     
      {
        $lookup: {
          from: "states",
          localField: "address.state",
          foreignField: "_id",
          as: "address.state",
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "address.city",
          foreignField: "_id",
          as: "address.city",
        },
      },
      {
        $unwind: {
          path: "$address.city",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$address.state",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: matchQueries },
      ...(Object.keys(searchMatch).length ? [{ $match: searchMatch }] : []),
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
      {
        $addFields: {
          totalJobsPosted: { $size: "$jobsPosted" },
          totalApplicationsReceived: { $size: "$applicationsReceived" },
        },
      },
      {
        $project: {
          applicationsReceived: 0,
          jobsPosted: 0,
        },
      },
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
          pipeline: [...candidateaddresslokup],
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
    } = req.query;
   
    // Parse and set page and limit with fallback
    const page = parseInt(reqPage as string, 10) || 1; // Ensure page is at least 0
    const limit = parseInt(reqLimit as string, 10) || 10; // Ensure limit is at least 1

    // Pagination options
    const pageOptions = {
      skip: (page - 1) * limit,
      limit: limit,
    };
    let matchQueries: Record<string, any> = {};
   
    if (fromdate || todate) {
      matchQueries["createdAt"] = {};
    }
    if (fromdate) {
      matchQueries["createdAt"]["$gte"] = new Date(fromdate as string);
    }
    if (todate) {
      matchQueries["createdAt"]["$lte"] = new Date(todate as string);
    }
    matchQueries = FilterAdminJob(req,matchQueries).matchQueries
    console.log("matchQueries",matchQueries)
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
        $lookup: {
          from: "states",
          localField: "location",
          foreignField: "_id",
          as: "location",
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "place",
          foreignField: "_id",
          as: "place",
        },
      },
      {
        $unwind: {
          path: "$place",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind:{path:"$location",preserveNullAndEmptyArrays: true}
      },
      {
        $lookup: {
          from: "job_categories",
          localField: "categories",
          foreignField: "_id",
          as: "categories",
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
    let { page, limit, ...queries } = req.query as {
      page?: string;
      limit?: string;
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
   const blacklist = ["page", "limit", "job", "createdAt"];
   const uppermatchValues=["status"]

    for (let [key, value] of Object.entries(queries)) {
      if (blacklist.includes(key)) {
        continue;
      }
      if (uppermatchValues.includes(key)) {
        matchQueriesupper[key] = value;
      }
      if (  typeof value === "string" && value !== "" && key === "keyword") {
        matchQueries["$or"] = [{ "job.title":createRegex(value)}];
      } 
      if (  typeof value === "string" && value !== "") {
        if(key==="fromdate" || key==="todate"){
        matchQueries["createdAt"] = {};
      } 
      if (key === "fromdate") {
        matchQueries["createdAt"]["$gte"] = new Date(value as string);
      }
      if (key === "todate") {
        matchQueries["createdAt"]["$lte"] = new Date(value as string);
      }

      }
  }
  console.log(matchQueriesupper)
    const results = await Application.aggregate([
      {
        $match: matchQueriesupper,
      },
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          pipeline:[
            {
              $lookup: {
                from: "states",
                localField: "location",
                foreignField: "_id",
                as: "location",
              },
            },
            {
              $lookup: {
                from: "cities",
                localField: "place",
                foreignField: "_id",
                as: "place",
              },
            },
            {
              $unwind: {
                path: "$place",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind:{path:"$location",preserveNullAndEmptyArrays: true}
            },
          ],
          // let: { jobId: "$job" },
          // pipeline: [
          //   {
          //     $match: {
          //       $expr: {
          //         $eq: ["$_id", "$$jobId"],
          //       },
          //     },
          //   },
          // ],
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
    const id=res.locals.userId
    const admins = await Admin.find({_id:{$ne:id}});
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
    for (const key in req.body) {
      if (req.body.hasOwnProperty(key) && req.body[key]) {
        (admin as any)[key] = (req.body as any)[key];
      }
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

