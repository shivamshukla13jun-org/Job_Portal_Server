import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AppError } from "@/middlewares/error";
import NewsArticle from '@/models/news/news.model';

/**
 @desc    Create a new news article
 @route   POST /api/v1/admin/news
 @access  Admin
**/
const createNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const id = res.locals.userId;

    payload["createdBy"] = new Types.ObjectId(id);
    const newsArticle = await NewsArticle.create(payload);

    if (!newsArticle) {
      throw new AppError("Failed to create news article", 400);
    }

    res.status(201).json({ 
      success: true, 
      data: newsArticle, 
      message: "News article created successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get all news articles
 @route   GET /api/v1/admin/news
 @access  Admin
**/
const getNewsArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newsArticles = await NewsArticle.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    if (!newsArticles) {
      throw new AppError("Failed to fetch news articles", 400);
    }

    res.status(200).json({ 
      success: true, 
      data: newsArticles, 
      message: "News articles fetched successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

/**
 @desc    Get single news article
 @route   GET /api/v1/admin/news/:id
 @access  Admin
**/
const getNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newsArticle = await NewsArticle.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!newsArticle) {
      throw new AppError("News article not found", 404);
    }

    res.status(200).json({ 
      success: true, 
      data: newsArticle, 
      message: "News article fetched successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

/**
 @desc    Update a news article
 @route   PUT /api/v1/admin/news/:id
 @access  Admin
**/
const updateNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const id = res.locals.userId;

    const checkNewsArticle = await NewsArticle.findById(req.params.id);
    if (!checkNewsArticle) {
      throw new AppError("News article not found", 404);
    }

    const newsArticle = await NewsArticle.findByIdAndUpdate(
      req.params.id,
      { ...payload, updatedBy: new Types.ObjectId(id) },
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name email');

    if (!newsArticle) {
      throw new AppError("Failed to update news article", 400);
    }

    res.status(200).json({ 
      success: true, 
      data: newsArticle, 
      message: "News article updated successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

/**
 @desc    Delete a news article
 @route   DELETE /api/v1/admin/news/:id
 @access  Admin
**/
const deleteNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newsArticle = await NewsArticle.findById(req.params.id);
    if (!newsArticle) {
      throw new AppError("News article not found", 404);
    }

    await newsArticle.deleteOne();

    res.status(200).json({ 
      success: true, 
      data: newsArticle, 
      message: "News article deleted successfully!" 
    });

  } catch (error) {
    next(error);
  }
};

export {
  createNewsArticle,
  getNewsArticles,
  getNewsArticle,
  updateNewsArticle,
  deleteNewsArticle
};
