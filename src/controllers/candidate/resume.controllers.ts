import { NextFunction, Request, Response } from "express";
import mongoose, { Types } from "mongoose";

import Resume, { IResume } from "@/models/candidate/resume.model";
import { AppError } from "@/middlewares/error";
import { validateResume } from "@/validations/resume";
import { IFile } from "@/types/file";
import User from "@/models/admin/user.model";
import Candidate from "@/models/portal/candidate.model";
import { Application } from "@/models/candidate/application.model";

/**
 @desc      Create an resume
 @route     POST /api/v1/resume
 @access    Private
**/
const createResume = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const payload: IResume = req.body;
        const userId = res.locals.userId as Types.ObjectId
        const checkCandidate = await Candidate.findOne({ userId: userId });
        if (!checkCandidate) {
            throw new AppError('Failed to find user', 400);
        }
        
        const resume = await Resume.create(payload,{session:session});
        if (!resume) {
            throw new AppError('Failed to create resume', 400);
        }
        checkCandidate["isresume"] = true
        await checkCandidate.save()
        await session.commitTransaction();
        session.endSession();
        res.status(201).json({
            success: true,
            message: 'Resume created!',
            data: Resume
        })

    } catch (error) {
     await session.abortTransaction();
      session.endSession();
        next(error)
    }
};

/**
 @desc      Get all resume
 @route     POST /api/v1/resume
 @access    Private
**/
const getResumes = async (req: Request, res: Response, next: NextFunction) => {
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

        const resumes = await Resume.aggregate([
            {
                $match: {
                    ...matchQueries
                }
            },
            {
                $facet: {
                    data: [
                        { $skip: pageOptions.page * pageOptions.limit },
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
            message: 'Resume fetched!',
            data: resumes[0]?.data || [],
            count: resumes[0]?.total[0]?.count || 0,
        })

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Get an resume
 @route     GET /api/v1/resume/:id
 @access    Private
**/
const getResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const resume = await Application.findById(id).populate({
            path: 'candidate',
            populate: [
              {
                path: 'employment',
                model: 'Employment',
                populate: {
                  path: 'categories',
                  model: 'JobCategory'
                }
              },
              {
                path: 'contact.current_address.city',
                model: 'City'  // Adjust this model name if needed
              },
              {
                path: 'contact.current_address.state',
                model: 'State'  // Adjust this model name if needed
              },
              {
                path: 'contact.current_address.country',
                model: 'Country'  // Adjust this model name if needed
              },
              {
                path: 'contact.permanent_address.city',
                model: 'City'  // Adjust this model name if needed
              },
              {
                path: 'contact.permanent_address.state',
                model: 'State'  // Adjust this model name if needed
              },
              {
                path: 'contact.permanent_address.country',
                model: 'Country'  // Adjust this model name if needed
              }
            ]
        }).lean();
        if (!resume) {
            throw new AppError('Failed to find data', 400);
        }

        const data: any = { ...resume.candidate }; // Spread candidate data
        data["status"] = resume.status; // Add status field explicitly

        res.status(200).json({
            success: true,
            data: data || {},
            message: 'Data fetched successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 @desc      Get an resume using candidate id
 @route     GET /api/v1/resume/candidate/:id
 @access    Private
**/
const getResumeForCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const checkCandidate = await Candidate.findOne({ userId: id })
        if (!checkCandidate) {
            throw new AppError("Failed to find candidate", 400)
        }

        const resume = await Resume.findOne({ candidateId: checkCandidate._id }).populate("candidateId")
        if (!resume) {
            throw new AppError('Failed to find resume', 400);
        }

        res.status(200).json({
            success: true,
            data: resume,
            message: 'Resume fetched'
        });

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Update an resume
 @route     PUT /api/v1/resume/:id
 @access    Private
**/
const updateResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IResume = JSON.parse(req.body.parse);
        const portfolio = req.file as unknown as IFile;

        const checkCandidate = await Candidate.findOne({ userId: new Types.ObjectId(req.params.id) });
        if (!checkCandidate) {
            throw new AppError('Failed to find user', 400);
        }

        // format the payload
        payload["portfolio"] = portfolio || payload["portfolio"];
       
        
        // validate the data
        const check = await validateResume(payload);
        if (!check) {
            return;
        }

        const checkResume = await Resume.findOne({ candidateId: checkCandidate._id })
        checkCandidate["isresume"] = true
        await checkCandidate.save()
        if (!checkResume) {
            payload["candidateId"] = checkCandidate._id as Types.ObjectId;
            const newResume = await Resume.create(payload);
            if (!newResume) {
                throw new AppError('Failed to create Resume', 400);
            }
            checkCandidate["isresume"] = true
        await checkCandidate.save()
            return res.status(201).json({
                success: true,
                message: 'Resume created!',
                data: newResume
            });
        };
     
        const resume = await Resume.findByIdAndUpdate(checkResume._id, payload, { new: true, runValidators: true })
        if (!resume) {
            throw new AppError('Failed to update Resume', 400)
        }
        checkCandidate["isresume"] = true
        await checkCandidate.save()
        res.status(200).json({
            success: true,
            message: 'Resume updated!',
            data: resume
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
};

/**
 @desc      Delete an resume
 @route     DELETE /api/v1/resume/:id
 @access    Private
**/
const deleteResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const resume = await Resume.findByIdAndDelete(id);
        if (!resume) {
            throw new AppError('Failed to find Resume', 400);
        }

        res.status(200).json({
            success: true,
            data: {},
            message: 'Resume deleted'
        });

    } catch (error) {
        next(error)
    }
};

export {
    createResume, getResumes, getResume, getResumeForCandidate, updateResume, deleteResume
}