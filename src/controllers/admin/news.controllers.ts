import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import { AppError } from "@/middlewares/error";
import NewsArticle from '@/models/news/news.model';
import NewsComment from '@/models/news/comment.model';
import path from "path";
import fs from "fs";

/**
 @desc    Create a new news article
 @route   POST /api/v1/admin/news
 @access  Admin
**/
const createNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const id = res.locals.userId;

    if (!req.file) {
      throw new AppError("Banner is required", 400);
    }
    payload["banner"] = req.file;

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

    if (req.file) {
      // remove old image
      checkNewsArticle?.banner?.filename && fs.unlinkSync(path.join(process.cwd(), 'uploads', checkNewsArticle.banner.filename));
      payload.banner = req.file;
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

const updateNewsArticleComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const userId = new Types.ObjectId(res.locals.userId);
    const articleId = req.params.id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const newsArticle = await NewsArticle.findById(articleId);
    if (!newsArticle) {
      throw new AppError("News article not found", 404);
    }

    // Find existing comment or create new one
    let comment = await NewsComment.findOne({
      newsArticle: articleId,
      createdBy: userId
    });

    if (comment) {
      // Update existing comment
      comment.message = message;
      comment.updatedBy = userId;
      await comment.save();
    } else {
      // Create new comment
      comment = await NewsComment.create({
        newsArticle: articleId,
        message,
        createdBy: userId
      });
    }

    res.status(200).json({
      success: true,
      data: comment,
      message: "News article comment updated successfully!",
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

const commentsList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const articleId = req.params.id;
    const comments = await NewsComment.aggregate([
      { 
        $match: { 
          newsArticle: new Types.ObjectId(articleId),
          isActive: true 
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: 'createdBy',
          foreignField: 'userId',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                profile: 1
              }
            }
          ],
          as: 'candidate'
        }
      },
      {
        $unwind: {
          path: '$candidate',
          preserveNullAndEmptyArrays: true
        }
      },{
        $lookup:{
          from:'employers',
          localField:'createdBy',
          foreignField:'userId',
          pipeline:[
            {
              $project:{
                name:1,
                email:1,
                 logo:1
              }
            }
          ],
          as:'employer'
        }
      },
      {
        $unwind: {
          path: '$employer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup:{
          from:"subemployers",
          localField:"createdBy",
          foreignField:"userId",
          pipeline:[
            {
              $lookup:{
                from:"employers",
                localField:"_id",
                foreignField:"parentEmployerId",
                pipeline:[
                  {
                    $project:{
                      name:1,
                      email:1,
                      logo:1
                    }
                  }
                ],
                as:"employers"
              }
            },
            {
              $unwind:{
                path:"$employers",
                preserveNullAndEmptyArrays:true
              }
            },
           
          ],
          as:"Subemployer"
        }
      },
      {
        $unwind: {
          path: '$Subemployer',
          preserveNullAndEmptyArrays: true
        }
      },
      // cehck every comment is created by candidate nullthen check employer if if employernull then check ubemployer  finaly when data get add it to createdBy
      {
        $addFields: {
          createdBy: {
            $ifNull: ['$candidate', '$employer', '$Subemployer']
                  }
        }
      },
      {
        $project: {
          _id: 1,
          message: 1,
          newsArticle: 1,
          createdAt: 1,
          createdBy: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])

    res.status(200).json({
      success: true,
      data: comments,
      message: "Comments fetched successfully!"
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const userId = new Types.ObjectId(res.locals.userId);

    const comment = await NewsComment.findById(commentId);
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    // Only allow comment creator to delete their comment
    if (comment.createdBy.toString() !== userId.toString()) {
      throw new AppError("Not authorized to delete this comment", 403);
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully!"
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
  updateNewsArticleComment,
  deleteNewsArticle,
  commentsList,
  deleteComment
};
