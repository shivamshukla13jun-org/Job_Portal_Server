import mongoose, { Document, Schema } from 'mongoose';
import { IJobportalPlan } from '@/types/plan';


const planSchema: Schema<IJobportalPlan> = new Schema({
    name: { type: String,  required:[true,"Type  is required"],unique:true },
    price: { type: Number, required: true },
    position: { type: Number,unique:true ,},
    tag:{type:String,default:""},
    userType: {
        type: Schema.Types.ObjectId, ref: 'UserType'
      },
    type: {
        type: String,
        enum: ['monthly','quarterly', 'yearly'],
        required:[true,"Type  is required"]
    },
    jobPostLimit: {
        type: Number,
        required:[true,"Post Limit   is required"]    },
    month: {
        type: Number,
        default: 1
        
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    });

export const JobportalPlan = mongoose.model<IJobportalPlan>("plans", planSchema);