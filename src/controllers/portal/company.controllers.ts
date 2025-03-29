import { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import Employer, { IEmployer, IEmployerFiles } from "@/models/portal/employer.model";
import { AppError } from "@/middlewares/error";
import Job from "@/models/portal/job.model";


/**
 @desc      Get an company
 @route     POST /api/v1/company/:id
 @access    Public
**/
const getEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id =req.params.id
        const skip = 0; // Replace with your desired skip value
        const limit = 3; // Replace with your desired limit value
        const [jobsResult, employerDetails] = await Promise.all([
            Job.aggregate([
                {
                    $match: { employerId: new Types.ObjectId(id) }
                },
               
                {
                    $facet: {
                        jobs: [
                            { $skip: skip },
                            { $limit: limit },
                            // { $project: { title: 1, _id: 0 } }
                        ],
                        totalCount: [
                            { $count: 'count' }
                        ]
                    }
                }
            ]),
            Employer.findById(id).populate("categories").populate("address.city").populate("address.state").populate("address.country").lean()
        ]);

        if (!jobsResult.length || !employerDetails) {
            throw new AppError('Failed to find company or jobs', 400);
        }

        const { jobs, totalCount } = jobsResult[0];

        res.status(200).json({
            success: true,
            data: {
                jobs,
                totalJobs: totalCount[0]?.count || 0,
                employerDetails: employerDetails
            },
            message: 'company and jobs fetched successfully'
        });


    } catch (error) {
        next(error)
    }
};


export {
     getEmployer,
}