import { Schema, Document, Types, model } from "mongoose";
import { IUserContactAddress } from "@/types/user";
import { IFile } from "@/types/file";
import { IJobSelect } from "@/types/company";

export interface IEmployer extends Document {
    userId: Types.ObjectId;
    business_name: string;
    name: string;
    email: string;
    business_gst: string;
    categories: Types.ObjectId[];
    phone_area: string;
    phone: string;
    address: IUserContactAddress;
    product_services: string;
    url: string;
    year_established: Date;
    keywords: string;
    logo: IFile;
    videos: IFile;
    pictures: IFile;
    jobs: Types.ObjectId[];
    isBlocked: boolean;
};

export type IEmployerFiles = {
    logo: IFile[];
    "video[]": IFile[];
    "picture[]": IFile[];
}

const employerSchema = new Schema<IEmployer>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required']
    },
    business_name: {
        type: String,
        required: [true, 'Business name is required']
    },
    business_gst: {
        type: String,
        required: [true, 'Business gst is required']
    },
    categories: [
        {
            type: Schema.Types.ObjectId,
            ref: 'JobCategory'
        }
    ],
    
    phone_area: {
        type: String,
        required: [true, 'Phone area is required']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    address: {
        lane1: {
            type: String,
            required: [true, 'Address Lane 1 is required']
        },
        lane2: {
            type: String,
            required: [true, 'Address Lane 2 is required']
        },
        city: {
            type: Schema.Types.ObjectId,
            ref: 'City',
            required: [true, 'Address City is required']
        },
        state: {
            type: Schema.Types.ObjectId,
            ref: 'State',
            required: [true, 'Address State is required']
        },
        pin_code: {
            type: Number,
            required: [true, 'Address Pin code is required']
        },
        country: {
            type: Schema.Types.ObjectId,
            ref: 'Country',
            required: [true, 'Country is required']
        },
    },
    product_services: {
        type: String,
        required: [true, 'Product services is required']
    },
    url: {
        type: String,
        required: [true, 'URL is required']
    },
    year_established: {
        type: Date,
        required: [true, 'Year established is required']
    },
    keywords: {
        type: String,
        required: [true, 'Keywords is required']
    },
    logo: { type: Object },
    videos: { type: Object },
    pictures: { type: Object },
    jobs: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Job'
        }
    ],
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Employer = model<IEmployer>("Employer", employerSchema);

export default Employer;