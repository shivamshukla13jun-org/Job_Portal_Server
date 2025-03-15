import { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";
import Article, { IArticle } from "@/models/admin/article.model";
import { AppError } from "@/middlewares/error";
import { IFile } from "@/types/file";

/** 
 @desc    Create an article
 @path    POST /api/v1/article
 @access  Admin
**/
const createArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IArticle = req.body;
        const id = res.locals.userId;

        if (!req.file) {
            throw new AppError("Banner image is required", 400);
        }

        const banner: IFile = {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            destination: req.file.destination,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        };

        payload.banner = banner;
        payload.createdBy = new Types.ObjectId(id);

        const createArticle = await Article.create(payload);
        if (!createArticle) {
            throw new AppError("Failed to create an article", 400)
        }

        res.status(201).json({ success: true, data: createArticle, message: "Article created!" })

    } catch (error) {
        next(error)
    }
}

/** 
 @desc    Get all articles
 @path    GET /api/v1/article
 @access  Public
**/
const getArticles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const articles = await Article.find()
        if (!articles) {
            throw new AppError("Failed to fetch articles", 400);
        }

        res.status(200).json({ success: true, data: articles, message: "Articles fetched!" })

    } catch (error) {
        next(error)
    }
}

/** 
 @desc    Get single article
 @path    GET /api/v1/article/:id
 @access  Public
**/
const getArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const article = await Article.findById(id);
        if (!article) {
            throw new AppError("Failed to fetch article!", 400)
        }

        res.status(200).json({ success: true, data: article, message: "Article fetched!" })

    } catch (error) {
        next(error)
    }
}

/** 
 @desc    Update an article
 @path    PUT /api/v1/article/:id
 @access  Admin
**/
const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: IArticle = req.body;
        const id = res.locals.userId;

        const checkArticle = await Article.findById(req.params.id);
        if (!checkArticle) {
            throw new AppError("Failed to fetch article for updating!", 400);
        }

        if (req.file) {
            const banner: IFile = {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                encoding: req.file.encoding,
                mimetype: req.file.mimetype,
                destination: req.file.destination,
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size
            };
            payload.banner = banner;
        }

        payload.updatedBy = new Types.ObjectId(id);

        const updateArticle = await Article.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!updateArticle) {
            throw new AppError("Failed to update an article", 400)
        }

        res.status(201).json({ success: true, data: updateArticle, message: "Article updated!" })

    } catch (error) {
        next(error)
    }
}

/** 
 @desc    Delete an article
 @path    DELETE /api/v1/article/:id
 @access  Admin
**/
const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const article = await Article.findByIdAndDelete(id);
        if (!article) {
            throw new AppError("Failed to fetch article!", 400)
        }

        res.status(200).json({ success: true, data: {}, message: "Article deleted!" })

    } catch (error) {
        next(error)
    }
}

export {
    createArticle, getArticles, getArticle, updateArticle, deleteArticle
}