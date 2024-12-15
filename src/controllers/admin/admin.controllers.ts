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
const EmployerDashboard = async (req: Request, res: Response, next: NextFunction)=> {
  try {
      const today: Date = new Date();
      const lastYear: Date = new Date(today.setFullYear(today.getFullYear() - 1));
      const monthsArray: string[] = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
      ];

      const baseStats: any[] = [
          {
              $match: {
                  createdAt: { $gte: lastYear }
              }
          },
          {
              $group: {
                  _id: {
                      year: { $year: "$createdAt" },
                      month: { $month: "$createdAt" }
                  },
                  total: { $sum: 1 }
              }
          },
          {
              $sort: {
                  "_id.year": 1,
                  "_id.month": 1
              }
          },
          {
              $project: {
                  _id: 0,
                  year: "$_id.year",
                  month: {
                      $arrayElemAt: [monthsArray, { $subtract: ["$_id.month", 1] }]
                  },
                  total: 1
              }
          },
      ];
      const [totalpostedjobs]: any[] = await Job.aggregate([
          {
            $match:{ }
          },

          {
              $facet: {
                  postedjobs: [
                      { $group: { _id: "$_id", total: { $sum: 1 } } },
                      { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } }
                  ],
                  stats: baseStats,
              }
          },
          {
              $unwind: {
                  path: "$postedjobs",
                  preserveNullAndEmptyArrays: true,
              },
          },
          {
              $project: {
                  total: { $ifNull: ["$postedjobs.total", 0] },
                  stats: 1,
              }
          }
      ]);

      // Application stats with status-based filtering
      const [Applicationdata]:any[] = await Application.aggregate([
          {
              $match:{ }
            },
          {
              $facet: {
                  Application: [
                      { $group: { _id: null, total: { $sum: 1 } } },
                      { $project: { _id: 0 } }
                  ],
                  Shortlist: [
                      { $match: { status: "shortlisted" } },
                      { $group: { _id: null, total: { $sum: 1 } } },
                      { $project: { _id: 0 } }
                  ],
                  pendinglist: [
                      { $match: { status: "pending" } },
                      { $group: { _id: null, total: { $sum: 1 } } },
                      { $project: { _id: 0 } }
                  ],
                  rejectedlist: [
                      { $match: { status: "rejected" } },
                      { $group: { _id: null, total: { $sum: 1 } } },
                      { $project: { _id: 0 } }
                  ],
                  Applicationstats: baseStats,
                  Shortliststats: [
                    { $match:{ status: "shortlisted" } } ,// Filtering for accepted
                      ...baseStats,
                  ],
                  pendingstats: [
                    { $match: { status: "pending" } }, // Filtering for pending
                      ...baseStats,
                  ],
                  rejectedstats: [
                    { $match: {  status: "rejected" } }, // Filtering for rejected
                      ...baseStats,
                  ],
              },
          },
          {
              $unwind: {
                  path: "$Application",
                  preserveNullAndEmptyArrays: true,
              },
          },
          {
              $unwind: {
                  path: "$Shortlist",
                  preserveNullAndEmptyArrays: true,
              },
          },
          {
              $unwind: {
                  path: "$pendinglist",
                  preserveNullAndEmptyArrays: true,
              },
          },
          {
              $unwind: {
                  path: "$rejectedlist",
                  preserveNullAndEmptyArrays: true,
              },
          },
          {
              $project: {
                  Application: { $ifNull: ["$Application.total", 0] },
                  Shortlist: { $ifNull: ["$Shortlist.total", 0] },
                  pendinglist: { $ifNull: ["$pendinglist.total", 0] },
                  rejectedlist: { $ifNull: ["$rejectedlist.total", 0] },
                  Applicationstats: 1,
                  Shortliststats: 1,
                  pendingstats: 1,
                  rejectedstats: 1,
              },
          },
      ]);

    

      let data: any = {
          jobs: totalpostedjobs,
          Applicationdata,
          // users: users,
      };
      res.status(200).json({ data, message: "fetch data successful" });
  } catch (error) {
      next(error);
  }
}