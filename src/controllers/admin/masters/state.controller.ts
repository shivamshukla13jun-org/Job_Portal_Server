import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AppError } from "@/middlewares/error";
import State from '@/models/master/state.model';

/**
 @desc    Create a new state
 @route   POST /api/v1/admin/masters/states
 @access  Admin
**/
const createState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {
      ...req.body,
      createdBy: new Types.ObjectId(res.locals.userId)
    };

    const state = await State.create(payload);

    if (!state) {
      throw new AppError("Failed to create state", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: state, 
      message: "State created successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all states
 @route   GET /api/v1/admin/masters/states
 @access  Admin
**/
const getStates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const states = await State.find()
      .populate('country', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: states, 
      message: "States fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single state
 @route   GET /api/v1/admin/masters/states/:id
 @access  Admin
**/
const getState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await State.findById(req.params.id)
      .populate('country', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!state) {
      throw new AppError("State not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: state, 
      message: "State fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update a state
 @route   PUT /api/v1/admin/masters/states/:id
 @access  Admin
**/
const updateState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {
      ...req.body,
      updatedBy: new Types.ObjectId(res.locals.userId)
    };

    const state = await State.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    )
    .populate('country', 'name')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

    if (!state) {
      throw new AppError("State not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: state, 
      message: "State updated successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete a state
 @route   DELETE /api/v1/admin/masters/states/:id
 @access  Admin
**/
const deleteState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await State.findById(req.params.id);
    
    if (!state) {
      throw new AppError("State not found", 404);
    }

    await state.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: state, 
      message: "State deleted successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get states by country
 @route   GET /api/v1/admin/masters/states/country/:countryId
 @access  Admin
**/
const getStatesByCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const states = await State.find({ country: req.params.countryId })
      .populate('country', 'name')
      .sort({ name: 1 });

    res.status(200).json({ 
      success: true, 
      data: states, 
      message: "States fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

export {
  createState,
  getStates,
  getState,
  updateState,
  deleteState,
  getStatesByCountry
};
