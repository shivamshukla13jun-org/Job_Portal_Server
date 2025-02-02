import { NextFunction } from 'express';
// backend/controllers/emailTemplate.controller.ts
import EmailTemplate from '@/models/portal/EmailTemplate.model';
import { Request, Response } from 'express';

export const createTemplate = async (req: Request, res: Response,next:NextFunction) => {
  try {
    const userId=res.locals.userId
    const template = new EmailTemplate({
      ...req.body,
      createdBy: userId
    });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    next(error)
  }
};

export const updateTemplate = async (req: Request, res: Response,next:NextFunction) => {
  try {
    const userId=res.locals.userId

    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: userId},
      { new: true }
    );
    res.json(template);
  } catch (error) {
    next(error)
}
};