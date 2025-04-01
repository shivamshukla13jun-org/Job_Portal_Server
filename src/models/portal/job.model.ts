import { Schema, Document, Types, model } from "mongoose";
import { IJobCandidate, IJobCompany, IJobPersonal, IJobSelect } from "@/types/company";

export type IJobCandidateStatus = {
    candidateId: Types.ObjectId;
    date: Date;
}

export interface IInterviewDetails {
    date: Date;
    time: string;
    location: string;
    type: 'in_person' | 'online' | 'phone';
    notes?: string;
}

export interface IJob extends Document {
    employerId: Types.ObjectId;
    subscription: Types.ObjectId;
    title: string;
    location: Types.ObjectId;
    place: Types.ObjectId;
    opening: number;
    jobtype: string;
    candidate_requirement: IJobCandidate;
    categories: Types.ObjectId[];
    personal_info: IJobPersonal[];
    timing: {
        job: string;
        interview: string;
    }
    company: IJobCompany;
    applications?: Types.ObjectId[];
    isActive?: boolean;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    isFeatured: boolean;
    deadline: Date;
    preferredLanguage: IJobSelect[];
    degrees?: Types.ObjectId[];  // Reference to Degree model
    industries?: Types.ObjectId[];  // Reference to Industry model
}

const jobSchema = new Schema<IJob>({
    employerId: {
        type: Schema.Types.ObjectId,
        ref: 'Employer'
    },
    title: {
        type: String,
        required: [true, "Title is required"]
    },
    location: {
        type: Schema.Types.ObjectId,
        ref: 'State',
        required: [true, "State is required"]
    },
    place: {
        type: Schema.Types.ObjectId,
        ref: 'City',
        required: [true, "City is required"]
    },
    categories: [
        {
            type: Schema.Types.ObjectId,
            ref: 'JobCategory'
        }
    ],
    opening: {
        type: Number,
        required: [true, "Opening is required"]
    },
    jobtype: {
        type: String,
        enum: ["freelancer", "full-time", "part-time", "temporary"],
        required: [true, "Job Type is required"]
    },
    candidate_requirement: {
        experience: {
            type: Number,
            required: [true, "Experience is required"]
        },
        salary_from: {
            type: Number,
            required: [true, "Salary from is required"]
        },
        salary_to: {
            type: Number,
            required: [true, "Salary to is required"]
        },
        bonus: {
            type: Boolean,
            required: [true, "Bonus is required"]
        },
        job_info: {
            type: String,
            required: [true, "Job Information is required"]
        },
        skills: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Skill'
            }       
        ],
    },
    personal_info: [
        {
            info: {
                type: String,
                // required: [true, "Info is required"]
            },
            assets: [
                {
                    value: {
                        type: String,
                        // required: [true, "Value is required in personal information."]
                    },
                    label: {
                        type: String,
                        // required: [true, "Label is required in personal information."]
                    }
                }
            ]
        }
    ],
    applications: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Application',
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    subscription: {
        type: Schema.Types.ObjectId,
        ref: 'subscriptions',
        // unique: true,
        required: [true, "Package is Required"]
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    deadline: {
        type: Date,
        default: () => new Date(new Date().setMonth(new Date().getMonth() + 2))
    },
    preferredLanguage: [
        {
            value: {
                type: String,
                required: [true, "Value is required in personal information."]
            },
            label: {
                type: String,
                required: [true, "Label is required in personal information."]
            }
        }
    ],
    degrees: [{
        type: Schema.Types.ObjectId,
        ref: 'Degree'
    }],
    industries: [{
        type: Schema.Types.ObjectId,
        ref: 'Industry'
    }]
}, { timestamps: true });

const Job = model<IJob>("Job", jobSchema);

export default Job;