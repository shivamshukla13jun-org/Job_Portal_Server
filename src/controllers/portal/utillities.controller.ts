import { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import { AppError } from "@/middlewares/error";
import Job from "@/models/portal/job.model";
import { validateCantactUs } from "@/validations/candidate";
import { sendEmail } from "@/services/emails";


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
        await sendEmail(mailOptions)
        res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        });


    } catch (error) {
        next(error)
    }
};



export {
     getEmployer,ContactUs
}