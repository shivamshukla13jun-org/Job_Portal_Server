import { AppError } from "@/middlewares/error";
import { IResume } from "@/models/candidate/resume.model";
import { NextFunction, Request, Response } from "express";
import * as Yup from "yup"

const resumeSchema = Yup.object().shape({
    description: Yup.string().required('Description is required'),
    educations: Yup.array().of(
        Yup.object().shape({
            degree: Yup.string().required('Degree is required'),
            university: Yup.string().required('University is required'),
            start_date: Yup.date().required('Start date is required'),
            end_date: Yup.date().required('End date is required'),
            description: Yup.string().required('Description is required'),
        }).required('Education entry is required')
    ).required('Education is required'),
    work_experiences: Yup.array().of(
        Yup.object().shape({
            position: Yup.string().required('Position is required'),
            company_name: Yup.string().required('Company name is required'),
            start_date: Yup.date().required('Start date is required'),
            end_date: Yup.date().required('End date is required'),
            description: Yup.string().required('Description is required'),
        }).required('Work experience entry is required')
    ).required('Work experience is required'),
    portfolio: Yup.mixed().required('Portfolio upload is required').test('is-file-or-object', 'Portfolio upload must be a file', value => value instanceof File || typeof value === 'object'),
    portfoliolink: Yup.string().url().label("portfolio link"),
    awards: Yup.array().of(
        Yup.object().shape({
            award_name: Yup.string().required('Award name is required'),
            start_date: Yup.date().required('Start date is required'),
            end_date: Yup.date().required('End date is required'),
            description: Yup.string().required('Description is required'),
        }).required('Award entry is required')
    ).required('Awards are required'),
    skills: Yup.array().of(
        Yup.object().shape({
            label: Yup.string().required('Skill label is required'),
            value: Yup.string().required('Skill value is required'),
        }).required('Skill entry is required')
    ).required('Skills are required'),
    current_salary: Yup.number().required('Current salary is required').min(1, 'Current salary should be greater than 1'),
    expected_salary: Yup.number().required('Expected salary is required').min(1, 'Expected salary should be greater than 1'),
    languages: Yup.array().of(
        Yup.object().shape({
            label: Yup.string().required('Language label is required'),
            value: Yup.string().required('Language value is required'),
        }).required('Language entry is required')
    ).required('Languages are required'),
    social_media: Yup.object().shape({
        twitter: Yup.string().url('Invalid Twitter URL').required('Twitter URL is required'),
        linkedIn: Yup.string().url('Invalid LinkedIn URL').required('LinkedIn URL is required'),
    }).required('Social media information is required'),
});


const validateResumeApi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await resumeSchema.validate(req.body, { abortEarly: true });
        next();
    } catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};

const validateResume = async (payload: IResume) => {
    try {
        await resumeSchema.validate(payload, { abortEarly: true });
        return true;
    } catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};

export { validateResumeApi, validateResume };