import { Schema, Document, Types, model } from "mongoose";
import { IUserContact, IUserEducation, IUserEmployment, IUserReference, IUserTestScore } from "@/types/user";
import { IFile } from "@/types/file";
import { IJobSelect } from "@/types/company";

export interface ICandidate extends Document {
    userId: Types.ObjectId;
    name: string;
    email: string;
    achievement:object;
    experience:number;
    currentsalary?:number;
    expectedsalary:number;
    gender: 'Male' | 'Female' | 'Other' | 'Others';
    dob: Date;
    scope: string;
    marital_status: 'Married' | 'Unmarried';
    profile: IFile;
    cv: IFile;
    designation:string;
    contact: IUserContact;
    education: IUserEducation[];
    employment: IUserEmployment[];
    references: IUserReference[];
    english_language: IUserTestScore;
    hear_about_us: string[];
    public_resume: boolean;
    companies_resume_visible: Types.ObjectId[];
    coverletter:string,
    isresume:boolean
    current_company?:Types.ObjectId[]
};
export interface IContactUs extends Document {
    username: string;
    email: string;
    subject:string;
    message:string,
};

const candidateSchema = new Schema<ICandidate>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other','Others']
    },
    experience: {
        type: Number,
        required: [true, 'experience is required'],
        default:0
    },
    expectedsalary: {
        type: Number,
        required: [true, 'Expected Salary is required'],
        default:1
    },
    currentsalary: {
        type: Number,
        // required: [true, 'Current Salary is required'],
        default:0
    },
    
    dob: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    current_company:[{
        type:Types.ObjectId,
        ref:"Employer"
    }],
    marital_status: {
        type: String,
        required: [true, 'Marital Status is required'],
        enum: ['Married', 'Unmarried']
    },
    profile: { type: Object },
    cv: { type: Object },
  
    designation:{type:String,required: [true, 'Designation is required'],},
    contact: {
        email: {
            type: String,
            required: [true, 'Email is required'],
        },
        phone: {
            type: String,
            min: [10, 'Please enter valid 10 digit phone number'],
            max: [10, 'Please enter valid 10 digit phone number'],
            required: [true, 'Phone number is required']
        },
        permanent_address: {
            lane1: {
                type: String,
                required: [true, 'Lane 1 is required']
            },
            lane2: {
                type: String,
                required: [true, 'Lane 2 is required']
            },
            city: {
                type: Types.ObjectId,
                ref:'City',
                required: [true, 'City is required']
            },
            state: {
                type: Types.ObjectId,
                ref:'State',
                required: [true, 'State is required']
            },
            pin_code: {
                type: Number,
                required: [true, 'Pin code is required']
            },
            country: {
                type: String,
                ref:'Country',
                required: [true, 'Country is required']
            },
        },
        current_address: {
            lane1: {
                type: String,
                default: null,
            },
            lane2: {
                type: String,
                default: null,
            },
            city: {
                type: Types.ObjectId,
                ref:'City',
                default: null,
            },
            state: {
                type: Types.ObjectId,
                ref:'State',
                default: null,
            },
            pin_code: {
                type: Number,
                default: null,
            },
            country: {
                type: Types.ObjectId,
                default: null,
                ref:'Country'
            },
        },
    },
    education: [
        {
            name: {
                type: String,
                required: [true, 'Education name is required']
            },
            to: {
                type: Date,
                required: [true, 'Passing Year is required']
            },
            qualification: {
                type: String,
                required: [true, 'Qualification is required']
            },
          
        }
    ],
    employment: [
        {
            name: {
                type: String,
                required: [true, 'Education name is required']
            },
            position: {
                type: String,
                required: [true, 'Position is required']
            },
            department: {
                type: String,
                required: [true, 'Department is required']
            },
            
            from: {
                type: Date,
                required: [true, 'From is required']
            },
          
            categories: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'JobCategory'
                }
            ],
            scope: {
                type: String,
                required: [true, 'scope is required']
            },
            to: {
                type: Date,
                required: [true, 'To is required']
            },
        }
    ],
    achievement: [
        {
            type: Object
        }
    ],
    references: [
        {
            name: {
                type: String,
                required: [true, 'Reference name is required']
            },
            email: {
                type: String,
                required: [true, 'Reference email is required']
            },
            phone: {
                type: String,
                required: [true, 'Reference phone is required']
            },
            note: {
                type: String,
                required: [true, 'Reference note is required']
            }
        }
    ],
    hear_about_us: [
        {
            type: String,
            required: [true, 'Hear about us is requied']
        }
    ],
    public_resume: {
        type: Boolean,
        default: false
    },
    companies_resume_visible: [
        {
            type: Schema.Types.ObjectId
        }
    ],
    isresume:{
        type:Boolean,
        default:false
    },


}, { timestamps: true });

const Candidate = model<ICandidate>("Candidate", candidateSchema)

export default Candidate;