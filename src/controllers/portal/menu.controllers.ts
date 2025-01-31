import User, { IUser } from '@/models/admin/user.model';
import { AppError } from '@/middlewares/error';
import { IMenu, IMenuItem, Menu } from '@/models/portal/menu.model';
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
    let menu :IMenu | null= await Menu.findOne({ userType: user?.userType?._id });

    if (!menu) {
      throw new AppError("Menu not found for this user type", 404);
    }
    menu=menu.toObject()
    if(menu){
      menu.menuItems = menu.menuItems
      .filter((item: IMenuItem) => {
        let idToAdd = null;
    
        // Check for paramtype and assign the corresponding ID
        switch (item.paramtype) {
          case "EmployerId":
            idToAdd = id; // EmployerId should use `id`
            break;
          case "SubEmployerId":
            idToAdd = id; // SubEmployerId should use `id`
            break;
          case "createdBy":
            idToAdd = user._id; // createdBy should use `user._id`
            break;
          default:
            // For items without a paramtype, always keep them
            idToAdd = null; // No ID check needed for other items
            break;
        }
    
        // If the item has a valid ID to add or no paramtype, keep the item
        if (idToAdd && item.paramtype) {
         item.routePath = item.routePath + '/' + idToAdd;
          return true; // Keep the item
        }else if(!idToAdd && !item.paramtype){
          return true; // Remove the item
        }
        return false
      });
    
    }

    return res.status(200).json({ success: true, data: menu });
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
    const { permissionId } = req.params; // ID of the menu item
    const { permissions } = req.body; // Updated permissions array

    if (!mongoose.Types.ObjectId.isValid(permissionId)) {
      throw new AppError('Invalid permission ID format', 400);
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { "menuItems._id": permissionId }, // Locate the menu item within menuItems array
      { $set: { "menuItems.$.permissions": permissions } }, // Update the permissions for the specific menu item
      { new: true, runValidators: true }
    );

    if (!updatedMenu) {
      throw new AppError('Menu item not found for the given ID', 404);
    }

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: updatedMenu,
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