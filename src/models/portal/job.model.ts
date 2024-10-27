import  { Schema, Document, Types, model } from "mongoose";
import { IJobCandidate, IJobCompany, IJobPersonal, IJobSelect } from "@/types/company";
import crypto from 'crypto';

export type IJobCandidateStatus = {
    candidateId: Types.ObjectId;
    date: Date;
}

export interface IJob extends Document {
    employerId: Types.ObjectId;
    title: string;
    location: string;
    place: string;
    opening: number;
    jobtype:string,
    age: number;
    candidate_requirement: IJobCandidate;
    categories: IJobSelect[];
    personal_info: IJobPersonal[];
    timing: {
        job: string;
        interview: string;
    }
    company: IJobCompany;
    candidate_shortlisted?: IJobCandidateStatus[];
    applications?: Types.ObjectId[];
    candidate_applied?: IJobCandidateStatus[];
    candidate_rejected?: IJobCandidateStatus[];
    isActive?: boolean;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
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
        type: String,
        required: [true, "Location is required"]
    },
    categories: [
        {
            value: {
                type: String,
                required: [true, "Category value is required in candidate requirement."]
            },
            label: {
                type: String,
                required: [true, "Category label is required in candidate requirement."]
            }
        }
    ],
    place: {
        type: String,
        required: [true, "Place is required"]
    },
    opening: {
        type: Number,
        required: [true, "Opening is required"]
    },
    jobtype: {
        type: String,
        enum:[ "freelancer", "full-time", "part-time", "temporary" ],
        required: [true, "Job Type is required"]
    },
    age: {
        type: Number,
        required: [true, 'Age is required']
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
                value: {
                    type: String,
                    required: [true, "Value is required in candidate requirement."]
                },
                label: {
                    type: String,
                    required: [true, "Label is required in candidate requirement."]
                }
            }
        ],
    },
    personal_info: [
        {
            info: {
                type: String,
                required: [true, "Info is required"]
            },
            assets: [
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
            ]
        }
    ],
    timing: {
        job: {
            type: String,
            required: [true, "Job timing is required"]
        },
        interview: {
            type: String,
            required: [true, "Interview timing is required"]
        }
    },
    company: {
        name: {
            type: String,
            required: [true, "Name is required"]
        },
        contact_person: {
            type: String,
            required: [true, "Contact person is required"]
        },
        phone: {
            type: String,
            required: [true, "Phone is required"]
        },
        email: {
            type: String,
            required: [true, "Email is required"]
        },
        contact_person_profile: {
            type: String,
            required: [true, "Contact person profile is required"]
        },
        size_of_org: {
            type: Number,
            required: [true, "Size of organisation is required"]
        },
        job_address: {
            type: String,
            required: [true, "Job address is required"]
        },
        vacancy: {
            type: String,
            required: [true, "Vacancy is required"]
        },
        id:{
            type:Schema.Types.UUID,
            default: () => crypto.randomUUID(),  // Generate a UUID using crypto

        }
    },
    applications: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Application',
        }
    ],
    candidate_applied: [
        {
            candidateId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            date: { type: Date, required: true }
        }
    ],
    candidate_shortlisted: [
        {
            candidateId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            date: { type: Date, required: true }
        }
    ],
    candidate_rejected: [
        {
            candidateId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            date: { type: Date, required: true }
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const Job = model<IJob>("Job", jobSchema);

export default Job;