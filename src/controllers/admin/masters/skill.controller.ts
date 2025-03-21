import { Request, Response, NextFunction } from "express";
import { AppError } from "@/middlewares/error";
import Skill from '@/models/master/skill.model';

/**
 @desc    Create a new skill
 @route   POST /api/v1/admin/masters/skills
 @access  Admin
**/
const createSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.createdBy = res.locals.userId;
    req.body.updatedBy = res.locals.userId;
    const skill = await Skill.create(req.body);

    if (!skill) {
      throw new AppError("Failed to create skill", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: skill, 
      message: "Skill created successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all skills
 @route   GET /api/v1/admin/masters/skills
 @access  Admin
**/
const getSkills = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await Skill.find().sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: skills, 
      message: "Skills fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single skill
 @route   GET /api/v1/admin/masters/skills/:id
 @access  Admin
**/
const getSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      throw new AppError("Skill not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: skill, 
      message: "Skill fetched successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update a skill
 @route   PUT /api/v1/admin/masters/skills/:id
 @access  Admin
**/
const updateSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.updatedBy = res.locals.userId;
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!skill) {
      throw new AppError("Skill not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: skill, 
      message: "Skill updated successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete a skill
 @route   DELETE /api/v1/admin/masters/skills/:id
 @access  Admin
**/
const deleteSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      throw new AppError("Skill not found", 404);
    }

    await skill.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: skill, 
      message: "Skill deleted successfully!" 
    });
  } catch (error) {
    next(error);
  }
};

export {
  createSkill,
  getSkills,
  getSkill,
  updateSkill,
  deleteSkill
};
