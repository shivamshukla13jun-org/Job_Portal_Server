import { IFile } from "./file"

export type ICandidateFiles = {
    upload_cv: IFile[],
    profile: IFile[];
    // registration_certificate: IFile[],
    score_card: IFile[],
    "certificate[]": IFile[];
};

export type IResumeEducation = {
    degree: string;
    university: string;
    start_date: Date;
    end_date: Date;
    description: string;
};
export type IResumeWorkExperience = {
    position: string;
    company_name: string;
    start_date: Date;
    end_date: Date;
    description: string;
};
export type IResumeAward = {
    award_name: string;
    start_date: Date;
    end_date: Date;
    description: string;
};

