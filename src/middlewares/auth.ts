import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import Admin, { IAdmin } from '@/models/admin/admin.model';
import { AppError } from "./error";
import User, { IUser } from "@/models/admin/user.model";
import { JWT_EXPIRE, JWT_SECRET } from "@/config";
import { UserType } from "@/models/admin/userType.model";
import Candidate from "@/models/portal/candidate.model";

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

const generateToken = (
    user: IUser | IAdmin,
    expiresIn?: jwt.SignOptions['expiresIn']
): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const envExpire = process.env.JWT_EXPIRE;
    if (!envExpire && expiresIn === undefined) {
        throw new Error('JWT_EXPIRE is not defined in environment variables and no expiresIn was provided');
    }

    const expireValue: string | number = expiresIn ?? envExpire ?? '1h';
    const payload = { id: user._id };
    const signOptions: jwt.SignOptions = {
        expiresIn: expireValue as any
    };

    return jwt.sign(payload, secret, signOptions);
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
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
            console.log(error);
            next(error);
        }
    };
};

const verifyAdminToken = async (req: Request, res: Response, next: NextFunction) => {
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

    const user = await Admin.findById((decoded as jwt.JwtPayload).id);
    if (!user) {
        return next(new AppError('Unauthorized user', 403));
    }

    res.locals.userId = user._id as Types.ObjectId;
    next();
};

const verifyisCandidateLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bearer = req.headers["authorization"]
        if (!bearer) {
            return next();
        }
        const token = bearer?.split(" ")[1];

        let decoded:any
        try {
            decoded = jwt.verify(token, JWT_SECRET as string);
        } catch (jwtError) {
            return next(new AppError("Invalid or expired token", 401));
        }

        if (decoded) {
            res.locals.userId=decoded.id as Types.ObjectId
        }

        const user = await Candidate.findOne({userId:(decoded as jwt.JwtPayload).id});
        if (user) {
            res.locals.candidateId = user._id as Types.ObjectId;
        }

        
        next();

    } catch (error) {
        console.log(error)
        next(error);
    }
};

export const auth = verifyAdminToken;
export {
    generateToken,
    verifyUserTypeToken,
    verifyToken,
    verifyAdminToken,
    verifyisCandidateLogin
};