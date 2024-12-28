import { generateToken } from '@/middlewares/auth';
import { AppError } from '@/middlewares/error';
import Admin from '@/models/admin/admin.model';
import User from '@/models/admin/user.model';
import { Application } from '@/models/candidate/application.model';
import Candidate from '@/models/portal/candidate.model';
import Employer from '@/models/portal/employer.model';
import Job from '@/models/portal/job.model';
import { JobportalPlan } from '@/models/portal/plan.model';
import SubEmployer from '@/models/portal/SubEmployer.model';
import { postedatesCondition } from '@/utils/postedadate';
import { NextFunction, Request, Response } from 'express';
import mongoose, { Types ,PipelineStage} from 'mongoose';

interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fromdate?:Date;
  todate?:Date;
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

export const getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;

    const result = await Job.aggregate([
      { $group: { _id: "$location" } },

      {
        $project: {
          label: "$_id",
          value: "$_id"
        }
      },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]);

    const locations = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0

    const response: PaginatedResult = {
      data: locations,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      success: true
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
export const loginUser = async (req: Request, res: Response,next:NextFunction) => {
try {
  const { email, password } = req.body;

  const user = await Admin.findOne({ email });
  
  if (user ) {
    const isMatch = await user.matchPassword(password as string);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 400);
    }
    const token = generateToken(user);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } else {
    throw new AppError('Invalid email or password',401);
  }
} catch (error) {
  next(error)
}
}

