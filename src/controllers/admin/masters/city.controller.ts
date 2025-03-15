import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AppError } from "@/middlewares/error";
import City from '@/models/master/city.model';

/**
 @desc    Create a new city
 @route   POST /api/v1/admin/masters/cities
 @access  Admin
**/
const createCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {
      ...req.body,
      createdBy: new Types.ObjectId(res.locals.userId)
    };

    const city = await City.create(payload);

    if (!city) {
      throw new AppError("Failed to create city", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: city, 
      message: "City created successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all cities
 @route   GET /api/v1/admin/masters/cities
 @access  Admin
**/
const getCities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await City.find()
      .populate({
        path: 'state',
        model: 'State',
        select: 'name',
        // populate country name from state 
        populate: {
          path: 'country',
          model: 'Country',
          select: 'name'
        }
      })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: cities, 
      message: "Cities fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single city
 @route   GET /api/v1/admin/masters/cities/:id
 @access  Admin
**/
const getCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = await City.findById(req.params.id)
      .populate('state', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!city) {
      throw new AppError("City not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: city, 
      message: "City fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update a city
 @route   PUT /api/v1/admin/masters/cities/:id
 @access  Admin
**/
const updateCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {
      ...req.body,
      updatedBy: new Types.ObjectId(res.locals.userId)
    };

    const city = await City.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    )
    .populate('state', 'name')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

    if (!city) {
      throw new AppError("City not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: city, 
      message: "City updated successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete a city
 @route   DELETE /api/v1/admin/masters/cities/:id
 @access  Admin
**/
const deleteCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = await City.findById(req.params.id);
    
    if (!city) {
      throw new AppError("City not found", 404);
    }

    await city.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: city, 
      message: "City deleted successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get cities by state
 @route   GET /api/v1/admin/masters/cities/state/:stateId
 @access  Admin
**/
const getCitiesByState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await City.find({ state: req.params.stateId })
      .populate('state', 'name')
      .sort({ name: 1 });

    res.status(200).json({ 
      success: true, 
      data: cities, 
      message: "Cities fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

export {
  createCity,
  getCities,
  getCity,
  updateCity,
  deleteCity,
  getCitiesByState
};
