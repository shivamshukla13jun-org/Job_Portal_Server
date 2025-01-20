import User, { IUser } from '@/models/admin/user.model';
import { AppError } from '@/middlewares/error';
import { Menu } from '@/models/portal/menu.model';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
// Get user-specific menu
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

    const id = user.candidateId || user.employerId || user.subEmployerId;
    let menu = await Menu.findOne({ userType: user?.userType?._id });

    if (!menu) {
      throw new AppError("Menu not found for this user type", 404);
    }

    menu = menu.toObject();
    let menus:any[] =[]
    if(menu){
      menus = menu.menuItems.map((item) => {
       let routePath = item.paramtype === 'EmployerId' || item.paramtype === 'SubEmployerId' 
         ? item.routePath + '/' + id 
         : item.paramtype === 'createdBy' 
           ? item.routePath + '/' + user._id 
           : item.routePath;
 
       return {
         ...item,
         routePath: routePath
       };
     });
    }

    return res.status(200).json({ success: true, data: menus });
  } catch (error) {
    next(error);
  }
};

// Create new menu
export const createMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userType, menuItems } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userType)) {
      throw new AppError('Invalid userType ID format', 400);
    }

    const existingMenu = await Menu.findOne({ userType });
    if (existingMenu) {
      throw new AppError('Menu already exists for this user type', 400);
    }

    const menu = new Menu({
      userType,
      menuItems
    });

    await menu.save();

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      data: menu
    });
  } catch (error) {
    next(error);
  }
};

// Get menu by user type
export const getMenuByUserType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userTypeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userTypeId)) {
      throw new AppError('Invalid userType ID format', 400);
    }

    const menu = await Menu.findOne({ userType: userTypeId });
    if (!menu) {
      throw new AppError('Menu not found for this user type', 404);
    }

    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    next(error);
  }
};

// Update menu
export const updateMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userTypeId } = req.params;
    const { menuItems } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userTypeId)) {
      throw new AppError('Invalid userType ID format', 400);
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { userType: userTypeId },
      { $set: { menuItems } },
      { new: true, runValidators: true }
    );

    if (!updatedMenu) {
      throw new AppError('Menu not found for this user type', 404);
    }

    res.json({
      success: true,
      message: 'Menu updated successfully',
      data: updatedMenu
    });
  } catch (error) {
    next(error);
  }
};

// Delete menu
export const deleteMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userTypeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userTypeId)) {
      throw new AppError('Invalid userType ID format', 400);
    }

    const deletedMenu = await Menu.findOneAndDelete({ userType: userTypeId });

    if (!deletedMenu) {
      throw new AppError('Menu not found for this user type', 404);
    }

    res.json({
      success: true,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};