import { AppError } from "@/middlewares/error";
import { ICandidate } from "@/models/portal/candidate.model";
import { NextFunction, Request, Response } from "express";
import * as Yup from "yup"

const candidateSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    gender: Yup.string().required('Gender is required'),
    dob: Yup.date().required('Date of birth is required').nullable(),
    marital_status: Yup.string().required('Marital status is required'),
    contact: Yup.object().shape({
        phone: Yup.string().required('Phone number is required'),
        permanent_address: Yup.object().shape({
            lane1: Yup.string().required('Lane 1 is required'),
            lane2: Yup.string(),
            city: Yup.string().required('City is required'),
            state: Yup.string().required('State is required'),
            pin_code: Yup.number().required('Pin code is required'),
            country: Yup.string().required('Country is required')
        }),
        current_address: Yup.object().shape({
            lane1: Yup.string().optional(),
            lane2: Yup.string().optional(),
            city: Yup.string().optional(),
            state: Yup.string().optional(),
            pin_code: Yup.number().optional(),
            country: Yup.string().optional(),
        }),
    }),
    education: Yup.array().of(
        Yup.object().shape({
            name: Yup.string().required('Institution name is required'),
            from: Yup.date().required('Start date is required'),
            to: Yup.date().required('End date is required'),
            qualification: Yup.string().required('Qualification is required'),
            certificate: Yup.mixed().required('Certificate is required')
        })
    ),
    employment: Yup.array().of(
        Yup.object().shape({
            name: Yup.string().required('Company name is required'),
            position: Yup.string().required('Position is required'),
            department: Yup.string().required('Department is required'),
            from: Yup.date().required('Start date is required'),
            to: Yup.date().required('End date is required'),
        })
    ),
    references: Yup.array().of(
        Yup.object().shape({
            name: Yup.string().required('Reference name is required'),
            email: Yup.string().email('Invalid email').required('Email is required'),
            phone: Yup.string().required('Phone number is required'),
            note: Yup.string()
        })
    ),
    english_language: Yup.object().shape({
        certification_attempted: Yup.string().required('Certification attempted is required'),
        recent_test: Yup.date().required('Recent test is required'),
        test_score: Yup.object().shape({
            listening: Yup.number().required('Listening score is required'),
            reading: Yup.number().required('Reading score is required'),
            writing: Yup.number().required('Writing score is required'),
            speaking: Yup.number().required('Speaking score is required'),
            overall: Yup.number().required('Overall score is required')
        }),
        score_card: Yup.mixed().required('Score card upload is required'),
    }),
    hear_about_us: Yup.array().of(Yup.string()).required('Please specify how you heard about us'),
    coverletter:Yup.string().required('Please add cover letter'),
    cv: Yup.mixed().required('CV upload is required'),
    profile: Yup.mixed().required('Profile upload is required'),
    registration_certificate: Yup.mixed().required('Registration certificate is required'),
});


const validateCandidateApi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await candidateSchema.validate(req.body, { abortEarly: true });
        next();
    } catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};

const validateCandidate = async (payload: ICandidate) => {
    try {
        await candidateSchema.validate(payload, { abortEarly: true });
        return true;
    } catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};

export { validateCandidateApi, validateCandidate };