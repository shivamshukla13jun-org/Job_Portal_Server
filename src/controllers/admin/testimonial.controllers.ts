import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AppError } from "@/middlewares/error";
import Testimonial from "@/models/testimonial/testimonial.model";

/**
 @desc    Create a testimonial
 @route   POST /api/v1/admin/testimonial
 @access  Admin
**/
const addTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const id = res.locals.userId;

    payload["createdBy"] = new Types.ObjectId(id);
    const testimonial = await Testimonial.create(payload);

    if (!testimonial) {
      throw new AppError("Failed to create testimonial", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: testimonial, 
      message: "Testimonial created successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

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

    res.status(200).json({ 
      success: true, 
      data: testimonials, 
      message: "Testimonials fetched successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single testimonial
 @route   GET /api/v1/admin/testimonial/:id
 @access  Admin
**/
const getTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!testimonial) {
      throw new AppError("Testimonial not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: testimonial, 
      message: "Testimonial fetched successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update a testimonial
 @route   PUT /api/v1/admin/testimonial/:id
 @access  Admin
**/
const updateTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const id = res.locals.userId;

    const checkTestimonial = await Testimonial.findById(req.params.id);
    if (!checkTestimonial) {
      throw new AppError("Testimonial not found", 404);
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { ...payload, updatedBy: new Types.ObjectId(id) },
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name email');

    if (!testimonial) {
      throw new AppError("Failed to update testimonial", 400);
    }

    res.status(200).json({ 
      success: true, 
      data: testimonial, 
      message: "Testimonial updated successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete a testimonial
 @route   DELETE /api/v1/admin/testimonial/:id
 @access  Admin
**/
const deleteTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      throw new AppError("Testimonial not found", 404);
    }

    await testimonial.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: testimonial, 
      message: "Testimonial deleted successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

export {
  addTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial
};