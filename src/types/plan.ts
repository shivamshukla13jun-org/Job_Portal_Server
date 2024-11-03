import mongoose, { Types } from "mongoose";

export interface IJobportalPlan extends Document {
    name: string;
    userType:Types.ObjectId;
    tag:string,
    price: number;
    position?: number;
    status?: number;
    type: string;
    jobPostLimit: number;
    month?: number | null;
    isActive?: boolean;
}
export interface IRazorPayPlan  {
    name: string;
    tag:string,
    price: number;
    position?: number;
    status?: number;
    type: string;
    jobPostLimit: number;
    month?: number | null;
    isActive?: boolean;
}
export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    orderId:string;
    plan_id: mongoose.Types.ObjectId;
    type: 'monthly' | 'quarterly' | 'yearly' ;
    jobPostLimit: number | null;
    jobPostsUsed: number;
    expiresAt: Date | null;
    isActive: boolean;
}