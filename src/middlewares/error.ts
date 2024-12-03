import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ValidationError as YupValidationError } from "yup";
import multer from "multer";

// Custom error class
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found middleware
const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Global error handler
const errorHandler = (
  err: Error | AppError | MongooseError | JsonWebTokenError | YupValidationError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };

  // Check if the error has properties of AppError
  if ('statusCode' in err && 'isOperational' in err) {
    return res.status((err as AppError).statusCode).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
  }

  // Mongoose bad ObjectId
  if (err instanceof MongooseError.CastError && err.kind === "ObjectId") {
    error = new AppError("Invalid ID format", 400);
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    error = new AppError("Duplicate field value entered", 400);
  }

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new AppError(messages.join(", "), 400);
  }

  // Handle JWT errors
  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    error = new AppError("Invalid or expired token", 401);
  }

  // Handle Yup validation error
  if (err instanceof YupValidationError) {
    const messages = err.errors.join(", ");
    error = new AppError(messages, 400);
  }

  // Handle other types of errors
  if (!(error instanceof AppError)) {
    error = new AppError(error.message || "Server Error", 500);
  }
  if (err instanceof multer.MulterError) {
    // Multer-specific error handling
    res.status(400).json({ message: err.message });
}
  res.status((error as AppError).statusCode).json({
    success: false,
    error: (error as AppError).message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

export { notFound, errorHandler, AppError };