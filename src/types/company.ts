import { UUID } from "crypto";

export type IJobCandidate = {
    experience: string;
    salary_from: number | null;
    salary_to: number | null;
    bonus: boolean;
    job_info: string;
    skills: IJobSelect[];
};

export type IJobSelect = {
    value: string;
    label: string;
}

export type IJobPersonal = {
    info: string;
    assets: IJobSelect[]
}

export type IJobCompany = {
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    contact_person_profile: string;
    size_of_org: number;
    job_address: string;
    vacancy: string;
    id:UUID
}