export const dashboard= (
  matchQueries: any,
  userTypeMatch: any
): PipelineStage[] => {
  const baseStats:any= [
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        total: 1
      }
    },
    { $sort: { year: 1, month: 1 } }
  ];

  return [
    { $match: matchQueries },

    // Lookup user types
    {
      $lookup: {
        from: 'usertypes',
        localField: 'userType',
        foreignField: '_id',
        as: 'userType'
      }
    },
    { $unwind: '$userType' },

    // Filter based on userType (Candidate, Employer, Subemployer)
    { $match: userTypeMatch },

    // Add further detail joins based on user type
    {
      $facet: {
        candidateStats: [
          { $match: { 'userType.name': 'Candidate' } },
          {
            $lookup: {
              from: 'candidates',
              localField: '_id',
              foreignField: 'userId',
              as: 'candidateDetails'
            }
          },
          { $unwind: { path: '$candidateDetails', preserveNullAndEmptyArrays: true } },
          ...baseStats
        ],
        employerStats: [
          { $match: { 'userType.name': 'Employer' } },
          {
            $lookup: {
              from: 'employers',
              localField: '_id',
              foreignField: 'userId',
              as: 'employerDetails'
            }
          },
          { $unwind: { path: '$employerDetails', preserveNullAndEmptyArrays: true } },
          ...baseStats
        ],
        subEmployerStats: [
          { $match: { 'userType.name': 'Subemployer' } },
          {
            $lookup: {
              from: 'subemployers',
              localField: '_id',
              foreignField: 'userId',
              as: 'subEmployerDetails'
            }
          },
          { $unwind: { path: '$subEmployerDetails', preserveNullAndEmptyArrays: true } },
          ...baseStats
        ],
        // Total Users Summary
        totalUserStats: [
          {
            $group: {
              _id: '$userType.name',
              count: { $sum: 1 }
            }
          },
          { $project: { userType: '$_id', count: 1, _id: 0 } }
        ]
      }
    }
  ];
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fromdate,
      todate,
    } = req.query as ListQueryParams;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const matchQueries: Record<string, any> = {};
    const searchMatch: Record<string, any> = {};

    if (search) {
      searchMatch['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    

    if (fromdate || todate) {
      matchQueries['createdAt'] = {};
    }
    if (fromdate) {
      matchQueries['createdAt']['$gte'] = new Date(fromdate);
    }
    if (todate) {
      matchQueries['createdAt']['$lte'] = new Date(todate);
    }

    const sortStage = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const aggregationPipeline: any[] = [
      { $match: matchQueries },
      { $match: searchMatch },
      {
        $lookup: {
          from: 'applications',
          localField: 'userId',
          foreignField: 'candidate',
          as: 'applicationsSubmitted',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind:{ path:"$user",preserveNullAndEmptyArrays:true} },
      {
        $addFields:{
          totalApplicationsSubmitted: { $size: '$applicationsSubmitted' },
        }
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
      Candidate.aggregate([
        ...aggregationPipeline,
        { $count: 'total' },
      ]),
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
    console.error('Error in listUsers:', error);
    next(error);
  }
};
export const subemployers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fromdate,
      todate,
    } = req.query as ListQueryParams;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const matchQueries: Record<string, any> = {};
    const searchMatch: Record<string, any> = {};

    if (search) {
      searchMatch['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    

    if (fromdate || todate) {
      matchQueries['createdAt'] = {};
    }
    if (fromdate) {
      matchQueries['createdAt']['$gte'] = new Date(fromdate);
    }
    if (todate) {
      matchQueries['createdAt']['$lte'] = new Date(todate);
    }

    const sortStage = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const aggregationPipeline: any[] = [
      { $match: matchQueries },
      { $match: searchMatch },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind:{ path:"$user",preserveNullAndEmptyArrays:true} },
     
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
      SubEmployer.aggregate([
        ...aggregationPipeline,
        { $count: 'total' },
      ]),
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
    console.error('Error in listUsers:', error);
    next(error);
  }
};
export const Employers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fromdate,
      todate,
    } = req.query as ListQueryParams;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const matchQueries: Record<string, any> = {};
    const searchMatch: Record<string, any> = {};

    if (search) {
      searchMatch['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

  
    if (fromdate || todate) {
      matchQueries['createdAt'] = {};
    }
    if (fromdate) {
      matchQueries['createdAt']['$gte'] = new Date(fromdate);
    }
    if (todate) {
      matchQueries['createdAt']['$lte'] = new Date(todate);
    }

    const sortStage = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const aggregationPipeline: any[] = [
      { $match: matchQueries },
      { $match: searchMatch },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'employerId',
          as: 'jobsPosted',
        },
      },
     
      {
        $lookup: {
          from: 'applications',
          localField: 'jobsPosted._id',
          foreignField: 'job',
          as: 'applicationsReceived',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind:{ path:"$user",preserveNullAndEmptyArrays:true} },
      {
        $addFields:{
          totalJobsPosted: { $size: '$jobsPosted' },
          totalApplicationsReceived: { $size: '$applicationsReceived' },
        }
      },
      {
        $project:{
          applicationsReceived:0,jobsPosted:0,
          // "user.email":1,"user.isActive":1
        }
      }
    ];
    const [results, totalCount] = await Promise.all([
      Employer.aggregate([
        ...aggregationPipeline,
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limitNumber },
      ]),
      Employer.aggregate([
        ...aggregationPipeline,
        { $count: 'total' },
      ]),
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
    console.error('Error in listUsers:', error);
    next(error);
  }
};
export const UpdateUser=async (req: Request, res: Response, next: NextFunction)=> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
      const id = req.params.id;
      // Step 3: Delete Associated User
      await User.findByIdAndUpdate(id,req.body, { session });
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
}
export const updateJob=async (req: Request, res: Response, next: NextFunction)=> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
  
      const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true })
      if (!job) {
          throw new AppError('Failed to update job', 400)
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
}

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      // Similar lookup stages as in listUsers
      {
        $lookup: {
          from: 'usertypes',
          localField: 'userType',
          foreignField: '_id',
          as: 'userType'
        }
      },
      { $unwind: '$userType' },
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidateId',
          foreignField: '_id',
          as: 'candidateDetails'
        }
      },
      {
        $lookup: {
          from: 'employers',
          localField: 'employerId',
          foreignField: '_id',
          as: 'employerDetails'
        }
      },
      {
        $lookup: {
          from: 'subemployers',
          localField: 'subEmployerId',
          foreignField: '_id',
          as: 'subEmployerDetails'
        }
      },
      { $unwind: { path: '$candidateDetails', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$employerDetails', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$subEmployerDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          // Exclude sensitive information
          password: 0,
          user_otp: 0
        }
      }
    ]);

    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user[0]);
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    res.status(500).json({ 
      message: 'Error retrieving user details', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
export const planList=async (req: Request, res: Response,next:NextFunction) => {
  try {
      const { page=1, limit =10}= req.query;
     
          const planData = await JobportalPlan.find()
              .skip((Number(page) - 1) * Number(limit))
              .limit(Number(limit));
          let count = await JobportalPlan.countDocuments();
         
       return res.status(200).json({ status: 200, message: "data found", data: planData ||[], total: count });
          
      
  } catch (error) {
      next(error)
  }
}
export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page: reqPage,fromdate, todate, limit: reqLimit,createdAt,experience_from,experience_to, ...queries } = req.query;
    const today = new Date();

    // Parse and set page and limit with fallback
    const page =  parseInt(reqPage as string, 10) || 1  // Ensure page is at least 0
    const limit =  parseInt(reqLimit as string, 10) ||10  // Ensure limit is at least 1

    // Pagination options
    const pageOptions = {
        skip: (page-1) * limit,
        limit: limit
    };
    const matchQueries: Record<string, any> = {};
    const createRegex = (value: string) => new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");
     // Handle date filter
     if (fromdate || todate) {
      matchQueries["createdAt"]={}

  }
     if (fromdate) {
      matchQueries["createdAt"] ["$gte"]=  new Date(fromdate as string)

  }
     if (todate) {
      matchQueries["createdAt"] ["$lte"]=  new Date(todate as string)
  }
    for (let [key, value] of Object.entries(queries)) {
        if (typeof value === 'string' && value !== '' && !['keyword', 'sort', 'location', 'categories','jobtype'].includes(key)) {
            matchQueries[key] = createRegex(value)
        };
        if (typeof value === 'string' && value !== '' && key === 'keyword') {
            matchQueries["$and"] = [
              {"$or":[
                {
                    title: createRegex(value)
                },
                {
                    "company.name": createRegex(value)
                },
                {
                    "employerId.keywords": createRegex(value)
                },
              ]}
            ]
        };

        if (typeof value === 'string' && value !== '' && key === 'location') {
            matchQueries["$or"] = [
                {
                    location: createRegex(value)
                },
                {
                    place: createRegex(value)
                },
            ]
        };

        if (typeof value === 'string' && value !== '' && key === 'categories') {
            matchQueries["categories.label"] = createRegex(value)
        }
        if (typeof value === 'string' && value !== '' && key === 'jobtype') {
            matchQueries["jobtype"] = {$in:value.split(",")}
        }
       // Salary range filter
       if (key === 'candidate_requirement.salary_from' && value) {
        matchQueries['candidate_requirement.salary_from']= {$gte: parseInt(value as string)} 
    }
    if (key === 'candidate_requirement.salary_to' && value) {
        matchQueries['candidate_requirement.salary_to']= {$lte: parseInt(value as string) }
    }
    if (key === 'candidate_requirement.experience' && value) {
        matchQueries['candidate_requirement.experience']= {$lte: parseInt(value as string) }
    }
}

if (experience_to && experience_from) {
    matchQueries['candidate_requirement.experience']= {$gte: parseInt(experience_from as string),$lte: parseInt(experience_to as string) }
}

      const jobs = await Job.aggregate([
          {
              $match: {
                  ...matchQueries
              }
          },
          {
              $lookup: {
                  from: "employers",
                  localField: "employerId",
                  foreignField: "_id",
                  as: "employerId"
              }
          },
          {
              $unwind: {
                  path: "$employerId",
                  preserveNullAndEmptyArrays: true
              }
          },
          {
         $addFields:{applicants_count: { $cond: { if: { $isArray: "$applications" }, then: { $size: "$applications" }, else: "NA"} }
        }
          },
          
          {
              $facet: {
                  data: [
                      { $skip:pageOptions.skip },
                      { $limit: pageOptions.limit },
                      {
                          $sort: { createdAt: -1 }
                       }
                      
                  ],
                  count: [
                      { $count: "total" }
                  ]
              }
          }
      ]);

      res.status(200).json({
          success: true,
          message: 'Candidate fetched!',
          data: jobs[0]?.data || [],
          count: jobs[0]?.count?.[0]?.total || 0,
      })

  } catch (error) {
      console.log(error)
      next(error)
  }
};
export const getAllApplicants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        limit: parseInt(limit as string, 0) || 10
    };
    const matchQueriesupper: Record<string, any> = {
    
    };
    const matchQueries: Record<string, any> = {};
    const createRegex = (value: string) => new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");
    // Handle date filter
            if (createdAt) {
              let startDate=postedatesCondition(createdAt  as string )
              if (startDate) {
                matchQueriesupper['createdAt'] = { $gte: startDate };
              }   
            }
              if (status) {
                matchQueriesupper['status'] =  status
              }   
              if (job) {
                matchQueriesupper['job'] =  new mongoose.Types.ObjectId(job)
              }   
            
    for (const [key, value] of Object.entries(queries)) {
            if (typeof value === 'string' && value !== '' && !['createdAt', 'status',"name" ].includes(key)) {
              matchQueries[key] = createRegex(value)
          };
        if (typeof value === 'string' && value !== '') {
            if (key === 'name') {
                matchQueries['candidate.name'] = createRegex(value);
            } 
        }
    }
    const results = await Application.aggregate([
      {
        $match: matchQueriesupper
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
      { $unwind:{ path:"$job",preserveNullAndEmptyArrays:true} },
     
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
      { $unwind:{path: "$candidate",preserveNullAndEmptyArrays:true} },
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
      { $unwind:{path: "$resume",preserveNullAndEmptyArrays:true} },
      {
        $match: {
            ...matchQueries
        }
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
        $match: matchQueriesupper
       },
      {
        $facet: {
          totals: [
            {
              $match:{status:"pending"}
            },
            {
              $group:{
                _id:null,
               total:{$sum:1}
              }
            },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } }
          ],
          approved: [
            {
              $match:{status:"shortlisted"}
            },
            {
              $group:{
                _id:null,
                total:{$sum:1}
              }
            },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } }
          ],
          rejected: [
            {
              $match:{status:"rejected"}
            },
            {
              $group:{
                _id:null,
                total:{$sum:1}
              }
            },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } }
          ],
        },
      },
      { $unwind: {path:"$totals",preserveNullAndEmptyArrays:true} },
      { $unwind: {path:"$approved",preserveNullAndEmptyArrays:true} },
      { $unwind: {path:"$rejected",preserveNullAndEmptyArrays:true} },


    ]);
    const application = results[0]?.application || [];
    const totalApplications: number = results[0]?.total[0]?.count || 0;

    res.status(200).json({
      data: application,
      stats:stats[0],
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
export const getJobNamesOnly = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await Application.aggregate([
      {
          $match: {  }
      },
      {
        $group:{
          _id:"$job",
        }
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
              title: 1
          }
      }
      ],
      as: "job",
    },
    
  },
  { $unwind:{path: "$job",preserveNullAndEmptyArrays:true} },
  {
    $project: {
        "job": 1
    }
}
     
  ]);

  res.status(200).json({
      success: true,
      message: 'Candidate fetched!',
      data: jobs
  })

  } catch (error) {
      console.log(error)
      next(error)
  }
}


