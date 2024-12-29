import { Schema, Document, model, Types } from "mongoose";

interface IMenuItem {
  name: string;
  routePath: string;
  icon: string;
  paramtype?: string;
}

export interface IMenu extends Document {
  userType: Types.ObjectId; // Reference to UserType
  menuItems: IMenuItem[];
}

const menuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  routePath: { type: String, required: true },
  icon: { type: String, required: true },
  paramtype: { type: String }
});

const menuSchema = new Schema<IMenu>({
  userType: {
    type: Schema.Types.ObjectId,
    ref: 'UserType',
    unique:true,
    required: true
  },
  menuItems: [menuItemSchema]
}, { timestamps: true });

export const Menu = model<IMenu>('Menu', menuSchema);
