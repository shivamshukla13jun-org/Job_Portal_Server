import { Request, Response, NextFunction } from "express";
import { AppError } from "@/middlewares/error";
import Industry from '@/models/master/industry.model';

/**
 @desc    Create a new industry
 @route   POST /api/v1/admin/masters/industries
 @access  Admin
**/
const createIndustry = async (req: Request, res: Response, next: NextFunction) => {
  try {
     req.body.createdBy = res.locals.userId;
     req.body.updatedBy = res.locals.userId;
    const industry = await Industry.create(req.body);

    if (!industry) {
      throw new AppError("Failed to create industry", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: industry, 
      message: "Industry created successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all industries
 @route   GET /api/v1/admin/masters/industries
 @access  Admin
**/
const getIndustries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const industries = await Industry.find().sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: industries, 
      message: "Industries fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single industry
 @route   GET /api/v1/admin/masters/industries/:id
 @access  Admin
**/
const getIndustry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const industry = await Industry.findById(req.params.id);

    if (!industry) {
      throw new AppError("Industry not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: industry, 
      message: "Industry fetched successfully!" 
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
const updateIndustry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.updatedBy = res.locals.userId;
    const industry = await Industry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!industry) {
      throw new AppError("Industry not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: industry, 
      message: "Industry updated successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete an industry
 @route   DELETE /api/v1/admin/masters/industries/:id
 @access  Admin
**/
const deleteIndustry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const industry = await Industry.findById(req.params.id);
    
    if (!industry) {
      throw new AppError("Industry not found", 404);
    }

    await industry.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: industry, 
      message: "Industry deleted successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

export {
  createIndustry,
  getIndustries,
  getIndustry,
  updateIndustry,
  deleteIndustry
};
