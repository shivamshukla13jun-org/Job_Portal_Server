import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import process from 'process';
import User from '@/models/admin/user.model';
import Job from '@/models/portal/job.model';
import { Subscription } from '@/models/portal/subscription.model';
import {  ISubscription} from '@/types/plan';
import { JobportalPlan } from '@/models/portal/plan.model';
import { createSubscription } from '@/utils/paymentgateway';
import { AppError } from '@/middlewares/error';



const createOrder = async (req: Request, res: Response,next:NextFunction) => {
    
    try {
        const { id } = req.params;
        const userId = res.locals.userId as Types.ObjectId

      // Retrieve plan details from JobportalPlan model
      const plan = await JobportalPlan.findById(id);
  
      if (!plan) {
         throw  new AppError("Plan not found",400)
      }
  
      if (!plan.isActive) {
       throw  new AppError("Plan not found",400)
      }
      let user=await User.findById(userId)
      if(!user){
        throw  new AppError("User not found",400)
      }
      // Prepare subscription request options
      // Call the reusable createRazorpaySubscription function
      const subscription = await createSubscription('razorpay', {
        amount: plan.price===0?2:plan.price,
        currency: 'INR',
        description: 'Plan Subscription',
        user,
        plan,
      });
      res.status(200).json({data:subscription,plan,success: true,});
  
    } catch (error) {
      console.error(error);
      next(error)
    }
  };


const verifyPayment= async (req: Request, res: Response,next:NextFunction) => {
    const { orderId, paymentId, signature, plan }: { orderId: string; paymentId: string; signature: string; plan: any } = req.body;
 
    try {
        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string);
        shasum.update(`${orderId}|${paymentId}`);
        const digest = shasum.digest('hex');

        if (signature !== digest) {
            throw new AppError("Invalid signature sent!",400 )
            return res.status(400).json({ message: "Invalid signature sent!" });
        }

        return res.json({  message: 'Payment successful' });

    } catch (error) {
        next(error)
    }
}

const SubscriptionCreate = async (req: Request, res: Response, next: NextFunction)=> {
    try {
        const { orderId, paymentId, signature, plan } = req.body;
        const { type, month } = plan;
        const today = new Date();
        const expiresAt = month ? today.setMonth(today.getMonth() + month) : null;
        let jobPostLimit = plan.jobPostLimit || 0;
        const userId = res.locals.userId as Types.ObjectId
        let subscription: ISubscription | null = null;

        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string);
        shasum.update(`${orderId}|${paymentId}`);
        const digest = shasum.digest('hex');
        
        if (signature !== digest) {
            throw new AppError("Invalid signature sent!",400 )
        }

        subscription = await Subscription.findOne({ userId: userId });

        if (subscription) {
            await Subscription.findOneAndUpdate(
                { userId: userId },
                { orderId:orderId,
                    type,
                    expiresAt,
                    jobPostLimit,
                    plan_id: plan._id, }
            );
        } else {
            subscription = await Subscription.create({
                userId: userId,
                orderId:orderId,
                type,
                expiresAt,
                jobPostLimit,
                plan_id: plan._id,
            });
        }

        return res.status(201).json({
            message: "Package created successfully.",
            data: subscription,
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

const getSubscription = async (req: Request, res: Response, next: NextFunction)=> {
    try {
        const userId = res.locals.userId as Types.ObjectId

        let isRequired = false;
        let message = "";
        const data= await Subscription.findOne( { userId:userId }).populate("plan_id")
        
        if (!data) {
            throw new AppError("Package not found.",400);
        }

        if (data.expiresAt  && data.expiresAt < new Date()) {
            message = "Your Package has expired";
            isRequired = true;
        } else if (!data.isActive) {
            message = "Your Package is deactivated; please renew it";
            isRequired = true;
        }
        return res.status(200).json({
            message,
            isRequired,
            data,
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

const renewSubscription = async (req: Request, res: Response, next: NextFunction)=> {
    try {
        const { type, plan } = req.body;
        const userId = res.locals.userId as Types.ObjectId
        const subscription = await Subscription.findOne({ userId: userId });

        if (!subscription) {
            throw new AppError("Package Not found!",400 )
        }

        subscription.isActive = true;
        subscription.jobPostLimit += plan?.jobPostLimit || 0;
        await subscription.save();

        await Subscription.findOneAndUpdate(
            { user: userId },
            { type, expiresAt: subscription.expiresAt, jobPostLimit: subscription.jobPostLimit }
        );

        await Job.updateMany(
            { created_by: userId, status: "disabled" },
            { $set: { status: "active" } }
        );

        return res.status(200).json({
            message: "Package renewed successfully.",
            data: subscription,
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

const cancelSubscription = async (req: Request, res: Response, next: NextFunction)=> {
    try {
        const userId = res.locals.userId as Types.ObjectId
        const subscription = await Subscription.findOne({ userId: userId });

        if (!subscription) {
            throw new AppError("Package Not found!",400 )
        }

        subscription.isActive = false;
        await subscription.save();

        return res.status(200).json({
            message: "Package cancelled successfully.",
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

export {
    createOrder,verifyPayment,cancelSubscription,
    SubscriptionCreate,
    getSubscription,
    renewSubscription,
};

