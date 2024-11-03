import { Schema, Document, Types, model } from "mongoose";
import { IFile } from "@/types/file";
import { IJobSelect } from "@/types/company";
import { IResumeAward, IResumeEducation, IResumeWorkExperience } from "@/types/candidate";

export interface IResume extends Document {
    candidateId: Types.ObjectId;
    description: string;
    isresume:boolean,
    educations: IResumeEducation[];
    work_experiences: IResumeWorkExperience[];
    portfolio: IFile;
    portfoliolink:string,
    awards: IResumeAward[];
    skills: IJobSelect[];
    current_salary: number;
    expected_salary: number;
    languages: IJobSelect[];
    social_media: {
        twitter: string;
        linkedIn: string;
    }
};

const resumeSchema = new Schema<IResume>({
    candidateId: {
        type: Schema.Types.ObjectId,
        ref: 'Candidate'
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    educations: [
        {
            degree: {
                type: String,
                required: ['Education degree is required']
            },
            university: {
                type: String,
                required: ['Education university is required']
            },
            start_date: {
                type: String,
                required: ['Education start date is required']
            },
            end_date: {
                type: String,
                required: ['Education end date is required']
            },
            description: {
                type: String,
                required: ['Education description is required']
            }
        }
    ],
    work_experiences: [
        {
            position: {
                type: String,
                required: ['Work experience position is required']
            },
            company_name: {
                type: String,
                required: ['Work experience company name is required']
            },
            start_date: {
                type: String,
                required: ['Work experience start date is required']
            },
            end_date: {
                type: String,
                required: ['Work experience end date is required']
            },
            description: {
                type: String,
                required: ['Work experience description is required']
            }
        }
    ],
    portfolio: {
        type: Object,
        required: [true, 'Portfolio is required']
    },
    portfoliolink: {
        type: String,
        default:""
    },
    awards: [
        {
            award_name: {
                type: String,
                required: ['Award name is required']
            },
            start_date: {
                type: String,
                required: ['Award start date is required']
            },
            end_date: {
                type: String,
                required: ['Award end date is required']
            },
            description: {
                type: String,
                required: ['Award description is required']
            }
        }
    ],
    skills: [
        {
            label: {
                type: String,
                required: ['Skill label is required']
            },
            value: {
                type: String,
                required: ['Skill value is required']
            }
        }
    ],
    current_salary: {
        type: Number,
        required: [true, 'Current Salary is required'],
    },
    expected_salary: {
        type: Number,
        required: [true, 'Expected Salary is required'],
    },
    languages: [
        {
            label: {
                type: String,
                required: ['Language label is required']
            },
            value: {
                type: String,
                required: ['Language value is required']
            }
        }
    ],
    social_media: {
        twitter: {
            type: String,
            required: [true, 'Twitter is required']
        },
        linkedIn: {
            type: String,
            required: [true, 'LinkedIn is required']
        }
    }
}, { timestamps: true });

const Resume = model<IResume>("Resume", resumeSchema)

export default Resume;