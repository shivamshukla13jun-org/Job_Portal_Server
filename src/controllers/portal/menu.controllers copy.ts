import { AppError } from "@/middlewares/error";
import User, { IUser } from "@/models/admin/user.model";
import { UserType } from "@/models/admin/userType.model";
import { IMenu, Menu } from "@/models/portal/menu.model";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";


export const getUserMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user: IUser  = await User.findById(req.params.id).populate({
            path: "userType",
          }) as IUser;
          if (!user) {
            throw new AppError("Failed to fetch user!", 400);
          }
      if (!user?.userType?._id) {
        throw new AppError("User type is required", 400);
      }
  
      let menu = await Menu.findOne({ userType: user?.userType?._id }) as IMenu;
      if (!menu) {
        throw new AppError("Menu not found for this user type", 404);
      }
      menu = menu.toObject();
      menu.menuItems = menu.menuItems.map((item) => {
        let userId=user._id;
        console.log(user)
        let data = item.paramtype=="createdBy" ? userId :item.paramtype!==""? user.candidateId || user.employerId || user.subEmployerId:""
        console.log("item",item)
        console.log("data",data)
        return {
          name: item.name,
          routePath: `${item.routePath} ${data && "/"+data}`,
          icon: item.icon,
          paramtype: item.paramtype,
        };
      });
     
      return res.status(200).json({ success: true, data: menu.menuItems });
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  };
