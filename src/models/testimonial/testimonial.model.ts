import mongoose, { Document, Schema } from 'mongoose';

export interface ITestimonial extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  description: string;
  profilePicture: string;
  rating: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    fullName: { 
      type: String, 
      required: [true, 'Full name is required'] 
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phoneNumber: { 
      type: String, 
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'] 
    },
    profilePicture: { 
      type: String, 
      required: [true, 'Profile picture URL is required'] 
    },
    rating: { 
      type: Number, 
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'Admin', 
      required: true 
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'Admin'
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true 
  }
);

const Testimonial = mongoose.model<ITestimonial>('Testimonial', testimonialSchema);
export default Testimonial;
