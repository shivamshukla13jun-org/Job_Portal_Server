import { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import { AppError } from "@/middlewares/error";
import Job from "@/models/portal/job.model";
import { validateCantactUs } from "@/validations/candidate";
import { sendEmail } from "@/services/emails";
import Candidate from "@/models/portal/candidate.model";


/**
 @desc      Get an company
 @route     POST /api/v1/company/:id
 @access    Public
// **/
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
/**
 @desc      Get an company
 @route     POST /api/v1/options/:id
 @access    Public
// **/
interface OptionsQuery {
    type?:string;
    id?:Types.ObjectId

}
const Options = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { type, id } = req.params as OptionsQuery;
        let data: any[] = [];

        if (!type) {
            throw new AppError("Provide type", 400);
        }

        const match: Record<string, any> = {
            // employerId: new Types.ObjectId(id),
        };

        // Base pipeline
        const pipeline: any[] = [{ $match: match }];

        // Handle specific types
        if (type === "personal_info.info.degree") {
            type = "personal_info.assets.label";

            pipeline.push(
                { $unwind: "$personal_info" },
                { $unwind: "$personal_info.assets" },
                {$match:{
                    "personal_info.info":"Degree and Specialisation"
                }},
                {
                    $group: {
                        _id: `$${type}`,
                        total: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, value: "$_id", total: 1 } },
                { $sort: { value: 1 } }
            );
        } 
        else if (type === "categories.label") {
            // type="categories.label"
            pipeline.push(
                { $unwind: "$categories" },
                {
                    $group: {
                        _id: `$${type}`,
                        total: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, value: "$_id", total: 1 } },
                { $sort: { value: 1 } }
            );
        } 
        
        else if (type === "salary_experience") {
            // Add grouping stages for max and min salary and experience
            pipeline.push(
                {
                    $group: {
                        _id: null, // No grouping by fields, we want global max/min
                        minSalary: { $min: "$candidate_requirement.salary_from" },
                        maxSalary: { $max: "$candidate_requirement.salary_to" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        maxSalary: 1,
                        minSalary: 1,
                    },
                }
            );
        } 
        else if (type === "experience") {
            // Add grouping stages for max and min salary and experience
            pipeline.push(
                {
                    $group: {
                        _id: null, // No grouping by fields, we want global max/min
                        minExperience: { $min: "$candidate_requirement.experience" },
                        maxExperience: { $max: "$candidate_requirement.experience" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        minExperience: 1,
                        maxExperience: 1,
                    },
                }
            );
        } 
        else{

            pipeline.push(
                    {
                        $group: {
                            _id: `$${type}`,
                            total: { $sum: 1 },
                        },
                    },
                    { $project: { _id: 0, value: "$_id", total: 1 } },
                    { $sort: { value: 1 } }
                );
        }  
          if( type === "salary_experience"  ||type==="experience"){
            [data]=await Job.aggregate(pipeline)
          }else{
            data=await Job.aggregate(pipeline);
          }
        res.status(200).json({
            success: true,
            data: data,
            message: "Data fetched successfully",
        });
    } catch (error) {
        next(error);
    }
};


const ContactUs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      
        const { username, email, subject, message } = req.body;
        const check = await validateCantactUs(req.body);
        if (!check) {
            return;
        }
        const mailOptions = {            // From the user's email
            email,  // Replace with your email
            subject, // Subject from form
            text: `
              You have received a new message from your website contact form:
        
              Name: ${username}
              Email: ${email}
              Subject: ${subject}
              Message: ${message}
            `,
          };
         sendEmail(mailOptions)
        res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        });


    } catch (error) {
        next(error)
    }
};



export {
     getEmployer,ContactUs,Options
}