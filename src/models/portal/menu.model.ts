import { Schema, Document, model, Types } from "mongoose";
// Interfaces
export interface IMenuItem {
  name: string;
  routePath: string;
  key:string;
  icon: string;
  paramtype?: string;
  permissions?: string[]; // Array of permissions
}

export interface IMenu extends Document {
  userType: Types.ObjectId;
  menuItems: IMenuItem[];
}

// Schema Definitions
const menuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  routePath: { type: String, required: true },
  key:{type:String},
  icon: { type: String, required: true },
  paramtype: { type: String },
  permissions: { type: [String], default: [] } // Array of permissions
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