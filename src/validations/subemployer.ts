import { AppError } from "@/middlewares/error";
import { NextFunction, Request, Response } from "express";
import * as yup from "yup"

const meetingSchema = yup.object().shape({
    date: yup
    .date()
    .required('Date is required')
    .typeError('Date must be a valid ISO string'),
time: yup.string().required('Time is required'),
timeDuration: yup
    .number()
    .min(15, 'Time duration must be at least 15 minutes')
    .required('Time duration is required'),
email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),
phone: yup
    .string()
    .matches(/^[0-9]{10,15}$/, 'Phone must be a valid number')
    .required('Phone is required'),
message: yup.string(),
address: yup.string(),
meetingLink: yup.string().url('Meeting link must be a valid URL').notRequired(),
    // registration_certificate: Yup.mixed().required('Registration certificate is required'),
});
const validateMeeting = async (payload:object) => {
    try {
        await meetingSchema.validate(payload, { abortEarly: true });
        return true;
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            throw new AppError(error.message, 400);
        } else {
            throw new AppError("An unexpected error occurred", 500);
        }
    }
};



export { validateMeeting};