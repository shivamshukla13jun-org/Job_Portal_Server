import { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";
import Testimonial, { ITestimonial } from "@/models/admin/testimonial.model";
import { AppError } from "@/middlewares/error";
import { IFile } from "@/types/file";
import path from "path";
import fs from "fs";

/**
 @desc    Create a testimonial
 @route   POST /api/v1/admin/testimonial
 @access  Admin
**/
const createTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: ITestimonial = req.body;
        const id = res.locals.userId;

        if (req.file) {
            payload.asset = req.file;
        }
        payload.createdBy = new Types.ObjectId(id);

        const createTestimonial = await Testimonial.create(payload);
        if (!createTestimonial) {
            throw new AppError("Failed to create testimonial", 400)
        }

        res.status(201).json({ success: true, data: createTestimonial, message: "Testimonial created!" })

    } catch (error) {
        next(error)
    }
}

/**
 @desc    Get all testimonials
 @route   GET /api/v1/admin/testimonial
 @access  Admin
**/
const getTestimonials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testimonials = await Testimonial.find()
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email');

        if (!testimonials) {
            throw new AppError("Failed to fetch testimonials", 400);
        }

        res.status(200).json({ success: true, data: testimonials, message: "Testimonials fetched!" })

    } catch (error) {
        next(error)
    }
}

/**
 @desc    Get single testimonial
 @route   GET /api/v1/admin/testimonial/:id
 @access  Admin
**/
const getTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const testimonial = await Testimonial.findById(id)
            .populate('createdBy', 'name email');
        if (!testimonial) {
            throw new AppError("Failed to fetch testimonial!", 400)
        }

        res.status(200).json({ success: true, data: testimonial, message: "Testimonial fetched!" })

    } catch (error) {
        next(error)
    }
}

/**
 @desc    Update a testimonial
 @route   PUT /api/v1/admin/testimonial/:id
 @access  Admin
**/
const updateTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: ITestimonial = req.body;
        const id = res.locals.userId;

        const checkTestimonial = await Testimonial.findById(req.params.id);
        if (!checkTestimonial) {
            throw new AppError("Failed to fetch testimonial for updating!", 400);
        }

        if (req.file) {
            payload.asset = req.file;
            // remove old image
            checkTestimonial?.asset?.filename && fs.unlinkSync(path.join(process.cwd(), 'uploads', checkTestimonial.asset.filename));
        }

        payload.updatedBy = new Types.ObjectId(id);

        const updateTestimonial = await Testimonial.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
            .populate('createdBy updatedBy', 'name email');
        if (!updateTestimonial) {
            throw new AppError("Failed to update testimonial", 400)
        }

        res.status(201).json({ success: true, data: updateTestimonial, message: "Testimonial updated!" })

    } catch (error) {
        next(error)
    }
}

/**
 @desc    Delete a testimonial
 @route   DELETE /api/v1/admin/testimonial/:id
 @access  Admin
**/
const deleteTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const testimonial = await Testimonial.findByIdAndDelete(id);
        if (!testimonial) {
            throw new AppError("Failed to fetch testimonial!", 400)
        }

        res.status(200).json({ success: true, data: testimonial, message: "Testimonial deleted!" })

    } catch (error) {
        next(error)
    }
}

export {
    createTestimonial, getTestimonials, getTestimonial, updateTestimonial, deleteTestimonial
}