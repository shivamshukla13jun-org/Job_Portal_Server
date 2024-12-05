
import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { Types } from "mongoose";
import {IAdmin} from '@/models/admin/admin.model';

import { AppError } from "./error"
import User, { IUser } from "@/models/admin/user.model";
import { JWT_EXPIRE, JWT_SECRET } from "@/config";
import { UserType } from "@/models/admin/userType.model";

// Extend the Response.locals interface to include userId
declare global {
    namespace Express {
        interface Locals {
            userId?: Types.ObjectId;
            candidateId?: Types.ObjectId;
            employerId?: Types.ObjectId;
        }
    }
}

const generateToken = (user: IUser| IAdmin,expiresIn?:string) => {
    const token = jwt.sign({ id: user._id }, JWT_SECRET!, { expiresIn: expiresIn || JWT_EXPIRE });
    return token;
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bearer = req.headers["authorization"]
        if (!bearer) {
            return next(new AppError("No token found", 401));
        }
        const token = bearer?.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET as string);
        } catch (jwtError) {
            return next(new AppError("Invalid or expired token", 401));
        }

        if (!decoded) {
            return next(new AppError("Unauthorized user", 403));
        }

        const user = await User.findById((decoded as jwt.JwtPayload).id);
        if (!user) {
            return next(new AppError('Unauthorized user', 403));
        }

        res.locals.userId = user._id as Types.ObjectId;
        next();

    } catch (error) {
        next(error);
    }
};
const verifyisCandidateLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bearer = req.headers["authorization"]
        if (!bearer) {
            return next();
        }
        const token = bearer?.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET as string);
        } catch (jwtError) {
            return next(new AppError("Invalid or expired token", 401));
        }

        if (!decoded) {
            return next(new AppError("Unauthorized user", 403));
        }

        const user = await User.findById((decoded as jwt.JwtPayload).id);
        if (!user) {
            return next(new AppError('Unauthorized user', 403));
        }

        res.locals.userId = user._id as Types.ObjectId;
        next();

    } catch (error) {
        next(error);
    }
};

const verifyUserTypeToken = (userType: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bearer = req.headers["authorization"];
            if (!bearer) {
                return next(new AppError("No token found", 401));
            }
            const token = bearer?.split(" ")[1];

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET as string);
            } catch (jwtError) {
                return next(new AppError("Invalid or expired token", 401));
            }

            if (!decoded) {
                return next(new AppError("Unauthorized user", 403));
            }

            const user = await User.findById((decoded as jwt.JwtPayload).id);
            if (!user) {
                return next(new AppError('Unauthorized user', 403));
            }

            const checkUserType = await UserType.findById(user.userType);
            if (!checkUserType) {
                return next(new AppError('Invalid usertype', 403));
            }

            if (!userType.map(type => type.toLowerCase()).includes(checkUserType.name.toLowerCase())) {
                return next(new AppError("User type not authorized!", 403));
            }

            res.locals.userId = user._id as Types.ObjectId;
            next();

        } catch (error) {
            console.log(error)
            next(error);
        }
    };
};

export {
    generateToken,
    verifyUserTypeToken,
    verifyToken,verifyisCandidateLogin
}