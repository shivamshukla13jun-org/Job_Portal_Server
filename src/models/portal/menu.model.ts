import { Schema, Document, model, Types } from "mongoose";
// Interfaces
export interface IMenuItem {
  name: string;
  routePath: string;
  key: string;
  icon: string;
  paramtype?: string;
  permissions?: {
    view?: boolean;
    edit?: boolean;
    delete?: boolean;
    [key: string]: boolean | undefined; // For additional permissions
  };
  subMenu?: IMenuItem[]; // New field for sub-menu items
}


export interface IMenu extends Document {
  userType: Types.ObjectId;
  menuItems: IMenuItem[];
}

// Schema Definitions
const menuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  routePath: { type: String, required: true },
  key: { type: String },
  icon: { type: String, required: true },
  paramtype: { type: String },
  permissions: {
    type: Object,
    default: {},
  },
  subMenu: [
    {
      name: { type: String, required: true },
      routePath: { type: String, required: true },
      key: { type: String },
      icon: { type: String, required: true },
      paramtype: { type: String },
      permissions: { type: Object, default: {} },
    },
  ],
});



const menuSchema = new Schema<IMenu>({
  userType: {
    type: Schema.Types.ObjectId,
    ref: 'UserType',
    unique: true,
    required: true
  },
  menuItems: [menuItemSchema]
}, { timestamps: true });

export const Menu = model<IMenu>('Menu', menuSchema);