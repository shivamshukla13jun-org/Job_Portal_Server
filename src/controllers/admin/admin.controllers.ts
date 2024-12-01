import { AppError } from '@/middlewares/error';
import User from '@/models/admin/user.model';
import { UserType } from '@/models/admin/userType.model';
import { Application } from '@/models/candidate/application.model';
import Candidate from '@/models/portal/candidate.model';
import Employer from '@/models/portal/employer.model';
import Job from '@/models/portal/job.model';
import { JobportalPlan } from '@/models/portal/plan.model';
import SubEmployer from '@/models/portal/SubEmployer.model';
import { postedatesCondition } from '@/utils/postedadate';
import { NextFunction, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
// import User from '../models/user.model';
// import UserType from '../models/userType.model';
// import Candidate from '../models/candidate.model'; 
// import Employer from '../models/employer.model';
// import SubEmployer from '../models/subEmployer.model';

interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const listUsers = async (req: Request, res: Response,next:NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      userType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as ListQueryParams;

    // Parse page and limit, ensure they are numbers
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    // Prepare search match stage
    const searchMatch = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Prepare user type match stage
    const userTypeMatch = userType 
      ? { 'userType.name': userType } 
      : {};

    // Prepare sort stage
    const sortStage = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    // Aggregation pipeline
    const aggregationPipeline: any[] = [
      // Join with UserType
      {
        $lookup: {
          from: 'usertypes',
          localField: 'userType',
          foreignField: '_id',
          as: 'userType'
        }
      },
      { $unwind: '$userType' },

      // Join with additional collections based on user type
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: 'userId',
          as: 'candidateDetails'
        }
      },
      {
        $lookup: {
          from: 'employers',
          localField: '_id',
          foreignField: 'userId',
          as: 'employerDetails'
        }
      },
      {
        $lookup: {
          from: 'subemployers',
          localField: '_id',
          foreignField: 'userId',
          as: 'subEmployerDetails'
        }
      },
      { $unwind: { path: '$candidateDetails', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$employerDetails', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$subEmployerDetails', preserveNullAndEmptyArrays: true } },

      // Match stages
      { $match: searchMatch },
      { $match: userTypeMatch },

      // Project to control output fields
      {
        $project: {
          _id: 1,
          email: 1,
          candidateDetails: {
            $cond: {
              if: { $eq: ['$userType.name', 'Candidate'] },
              then: '$candidateDetails',
              else: '$$REMOVE'
            }
          },
          employerDetails: {
            $cond: {
              if: { $eq: ['$userType.name', 'Employer'] },
              then: '$employerDetails',
              else: '$$REMOVE'
            }
          },
          subEmployerDetails: {
            $cond: {
              if: { $eq: ['$userType.name', 'Subemployer'] },
              then: '$subEmployerDetails',
              else: '$$REMOVE'
            }
          },
          userType: '$userType.name',
          isActive: 1,
          isBlocked: 1,
          createdAt: 1,
         
        }
      },

      // Sort stage
      { $sort: sortStage }
    ];

    // Prepare final aggregation with pagination
    const [results, totalCount] = await Promise.all([
      User.aggregate([
        ...aggregationPipeline,
        { $skip: skip },
        { $limit: limitNumber }
      ]),
      User.aggregate([
        ...aggregationPipeline,
        { $count: 'total' }
      ])
    ]);

    // Calculate total pages
    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      users: results,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers: total,
        pageSize: limitNumber
      }
    });
  } catch (error) {
    console.error('Error in listUsers:', error);
    next(error)
};
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
      const { page, limit, ...queries } = req.query

     

      const pageOptions = {
          page: parseInt(page as string, 0) || 0,
          limit: parseInt(limit as string, 10) || 10
      }

      const matchQueries: { [key: string]: RegExp } = {};
      const createRegex = (value: string) => new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");

      for (const [key, value] of Object.entries(queries)) {
          if (typeof value === 'string' && value !== '') {
              matchQueries[key] = createRegex(value)
          }
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
              $facet: {
                  data: [
                      { $skip: pageOptions.page * pageOptions.limit },
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
export default listUsers