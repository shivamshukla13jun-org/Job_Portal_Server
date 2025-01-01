import { AppError } from "@/middlewares/error";
import User, { IUser } from "@/models/admin/user.model";
import { UserType } from "@/models/admin/userType.model";
import { Menu } from "@/models/portal/menu.model";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";


export const getUserMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user: IUser | null = await User.findById(req.params.id).populate({
            path: "userType",
            select: "_id name",
          });
      
          if (!user) {
            throw new AppError("Failed to fetch user!", 400);
          }
      if (!user?.userType?._id) {
        throw new AppError("User type is required", 400);
      }
  
      const menu = await Menu.findOne({ userType: user?.userType?._id });
      if (!menu) {
        throw new AppError("Menu not found for this user type", 404);
      }
  
      return res.status(200).json({ success: true, data: menu.menuItems });
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  };
