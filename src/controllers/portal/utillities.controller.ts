import { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import { AppError } from "@/middlewares/error";
import Job from "@/models/portal/job.model";


/**
 @desc      Get an company
 @route     POST /api/v1/company/:id
 @access    Public
**/
const getEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [maxsalary,maxeperience] = await Promise.all([
            Job.findOne({},{_id:0, 'candidate_requirement.salary_to':1}).sort({ 'candidate_requirement.salary_to': -1 }).lean(),
            Job.findOne({},{_id:0, 'candidate_requirement.experience':1}).sort({ 'candidate_requirement.experience': -1 }).lean(),
        ]);


        res.status(200).json({
            success: true,
            data: {
                maxsalary:maxsalary,
                maxeperience:maxeperience
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