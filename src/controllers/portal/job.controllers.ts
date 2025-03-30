import mongoose, { mongo, Types } from "mongoose";
import { NextFunction, Request, Response } from "express";
import Job, { IJob } from "@/models/portal/job.model";
import { AppError } from "@/middlewares/error";
import Employer from "@/models/portal/employer.model";
import { validateJob } from "@/validations/job";
import { Subscription } from "@/models/portal/subscription.model";
import { Application } from "@/models/candidate/application.model";
import { SavedJobs } from "@/models/candidate/savedjobs";

import { FilterJob } from "@/utils/FilterJobs";

/**
 @desc      Create an job
 @route     POST /api/v1/Job
 @access    Employer
 */
const createJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IJob = req.body;
        payload["createdBy"] = new Types.ObjectId(res.locals.userId);

        const checkEmployer = await Employer.findOne({ userId: payload.createdBy });
        if (!checkEmployer) {
            throw new AppError('Failed to find employer', 400)
        }

        payload["employerId"] = checkEmployer._id as Types.ObjectId;

        // validate the data
        const check = await validateJob(payload);
        if (!check) {
            return;
        }
        const subscription:any = await Subscription.findOne({  userId: payload.createdBy}).populate("plan_id")
        
             if (!subscription) {
                 throw new AppError("Subscribe Package first",400)
               }
             if (subscription.plan_id.jobPostLimit ===subscription.jobPostsUsed) {
                   return res.status(400).json({
                       message: "You have reached the limit of job posts",
                       success: false
                   });
               }
        payload["subscription"]= subscription._id
        const job = await Job.create(payload);
        if (!job) {
            throw new AppError('Failed to create job', 400);
        }
        subscription.jobPostsUsed += 1;
        await subscription.save();
        res.status(201).json({
            success: true,
            message: 'Job created it is on review after review it will show n our site!',
            data: job
        })

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Get all job
 @route     GET /api/v1/job
 @access    Pubic
 */
const getJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page: reqPage, limit: reqLimit,createdAt,experience_from,experience_to, ...queries } = req.query;
        const today = new Date();
        const candidateId = res.locals.candidateId as Types.ObjectId

        // Parse and set page and limit with fallback
        const page =  parseInt(reqPage as string, 10) || 1  // Ensure page is at least 0
        const limit =  parseInt(reqLimit as string, 10) ||10  // Ensure limit is at least 1

        // Pagination options
        const pageOptions = {
            skip: (page-1) * limit,
            limit: limit
        };
        
      const {matchQueries}= FilterJob(req,{deadline:{ $gte: today  }})
        const jobs = await Job.aggregate([
           
            {
                $lookup: {
                    from: "employers",
                    localField: "employerId",
                    foreignField: "_id",
                    as: "employerId"
                }
            },
            {
                $lookup: {
                    from: "degrees",
                    localField: "degrees",
                    foreignField: "_id",
                    as: "degrees"
                }
            },
            {
                $lookup: {
                    from: "industries",
                    localField: "industries",
                    foreignField: "_id",
                    as: "industries"
                }
            },
            {
                $lookup: {
                    from: "jobcategories",
                    localField: "categories",
                    foreignField: "_id",
                    as: "categories"
                }
            },
            {
                $lookup: {
                    from: "states",
                    localField: "location",
                    foreignField: "_id",
                    as: "location"
                }
            },
            {
                $lookup: {
                    from: "cities",
                    localField: "place",
                    foreignField: "_id",
                    as: "place"
                }
            },
            {
                $unwind: {
                    path: "$place",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$location",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "skills",
                    localField: "candidate_requirement.skills",
                    foreignField: "_id",
                    as: "candidate_requirement.skills"
                }
            },
            
            {
                '$lookup': {
                    'from': 'applications',
                    'localField': 'applications',
                    'foreignField': '_id',
                    'as': 'applications'
                }
            },
            {
                $addFields: {
                    isApplied: {
                            $gt: [
                                {
                                    $size: {
                                        $filter: {
                                            input: "$applications",
                                            as: "item",
                                            cond: {
                                                $eq: ["$$item.candidate", candidateId],
                                            },
                                        },
                                    },
                                },
                                0,
                            ],
                        
                      
                    },
                },
            },
            {
                $unwind: {
                    path: "$employerId",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "subscription",
                    foreignField: "_id",
                    as: "subscription"
                }
            },
            {
                $unwind: {
                    path: "$subscription",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    "subscription": { $exists: true },
                    // "subscription.expiresAt": { $gte: today  },
                    isActive: true,
                    ...matchQueries
                }
            },
            {

                $sort: {
                    createdAt: queries["sort"] === 'new' ? -1 : 1
                }
            },
            {
                $project:{
                    applications:0,
                    "candidate_requirement.job_info":0
                }
            }
            ,
            {
                $facet: {
                    data: [
                        // {$project:{
                        //     "subscription":0
                        // }},
                        { $skip: pageOptions.skip },
                        { $limit: pageOptions.limit }
                    ],
                    count: [
                        { $count: "total" }
                    ]
                }
            }
        ])
        res.status(200).json({
            success: true,
            message: 'Job fetched!',
            data: jobs[0]?.data || [],
            count: jobs[0]?.count[0]?.total || 0,
            totalpages: Math.ceil(jobs[0]?.count[0]?.total / pageOptions.limit)
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
};

/**
 @desc      Get an job
 @route     GET /api/v1/job/:id
 @access    Public
 */
const getJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        
        const candidateId = res.locals.candidateId as Types.ObjectId
        const job = await Job.aggregate([
            {
                $match: {
                    _id: new Types.ObjectId(id)
                }
            },
            {
                $lookup: {
                    from: "degrees",
                    localField: "degrees",
                    foreignField: "_id",
                    as: "degrees"
                }
            },
            {
                $lookup: {
                    from: "industries",
                    localField: "industries",
                    foreignField: "_id",
                    as: "industries"
                }
            },
            {
                $lookup: {
                    from: "jobcategories",
                    localField: "categories",
                    foreignField: "_id",
                    as: "categories"
                }
            },
            {
                $lookup: {
                    from: "skills",
                    localField: "candidate_requirement.skills",
                    foreignField: "_id",
                    as: "candidate_requirement.skills"
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
            // location lookup
            {
                $lookup: {
                    from: "states",
                    localField: "location",
                    foreignField: "_id",
                    as: "location"
                }
            },
            // location unwind
            {
                $unwind: {
                    path: "$location",
                    preserveNullAndEmptyArrays: true
                }
            },
            // place lookup
            {
                $lookup: {
                    from: "cities",
                    localField: "place",
                    foreignField: "_id",
                    as: "place"
                }
            },
            // place unwind
            {
                $unwind: {
                    path: "$place",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                '$lookup': {
                    'from': 'applications',
                    'localField': 'applications',
                    'foreignField': '_id',
                    'as': 'applications'
                }
            },
            {
                $addFields: {
                    isApplied: {
                            $gt: [
                                {
                                    $size: {
                                        $filter: {
                                            input: "$applications",
                                            as: "item",
                                            cond: {
                                                $eq: ["$$item.candidate", candidateId],
                                            },
                                        },
                                    },
                                },
                                0,
                            ],
                        
                      
                    },
                },
            },
            // {
            //     $group: {
            //         _id: "$_id",
            //         employerId: { $first: "$employerId" },
            //         isApplied: { $first: "$isApplied" },
            //         title: { $first: "$title" },
            //         location: { $first: "$location" },
            //         place: { $first: "$place" },
            //         opening: { $first: "$opening" },
            //         candidate_requirement: { $first: "$candidate_requirement" },
            //         timing: { $first: "$timing" },
            //         company: { $first: "$company" },
            //         isActive: { $first: "$isActive" },
            //         createdBy: { $first: "$createdBy" },
            //         createdAt: { $first: "$createdAt" },
            //         updatedAt: { $first: "$updatedAt" },
            //         __v: { $first: "$__v" },
            //       updatedBy: { $first: "$updatedBy" },
            //         age: { $first: "$age" },
            //         personal_info: { $first: "$personal_info" },
            //         categories: { $first: "$categories" },
            //         jobtype:{ $first: "$jobtype" },
                  
            //     }
            // }
        ]);

        if (!job) {
            throw new AppError('Failed to find job', 400);
        }

        res.status(200).json({
            success: true,
            data: job?.[0] || {},
            message: 'Job fetched'
        });

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Get an employer jobs
 @route     GET /api/v1/job/employer/
 @access    Employer
 */
const getEmployerJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page: reqPage, limit: reqLimit,createdAt,experience_from,experience_to, ...queries } = req.query;
        const today = new Date();
        const candidateId = res.locals.candidateId as Types.ObjectId

        // Parse and set page and limit with fallback
        const page =  parseInt(reqPage as string, 10) || 1  // Ensure page is at least 0
        const limit =  parseInt(reqLimit as string, 10) ||10  // Ensure limit is at least 1

        // Pagination options
        const pageOptions = {
            skip: (page-1) * limit,
            limit: limit
        };
        const {matchQueries}= FilterJob(req)
        console.log(matchQueries)
    const userId = new Types.ObjectId(res.locals.userId);
        const checkEmployer = await Employer.findOne({ userId });
        if (!checkEmployer) {
            throw new AppError('Failed to find employer', 400)
        };

        const jobs = await Job.aggregate([
            {
                $match: {
                    employerId: checkEmployer._id,
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
            // caogories lookup
            {
                $lookup: {
                    from: "jobcategories",
                    localField: "categories",
                    foreignField: "_id",
                    as: "categories"
                }
            },
            {
                $lookup: {
                    from: "states",
                    localField: "location",
                    foreignField: "_id",
                    as: "location"
                }
            },
            {
                $lookup: {
                    from: "cities",
                    localField: "place",
                    foreignField: "_id",
                    as: "place"
                }
            },
            {
                $unwind: {
                    path: "$place",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$location",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: matchQueries
            },
            
            {
                $sort: { createdAt: -1 }, // Sort by `createdAt` in descending order
              },
            
            {
                $facet: {
                    data: [
                        { $skip: (pageOptions.skip) },
                        { $limit: pageOptions.limit },
                        
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
            totalpages: Math.ceil(jobs[0]?.count[0]?.total / pageOptions.limit)
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
};

/**
 @desc      Get an employer every job names only
 @route     GET /api/v1/job/employer/name
 @access    Employer
 */
const getEmployerJobNamesOnly = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const userId = new Types.ObjectId(res.locals.userId);
        const checkEmployer = await Employer.findOne({ userId });
        if (!checkEmployer) {
            throw new AppError('Failed to find employer', 400)
        };

        const jobs = await Job.aggregate([
            {
                $match: {
                    employerId: checkEmployer._id
                }
            },

            {
                $project: {
                    title: 1
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

/**
 @desc      Get an employer job
 @route     GET /api/v1/job/employer/:id
 @access    Employer
 */
const getEmployerJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new Types.ObjectId(res.locals.userId);
        const checkEmployer = await Employer.findOne({ userId });
        if (!checkEmployer) {
            throw new AppError('Failed to find employer', 400)
        }

        const id = req.params.id;

        const job = await Job.findById(id)
        if (!job) {
            throw new AppError('Failed to find job', 400);
        }

        res.status(200).json({
            success: true,
            data: job,
            message: 'Job fetched'
        });

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Update an job
 @route     PUT /api/v1/job/:id
 @access    Employer
 */
const updateJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IJob = req.body;
        payload["updatedBy"] = res.locals.userId!;

        const checkJob = await Job.findById(req.params.id);
        if (!checkJob) {
            throw new AppError('Failed to find job to update!', 400)
        }

        // validate the data
        const check = await validateJob(payload);
        if (!check) {
            return;
        }

        const job = await Job.findByIdAndUpdate(req.params.id, payload, { new: true })
        if (!job) {
            throw new AppError('Failed to update job', 400)
        }

        res.status(200).json({
            success: true,
            message: 'Job updated!',
            data: job
        });

    } catch (error) {
        console.log(error)
        next(error)
    }
};

/**
 @desc      Delete an job
 @route     DELETE /api/v1/job/:id
 @access    Employer
 */
const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
    const session=await mongoose.startSession()
    await session.startTransaction()
    try {
        const id = req.params.id;

        const job = await Job.findByIdAndDelete(id).session(session)
        await Application.deleteMany({job:id}).session(session)
        await SavedJobs.updateMany({ jobs: id }, { $pull: { jobs: id } }).session(session);
        if (!job) {
            throw new AppError('Failed to find job', 400);
        }
        await session.commitTransaction()
        await session.endSession()
        

        res.status(200).json({
            success: true,
            data: job,
            message: 'Job deleted'
        });

    } catch (error) {
        console.log(error)
        next(error)
    }
};

/**
 @desc      Apply a job
 @route     PUT /api/v1/job/apply/:id
 @access    Employer
 */


/**
 @desc    Accept the candidate for the job
 @route   PUT /api/v1/user/job/shortlist/:id
 @access  Private
 */


/**
 @desc    Decline the candidate for the job
 @route   PUT /api/v1/user/job/decline/:id
 @access  Private
 */

/**
 @desc    Get every shortlisted candidate from a job created by an employer
 @route   GET /api/v1/user/job/shortlistedCandidate/:id
 @access  Private
 */

export {
    createJob, getJobs, getJob, getEmployerJobs, getEmployerJobNamesOnly, getEmployerJob, updateJob, deleteJob, 
}