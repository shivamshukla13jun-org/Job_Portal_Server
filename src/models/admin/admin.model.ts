import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin',enum:['admin','superadmin','manager','moderator','editor',] },
  },
  { timestamps: true }
);

// Encrypt password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user-entered password with hashed password
adminSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
export default Admin;