// Create Admin
export const createAdmin = async (req: Request, res: Response,next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
  
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
  
      throw new AppError('Admin already exists',400);
    }
  
    const admin = await Admin.create({ name, email, password });
    res.status(201).json({ message: 'Admin created successfully', admin });
    
  } catch (error) {
    next(error)
  }
}

// Get All Admins
export const getAdmins = async (req: Request, res: Response,next: NextFunction) => {
  try {
    const admins = await Admin.find({});
    res.json(admins);
    
  } catch (error) {
    next(error)
  }
}

// Update Admin
export const updateAdmin = async (req: Request, res: Response,next: NextFunction) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
  
    if (!admin) {
      throw new AppError('Admin not found',404);
    }
  
    admin.name = req.body.name || admin.name;
    admin.email = req.body.email || admin.email;
  
    if (req.body.password) {
      admin.password = req.body.password;
    }
  
    const updatedAdmin = await admin.save();
    res.json({ message: 'Admin updated successfully', updatedAdmin });
  } catch (error) {
    next(error)
  }
}

// Delete Admin
export const deleteAdmin = async (req: Request, res: Response,next: NextFunction) => {
 try {
  const { id } = req.params;
  const admin = await Admin.findById(id);

  if (!admin) {
    res.status(404);
    throw new AppError('Admin not found',404);
  }

  await Admin.deleteOne({_id:id})
  res.json({ message: 'Admin deleted successfully' });
 } catch (error) {
  next(error)
 }
};
export const Dashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const today = new Date();
        const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
        const monthsArray = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        // Base aggregation pipeline
        const baseStats = [
            { $match: { createdAt: { $gte: lastYear } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    total: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: { $arrayElemAt: [monthsArray, { $subtract: ["$_id.month", 1] }] },
                    total: 1
                }
            }
        ];

        // Jobs statistics
        const [jobStats] = await Job.aggregate([
            {
                $facet: {
                    totalJobs: [
                        { $group: { _id: null, total: { $sum: 1 } } },
                        { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } }
                    ],
                    activeListings: [
                        { $match: { isActive:true  } },
                        { $group: { _id: null, total: { $sum: 1 } } },
                        { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } }
                    ],
                    jobTypeStats: [
                        {
                            $group: {
                                _id: "$jobtype",
                                total: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                jobType: "$_id",
                                total: 1,
                                _id: 0
                            }
                        }
                    ],
                    // "monthlyStats": baseStats
                }
              },
              {
                $unwind:{
                  path:"$totalJobs",preserveNullAndEmptyArrays:true
                }
              },
              {
                $unwind:{
                  path:"$activeListings",preserveNullAndEmptyArrays:true
                }
              }
        ]);

        // Application statistics
        const [applicationStats] = await Application.aggregate([
            {
                $facet: {
                    totalApplications: [
                        { $group: { _id: null, total: { $sum: 1 } } },
                        { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } }
                    ],
                    statusBreakdown: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                status: "$_id",
                                total: "$count",
                                _id: 0
                            }
                        }
                    ],
                    sourceBreakdown: [
                      {
                          $lookup: {
                              from: "candidates",
                              localField: "candidate",
                              foreignField: "_id",
                              as: "candidateInfo"
                          }
                      },
                      { $unwind: "$candidateInfo" },
                      {
                          $project: {
                              hear_about_us: {
                                  $cond: {
                                      if: { $isArray: "$candidateInfo.hear_about_us" },
                                      then: "$candidateInfo.hear_about_us",
                                      else: []
                                  }
                              }
                          }
                      },
                      { $unwind: "$hear_about_us" },
                      {
                          $group: {
                              _id: "$hear_about_us",
                              total: { $sum: 1 }
                          }
                      },
                      {
                          $match: {
                              _id: { $ne: null }
                          }
                      },
                      {
                          $project: {
                              source: "$_id",
                              total: 1,
                              _id: 0
                          }
                      },
                      { $sort: { total: -1 } }
                  ],
                    recentApplications: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: "candidates",
                                localField: "candidate",
                                foreignField: "_id",
                                as: "candidateInfo"
                            }
                        },
                        { $unwind: "$candidateInfo" },
                        {
                            $lookup: {
                                from: "jobs",
                                localField: "job",
                                foreignField: "_id",
                                as: "jobInfo"
                            }
                        },
                        { $unwind: "$jobInfo" },
                        {
                            $project: {
                                candidate: {
                                    name: "$candidateInfo.name",
                                    // role: "$candidateInfo.designation",
                                    // experience: "$candidateInfo.yearsOfExperience"
                                },
                                appliedFor: "$jobInfo.title",
                                status: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            }
        ]);
        console.log(applicationStats.sourceBreakdown)
        // Calculate hire rate
        const hireRate = applicationStats.statusBreakdown?.find((s:any) => s.status === "shortlisted")?.total || 0;
        const totalApplications = applicationStats.totalApplications?.total || 0;
        const hirePercentage = totalApplications > 0 ? (hireRate / totalApplications * 100).toFixed(1) : 0;

        const response = {
            jobStatistics: [
                { title: 'Total Jobs', value: jobStats.totalJobs?.total || 0, percent: 100, color: 'success' },
                { title: 'Active Listings', value: jobStats.activeListings?.total || 0, percent: 60, color: 'info' },
                { title: 'Applications', value: `${totalApplications} Applied`, percent: 75, color: 'warning' },
                { title: 'Interviews', value: `${applicationStats.statusBreakdown?.find((s:any) => s.status === "interview")?.total || 0} Scheduled`, percent: 30, color: 'danger' },
                { title: 'Hire Rate', value: `${hirePercentage}% Success`, percent: Number(hirePercentage), color: 'primary' }
            ],
            jobApplicationTrend: jobStats.jobTypeStats?.map((stat:any) => ({
                title: stat.jobType,
                value1: Math.round((stat.total / jobStats.totalJobs.total) * 100),
                value2: stat.total
            })) || [],
            sourceBreakdown: applicationStats.sourceBreakdown?.map((source: any) => ({
              title: source.source,
              icon: getSourceIcon(source.source),
              percent: Math.round((source.total / totalApplications) * 100),
              value: `${source.total} Applicants`
          })) || [],
            recentApplications: applicationStats.recentApplications?.map((app:any) => ({
                candidate: {
                    name: app.candidate.name,
                    role: app.candidate.role,
                    applied: app.appliedFor
                },
                // experience: {
                //     years: app.candidate.experience,
                //     level: getLevelFromYears(app.candidate.experience)
                // },
                status: {
                    text: getStatusText(app.status),
                    color: getStatusColor(app.status)
                },
                activity: getTimeAgo(app.createdAt)
            })) || []
        };

        res.status(200).json({ data: response, message: "Dashboard data fetched successfully" });
    } catch (error) {
        next(error);
    }
};

// Helper functions
// Add source icon mapping helper
const getSourceIcon = (source: string) => {
  const iconMap: { [key: string]: string } = {
      'Job Boards': 'cilChart',
      'Social Media': 'cilUserFemale',
      'Company Website': 'cilBuilding',
      'Referral': 'cilPeople',
      'Direct': 'cilUser'
  };
  return iconMap[source] || 'cilUser';
};
const getLevelFromYears = (years: number) => {
    if (years < 2) return 'Entry-Level';
    if (years < 5) return 'Mid-Level';
    return 'Senior';
};

const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
        pending: 'Application Received',
        interview: 'Interview Scheduled',
        shortlisted: 'Shortlisted',
        hired: 'Hired',
        rejected: 'Rejected'
    };
    return statusMap[status] || status;
};

const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
        pending: 'primary',
        interview: 'info',
        shortlisted: 'success',
        hired: 'success',
        rejected: 'danger'
    };
    return colorMap[status] || 'primary';
};

const getTimeAgo = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return 'Yesterday';
    return 'Last Week';
};