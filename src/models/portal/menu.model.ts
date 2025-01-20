import { Schema, Document, model, Types } from "mongoose";
// Interfaces
interface IMenuItem {
  name: string;
  routePath: string;
  icon: string;
  paramtype?: string;
  permissions?: string[]; // Array of permissions
}

interface IMenu extends Document {
  userType: Types.ObjectId;
  menuItems: IMenuItem[];
}

// Schema Definitions
const menuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  routePath: { type: String, required: true },
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