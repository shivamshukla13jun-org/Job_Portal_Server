import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

import { AppError } from "@/middlewares/error";
import Testimonial, { ITestimonial } from "@/models/admin/testimonial.model";

// @desc    Create a testimonial
// @path    POST /api/v1/testimonial
// @access  Admin
const addTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: ITestimonial = req.body;
        const id = res.locals.userId;

        payload["createdBy"] = new Types.ObjectId(id);
        const testimonial = await Testimonial.create(payload);

        if (!testimonial) {
            throw new AppError("Failed to create testimonial", 400);
        }

        res.status(201).json({ success: true, data: testimonial, message: "Testimonial created!" })

    } catch (error) {
        next(error)
    }
}

// @desc    Get all testimonials
// @path    GET /api/v1/testimonial
// @access  Admin
const getTestimonials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testimonial = await Testimonial.find()
        if (!testimonial) {
            throw new AppError("Failed to fetch testimonial", 400);
        }

        res.status(200).json({ success: true, data: testimonial, message: "Testimonials fetched!" })

    } catch (error) {
        next(error)
    }
}

// @desc    Get single testimonial
// @path    GET /api/v1/testimonial/:id
// @access  Admin
const getTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.params.id;
        const testimonial = await Testimonial.findById(payload)
        if (!testimonial) {
            throw new AppError("Failed to fetch testimonial", 400);
        }

        res.status(200).json({ success: true, data: testimonial, message: "Testimonial fetched!" })

    } catch (error) {
        next(error)
    }
}

// @desc    Update a testimonial
// @path    PUT /api/v1/testimonial/:id
// @access  Admin
const updateTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: ITestimonial = req.body;
        const id = res.locals.userId;

        const checkTestimonial = await Testimonial.findById(req.params.id);
        if (!checkTestimonial) {
            throw new AppError("Couldn't find testimonial", 400);
        }

        const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });

        if (!testimonial) {
            throw new AppError("Failed to update testimonial", 400);
        }

        res.status(201).json({ success: true, data: testimonial, message: "Testimonial updated!" })

    } catch (error) {
        next(error)
    }
}

// @desc    Delete single testimonial
// @path    DELETE /api/v1/testimonial/:id
// @access  Admin
const deleteTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.params.id;
        const testimonial = await Testimonial.findByIdAndDelete(payload)
        if (!testimonial) {
            throw new AppError("Failed to find testimonial", 400);
        }

        res.status(200).json({ success: true, data: testimonial, message: "Testimonial deleted!" })

    } catch (error) {
        next(error)
    }
}

export {
    addTestimonial, getTestimonials, getTestimonial, updateTestimonial, deleteTestimonial
}