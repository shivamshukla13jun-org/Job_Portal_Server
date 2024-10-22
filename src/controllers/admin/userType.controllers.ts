import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

import { AppError } from "@/middlewares/error";
import { IUserType, UserType } from "@/models/admin/userType.model";

// @desc    Create a userType
// @path    POST /api/v1/userType
// @access  Admin
const addUserType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IUserType = req.body;
        const id = res.locals.userId;

        const userType = await UserType.create(payload);

        if (!userType) {
            throw new AppError("Failed to create userType", 400);
        }

        res.status(201).json({ success: true, data: userType, message: "UserType created!" })

    } catch (error) {
        next(error)
    }
}

/**
    @desc   Get public usertypes
    @path   GET /api/v1/userType/type
    @access Public
**/
const getPublicUserType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userType = await UserType.find({ forAdmin: false })
        if (!userType) {
            throw new AppError("Failed to fetch userType", 400);
        }

        res.status(200).json({ success: true, data: userType, message: "UserType fetched!" })

    } catch (error) {
        next(error)
    }
}

// @desc    Get all userTypes
// @path    GET /api/v1/userType
// @access  Admin
const getUserTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userType = await UserType.find()
        if (!userType) {
            throw new AppError("Failed to fetch userType", 400);
        }

        res.status(200).json({ success: true, data: userType, message: "UserType fetched!" })

    } catch (error) {
        next(error)
    }
}

// @desc    Get single userType
// @path    GET /api/v1/userType/:id
// @access  Admin
const getUserType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.params.id;
        const userType = await UserType.findById(payload)
        if (!userType) {
            throw new AppError("Failed to fetch userType", 400);
        }

        res.status(200).json({ success: true, data: userType, message: "UserType fetched!" })

    } catch (error) {
        next(error)
    }
}

// @desc    Update a userType
// @path    PUT /api/v1/userType/:id
// @access  Admin
const updateUserType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IUserType = req.body;
        const id = res.locals.userId;

        const checkuserType = await UserType.findById(req.params.id);
        if (!checkuserType) {
            throw new AppError("Couldn't find userType", 400);
        }

        const userType = await UserType.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });

        if (!userType) {
            throw new AppError("Failed to update userType", 400);
        }

        res.status(201).json({ success: true, data: userType, message: "UserType updated!" })

    } catch (error) {
        next(error)
    }
}

// @desc    Delete single userType
// @path    DELETE /api/v1/userType/:id
// @access  Admin
const deleteUserType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.params.id;
        const userType = await UserType.findByIdAndDelete(payload)
        if (!userType) {
            throw new AppError("Failed to find userType", 400);
        }

        res.status(200).json({ success: true, data: userType, message: "UserType deleted!" })

    } catch (error) {
        next(error)
    }
}

export {
    addUserType, getUserTypes, getPublicUserType, getUserType, updateUserType, deleteUserType
}