import { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";

import { AppError } from "@/middlewares/error";
import CV, { ICV, ICVFile } from "@/models/candidate/cv.model";
import Candidate from "@/models/portal/candidate.model";
import { IFile } from "@/types/file";

/** 
 @desc    Create a CV
 @path    POST /api/v1/cv
 @access  Private
*/
const createCV = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cvs = req.files as unknown as IFile[];
        const id = res.locals.userId;

        const checkCandidate = await Candidate.findOne({ userId: id });
        if (!checkCandidate) {
            throw new AppError('Failed to find candidate', 400);
        }

        // Cast payload as Partial<ICV> or Document
        const payload: Partial<ICV> = {
            candidateId: checkCandidate._id as Types.ObjectId,
            cvs
        };

        const createCV = await CV.create(payload);
        if (!createCV) {
            throw new AppError("Failed to create CV", 400)
        }

        res.status(201).json({ success: true, data: createCV, message: "CV created!" })

    } catch (error) {
        next(error)
    }
}

/** 
 @desc    Get all CVs
 @path    GET /api/v1/cv
 @access  Private
*/
const getCVs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cvs = await CV.find()
        if (!cvs) {
            throw new AppError("Failed to fetch testimonial", 400);
        }

        res.status(200).json({ success: true, data: cvs, message: "CVs fetched!" })


    } catch (error) {
        next(error)
    }
}

/** 
 @desc    Get single CV
 @path    GET /api/v1/cv/:id
 @access  Private
*/
const getCV = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const checkCandidate = await Candidate.findOne({ userId: id });
        if (!checkCandidate) {
            throw new AppError('Failed to find candidate', 400);
        }

        const cv = await CV.findOne({ candidateId: checkCandidate._id });
        if (!cv) {
            throw new AppError("Failed to find cv!", 400)
        }

        res.status(200).json({ success: true, data: cv, message: "CV fetched!" })

    } catch (error) {
        next(error)
    }
}

/** 
 @desc    Update anCV
 @path    PUT /api/v1/cv/:id
 @access  Private
*/
const updateCV = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: ICV = JSON.parse(req.body.parse);
        const files = req.files as unknown as ICVFile;

        if (!(payload?.cvs?.length > 0 || files?.["cv[]"]?.length > 0)) {
            throw new AppError("Please upload some cv!", 400)
        }

        const checkCandidate = await Candidate.findOne({ userId: req.params.id });
        if (!checkCandidate) {
            throw new AppError("Failed to find candidate", 400)
        }
        payload["candidateId"] = checkCandidate._id as Types.ObjectId;

        const checkCV = await CV.findOne({ candidateId: checkCandidate._id })
        if (!checkCV) {
            payload["cvs"] = files["cv[]"].map(item => item);
            const createCV = await CV.create(payload);
            if (!createCV) {
                throw new AppError("Failed to create CV", 400)
            }
            res.status(201).json({ success: true, data: createCV, message: "CV created!" })
        } else {
            let fileIndex = 0;
            const updatedCVs = payload.cvs.map(item => {
                if (item && typeof item === 'object' && Object.keys(item).length > 0) {
                    return item;
                } else if (files["cv[]"] && files["cv[]"][fileIndex]) {
                    fileIndex++;
                    return files["cv[]"][fileIndex - 1];
                }
                return item;
            });

            // Add any remaining files
            while (files["cv[]"] && files["cv[]"][fileIndex]) {
                updatedCVs.push(files["cv[]"][fileIndex]);
                fileIndex++;
            }

            payload.cvs = updatedCVs;

            const updateCV = await CV.findByIdAndUpdate(checkCV._id, payload, { new: true, runValidators: true });
            if (!updateCV) {
                throw new AppError("Failed to update CV", 400)
            }
            res.status(200).json({ success: true, data: updateCV, message: "CV updated!" })
        }
    } catch (error) {
        console.log(error)
        next(error)
    }
}

/** 
 @desc    Delete anCV
 @path    DELETE /api/v1/cv/:id
 @access  Private
*/
const deleteCV = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const cv = await CV.findByIdAndDelete(id);
        if (!cv) {
            throw new AppError("Failed to fetch CV!", 400)
        }

        res.status(200).json({ success: true, data: {}, message: "CV deleted!" })

    } catch (error) {
        next(error)
    }
}

export {
    createCV, getCVs, getCV, updateCV, deleteCV
}