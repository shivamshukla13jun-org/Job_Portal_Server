import { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import Employer, { IEmployer, IEmployerFiles } from "@/models/portal/employer.model";
import { AppError } from "@/middlewares/error";
import { validateEmployer } from "@/validations/employer";

/**
 @desc      Create an employer
 @route     POST /api/v1/employer
 @access    Public
**/
const createEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IEmployer = req.body;

        payload["email"] = payload.email.toLowerCase();
        payload["userId"] = new Types.ObjectId(res.locals.userId);

        const employer = await Employer.create(payload);
        if (!employer) {
            throw new AppError('Failed to create employer', 400);
        }

        res.status(201).json({
            success: true,
            message: 'employer created!',
            data: employer
        })

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Get all employer
 @route     POST /api/v1/employer
 @access    Public
**/
const getEmployers = async (req: Request, res: Response, next: NextFunction) => {
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

        const employers = await Employer.aggregate([
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
            message: 'employer fetched!',
            data: employers[0]?.data || [],
            count: employers[0]?.total[0]?.count || 0,
        })

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Get an employer
 @route     POST /api/v1/employer/:id
 @access    Public
**/
const getEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const employer = await Employer.findOne({ userId: id });
        if (!employer) {
            throw new AppError('Failed to find employer', 400);
        }

        res.status(200).json({
            success: true,
            data: employer,
            message: 'employer fetched'
        });

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Update an employer
 @route     PUT /api/v1/employer/:id
 @access    Public
**/
const updateEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IEmployer = JSON.parse(req.body.parse);
        const files = req.files as unknown as IEmployerFiles;
       
        payload["email"] = payload.email.toLowerCase();
        const checkEmailExist = await Employer.findOne({ email: payload["email"] });
        
        if (checkEmailExist) {
            // Check if the existing email belongs to a different user
            if (!checkEmailExist.userId.equals(req.params.id)) {
                throw new AppError('Email already registered, please use a different email!', 400);
            }
        }
        // formatting the payload
        payload.logo = files?.logo?.[0] || payload?.logo;
        payload.videos = files?.["video[]"]?.[0] || payload?.videos;
        payload.pictures = files?.["picture[]"]?.[0] || payload?.pictures;

        // validate the data
        const check = await validateEmployer(payload);
        if (!check) {
            return;
        }

        const checkEmployer = await Employer.findOne({ userId: new Types.ObjectId(req.params.id) })
        if (!checkEmployer) {
            payload["userId"] = new Types.ObjectId(res.locals.userId);
            const newEmployer = await Employer.create(payload);
            if (!newEmployer) {
                throw new AppError('Failed to create employer', 400);
            }
            return res.status(201).json({
                success: true,
                message: 'Employer created!',
                data: newEmployer
            });
        };

        const employer = await Employer.findByIdAndUpdate(checkEmployer._id, payload, { new: true, runValidators: true })
        if (!employer) {
            throw new AppError('Failed to update employer', 400)
        }

        res.status(200).json({
            success: true,
            message: 'Employer updated!',
            data: employer
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
};

/**
 @desc      Delete an employer
 @route     DELETE /api/v1/employer/:id
 @access    Public
**/
const deleteEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const employer = await Employer.findByIdAndDelete(id);
        if (!employer) {
            throw new AppError('Failed to find employer', 400);
        }

        res.status(200).json({
            success: true,
            data: {},
            message: 'employer deleted'
        });

    } catch (error) {
        next(error)
    }
};

export {
    createEmployer, getEmployers, getEmployer, updateEmployer, deleteEmployer
}