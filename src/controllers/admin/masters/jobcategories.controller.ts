import { Request, Response, NextFunction } from "express";
import { AppError } from "@/middlewares/error";
import JobCategory from '@/models/master/jobcategories.model';

/**
 @desc    Create a new job category
 @route   POST /api/v1/admin/masters/job-categories
 @access  Admin
**/
const createJobCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
     req.body.createdBy = res.locals.userId;
     req.body.updatedBy = res.locals.userId;
    const jobCategory = await JobCategory.create(req.body);

    if (!jobCategory) {
      throw new AppError("Failed to create job category", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: jobCategory, 
      message: "Job category created successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all industries
 @route   GET /api/v1/admin/masters/job-categories
 @access  Admin
**/
const getJobCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobCategories = await JobCategory.find().sort({ createdAt: 1 });

    res.status(200).json({ 
      success: true, 
      data: jobCategories, 
      message: "Job categories fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single industry
 @route   GET /api/v1/admin/masters/job-categories/:id
 @access  Admin
**/
const getJobCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobCategory = await JobCategory.findById(req.params.id);

    if (!jobCategory) {
      throw new AppError("Job category not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: jobCategory, 
      message: "Job category fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update an industry
 @route   PUT /api/v1/admin/masters/industries/:id
 @access  Admin
**/
const updateJobCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.updatedBy = res.locals.userId;
    const jobCategory = await JobCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!jobCategory) {
      throw new AppError("Job category not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: jobCategory, 
      message: "Job category updated successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete an industry
 @route   DELETE /api/v1/admin/masters/job-categories/:id
 @access  Admin
**/
const deleteJobCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobCategory = await JobCategory.findById(req.params.id);
    
    if (!jobCategory) {
      throw new AppError("Job category not found", 404);
    }

    await jobCategory.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: jobCategory, 
      message: "Job category deleted successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

export {
  createJobCategory,
  getJobCategories,
  getJobCategory,
  updateJobCategory,
  deleteJobCategory
};
