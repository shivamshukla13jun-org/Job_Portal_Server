import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AppError } from "@/middlewares/error";
import Country from '@/models/master/country.model';

/**
 @desc    Create a new country
 @route   POST /api/v1/admin/masters/countries
 @access  Admin
**/
const createCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {
      ...req.body,
      createdBy: new Types.ObjectId(res.locals.userId)
    };

    const country = await Country.create(payload);

    if (!country) {
      throw new AppError("Failed to create country", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: country, 
      message: "Country created successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all countries
 @route   GET /api/v1/admin/masters/countries
 @access  Admin
**/
const getCountries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countries = await Country.find()
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ name: 1 });

    res.status(200).json({ 
      success: true, 
      data: countries, 
      message: "Countries fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single country
 @route   GET /api/v1/admin/masters/countries/:id
 @access  Admin
**/
const getCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = await Country.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!country) {
      throw new AppError("Country not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: country, 
      message: "Country fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update a country
 @route   PUT /api/v1/admin/masters/countries/:id
 @access  Admin
**/
const updateCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {
      ...req.body,
      updatedBy: new Types.ObjectId(res.locals.userId)
    };

    const country = await Country.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

    if (!country) {
      throw new AppError("Country not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: country, 
      message: "Country updated successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete a country
 @route   DELETE /api/v1/admin/masters/countries/:id
 @access  Admin
**/
const deleteCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = await Country.findById(req.params.id);
    
    if (!country) {
      throw new AppError("Country not found", 404);
    }

    await country.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: country, 
      message: "Country deleted successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

export {
  createCountry,
  getCountries,
  getCountry,
  updateCountry,
  deleteCountry
};
