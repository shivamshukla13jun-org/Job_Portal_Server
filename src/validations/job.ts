import * as Yup from "yup"
import { NextFunction, Request, Response } from "express";

import { AppError } from "@/middlewares/error";
import { IJob } from "@/models/portal/job.model";

const jobSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    location: Yup.string().required('Location is required'),
    place: Yup.string().required('Place is required'),
    categories: Yup.array().of(
        Yup.object().shape({
            value: Yup.string().required('Category value is required'),
            label: Yup.string().required('Category label is required'),
        })
    ).min(1, 'At least one category is required'),
    opening: Yup.number().required('Opening is required').min(1, 'Opening must be at least 1'),
    age: Yup.number().required('Age is required'),
    candidate_requirement: Yup.object().shape({
        experience: Yup.number().required('Experience is required'),
        salary_from: Yup.number().required('Salary from is required').min(0, 'Salary must be a positive number'),
        salary_to: Yup.number().required('Salary to is required').min(Yup.ref('salary_from'), 'Salary to must be greater than or equal to Salary from'),
        bonus: Yup.boolean().required('Bonus is required'),
        job_info: Yup.string().required('Job info is required'),
        skills: Yup.array().of(
            Yup.object().shape({
                value: Yup.string().required('Skill value is required'),
                label: Yup.string().required('Skill label is required'),
            })
        ).min(1, 'At least one skill is required'),
    }),
    personal_info: Yup.array().of(
        Yup.object().shape({
            info: Yup.string().required('Info is required'),
            assets: Yup.array().of(
                Yup.object().shape({
                    value: Yup.string().required('Skill value is required'),
                    label: Yup.string().required('Skill label is required'),
                })
            ).min(1, 'At least one skill is required'),
        })
    ).required('Personal info is required').min(1, 'At least one personal info is required'),
    timing: Yup.object().shape({
        job: Yup.string().required('Job timing is required'),
        interview: Yup.string().required('Interview timing is required'),
    }),
    company: Yup.object().shape({
        name: Yup.string().required('Company name is required'),
        contact_person: Yup.string().required('Contact person is required'),
        phone: Yup.string().required('Phone is required'),
        email: Yup.string().email('Invalid email format').required('Email is required'),
        contact_person_profile: Yup.string().required('Contact person profile is required'),
        size_of_org: Yup.number().required('Size of organization is required').min(1, 'Size must be at least 1'),
        job_address: Yup.string().required('Job address is required'),
        vacancy: Yup.string().required('Vacancy is required'),
    }),
});


const validateJobApi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await jobSchema.validate(req.body, { abortEarly: true });
        next();
    } catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};

const validateJob = async (payload: IJob) => {
    try {
        await jobSchema.validate(payload, { abortEarly: true });
        return true;
    } catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};

export { validateJobApi, validateJob };