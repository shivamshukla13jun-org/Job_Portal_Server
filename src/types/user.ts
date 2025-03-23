import { Types } from "mongoose";
import { IFile } from "./file";

export type IUserContactAddress = {
    lane1: string;
    lane2: string;
    city: Types.ObjectId;
    state: Types.ObjectId;
    pin_code: number;
    country: Types.ObjectId;
};

export type IUserContact = {
    phone: number;
    permanent_address: IUserContactAddress;
    current_address?: IUserContactAddress;
};

export type IUserEducation = {
    name: string;
    // from: Date;
    to: Date;
    qualification: string;
    // certificate?: IFile;
};

export type IUserEmployment = {
    name: string;
    position: string;
    department: string;
    from: Date;
    categories: Types.ObjectId[];
    scope: string;
    to: Date;
    certificate?: IFile;
};

export type IUserReference = {
    name: string;
    email: string;
    phone: string;
    note: string;
};

export type IUserTestScore = {
    certification_attempted: string;
    recent_test: Date;
    test_score?: {
        listening: number;
        reading: number;
        writing: number;
        speaking: number;
        overall: number;
    }
    score_card?: IFile;
};