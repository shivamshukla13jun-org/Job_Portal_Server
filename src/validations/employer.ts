import { AppError } from "@/middlewares/error";
import { IEmployer } from "@/models/portal/employer.model";
import { NextFunction, Request, Response } from "express";
import * as Yup from "yup"

const employerSchema = Yup.object().shape({
    business_name: Yup.string().required('Business name is required'),
    business_gst: Yup.string().required('GST is required'),
    categories: Yup.array().min(1, 'At least One Job Sector is required'),
    name: Yup.string().required('Full name is required'),
    email: Yup.string().required('Email is required'),
    phone_area: Yup.string().required('Phone area is required'),
    phone: Yup.string().required('Phone number is required'),
    address: Yup.object().shape({
        lane1: Yup.string().required('Lane 1 is required'),
        lane2: Yup.string(),
        city: Yup.string().required('City is required'),
        state: Yup.string().required('State is required'),
        pin_code: Yup.number().required('Pin code is required'),
        country: Yup.string().required('Country is required')
    }),
    product_services: Yup.string().required('Product/services are required'),
    url: Yup.string().url('Invalid URL format').required('URL is required'),
    year_established: Yup.date().required('Year established is required'),
    keywords: Yup.string().required('Keyword is required'),
    logo: Yup.mixed().required("Logo upload is required"),
    videos: Yup.mixed().label("videos"),
    pictures: Yup.mixed().label("pictures"),
});


const validateEmployerApi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await employerSchema.validate(req.body, { abortEarly: true });
        next();
    } catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};

const validateEmployer = async (payload: IEmployer) => {
    try {
        await employerSchema.validate(payload, { abortEarly: true });
        return true;
    } catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};

export { validateEmployerApi, validateEmployer };