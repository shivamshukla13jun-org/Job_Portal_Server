import { Request, Response, NextFunction } from "express";
import { AppError } from "@/middlewares/error";
import Degree from '@/models/master/degree.model';

/**
 @desc    Create a new degree
 @route   POST /api/v1/admin/masters/degrees
 @access  Admin
**/
const createDegree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.createdBy = res.locals.userId;
    req.body.updatedBy = res.locals.userId;
    const degree = await Degree.create(req.body);

    if (!degree) {
      throw new AppError("Failed to create degree", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: degree, 
      message: "Degree created successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all degrees
 @route   GET /api/v1/admin/masters/degrees
 @access  Admin
**/
const getDegrees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const degrees = await Degree.find().sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: degrees, 
      message: "Degrees fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single degree
 @route   GET /api/v1/admin/masters/degrees/:id
 @access  Admin
**/
const getDegree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const degree = await Degree.findById(req.params.id);

    if (!degree) {
      throw new AppError("Degree not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: degree, 
      message: "Degree fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update a degree
 @route   PUT /api/v1/admin/masters/degrees/:id
 @access  Admin
**/
const updateDegree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.updatedBy = res.locals.userId;
    const degree = await Degree.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!degree) {
      throw new AppError("Degree not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: degree, 
      message: "Degree updated successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete a degree
 @route   DELETE /api/v1/admin/masters/degrees/:id
 @access  Admin
**/
const deleteDegree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const degree = await Degree.findById(req.params.id);
    
    if (!degree) {
      throw new AppError("Degree not found", 404);
    }

    await degree.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: degree, 
      message: "Degree deleted successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

export {
  createDegree,
  getDegrees,
  getDegree,
  updateDegree,
  deleteDegree
};
