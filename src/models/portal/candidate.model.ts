import { Schema, Document, Types, model } from "mongoose";
import { IUserContact, IUserEducation, IUserEmployment, IUserReference, IUserTestScore } from "@/types/user";
import { IFile } from "@/types/file";

export interface ICandidate extends Document {
    userId: Types.ObjectId;
    name: string;
    email: string;
    gender: 'Male' | 'Female' | 'Other';
    dob: Date;
    marital_status: 'Married' | 'Unmarried';
    profile: IFile;
    cv: IFile;
    contact: IUserContact;
    education: IUserEducation[];
    registration_certificate: IFile;
    employment: IUserEmployment[];
    references: IUserReference[];
    english_language: IUserTestScore;
    hear_about_us: string[];
    public_resume: boolean;
    companies_resume_visible: Types.ObjectId[];
    isresume:boolean
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
        enum: ['Male', 'Female', 'Other']
    },
    dob: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    marital_status: {
        type: String,
        required: [true, 'Marital Status is required'],
        enum: ['Married', 'Unmarried']
    },
    profile: { type: Object },
    cv: { type: Object },
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
                type: String,
                required: [true, 'City is required']
            },
            state: {
                type: String,
                required: [true, 'State is required']
            },
            pin_code: {
                type: Number,
                required: [true, 'Pin code is required']
            },
            country: {
                type: String,
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
                type: String,
                default: null,
            },
            state: {
                type: String,
                default: null,
            },
            pin_code: {
                type: Number,
                default: null,
            },
            country: {
                type: String,
                default: null,
            },
        },
    },
    education: [
        {
            name: {
                type: String,
                required: [true, 'Education name is required']
            },
            from: {
                type: Date,
                required: [true, 'From is required']
            },
            to: {
                type: Date,
                required: [true, 'To is required']
            },
            qualification: {
                type: String,
                required: [true, 'Qualification is required']
            },
            certificate: {
                type: Object,
                required: [true, 'Certificate is required']
            }
        }
    ],
    registration_certificate: { type: Object },
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
            to: {
                type: Date,
                required: [true, 'To is required']
            },
            certificate: {
                type: Object,
            }
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
    english_language: {
        certification_attempted: {
            type: String,
            required: [true, 'Certification attempted is required']
        },
        recent_test: {
            type: Date,
            required: [true, 'Recent test is required']
        },
        test_score: {
            listening: {
                type: Number,
                required: [true, 'Listening is required']
            },
            reading: {
                type: Number,
                required: [true, 'Reading is required']
            },
            writing: {
                type: Number,
                required: [true, 'Writing is required']
            },
            speaking: {
                type: Number,
                required: [true, 'Speaking is required']
            },
            overall: {
                type: Number,
                required: [true, 'Overall is required']
            }
        },
        score_card: { type: Object }
    },
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
    }

}, { timestamps: true });

const Candidate = model<ICandidate>("Candidate", candidateSchema)

export default Candidate;