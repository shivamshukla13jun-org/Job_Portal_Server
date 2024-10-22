import { IFile } from "@/types/file";
import { Schema, Document, model, Types } from "mongoose"

export interface ITestimonial extends Document {
    name: string;
    email: string;
    phone_area: string;
    phone: number;
    testimonial: string;
    isPublic: boolean;
    rating: number;
    asset?: IFile;
    createdBy: Types.ObjectId;
    isActive: boolean;
}

const testimonialSchema = new Schema<ITestimonial>({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    phone_area: {
        type: String,
        required: [true, 'Phone area is required']
    },
    phone: {
        type: Number,
        required: [true, 'Phone is required'],
        max: 10, min: 10
    },
    testimonial: {
        type: String,
        required: [true, 'Testimonial is required']
    },
    isPublic: {
        type: Boolean,
        required: [true, 'Public is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required']
    },
    asset: {
        type: Object
    },
    createdBy: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

const Testimonial = model<ITestimonial>("Testimonial", testimonialSchema);

export default Testimonial;