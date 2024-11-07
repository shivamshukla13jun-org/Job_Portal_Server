import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import process from 'process';
import crypto from 'crypto';
import User from '@/models/admin/user.model';
import Job from '@/models/portal/job.model';
import { Subscription } from '@/models/portal/subscription.model';
import { IJobportalPlan as Plan ,ISubscription} from '@/types/plan';


// Extend the Express Request to include a userId property

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
            return res.status(400).json({ message: "Invalid signature sent!" });
        }

        subscription = await Subscription.findOne({ user: userId });

        if (subscription) {
            jobPostLimit += subscription.jobPostLimit;
            await Subscription.findOneAndUpdate(
                { user: userId },
                { type, expiresAt, jobPostLimit, plan_id: plan._id }
            );
        } else {
            subscription = await Subscription.create({
                user: userId,
                type,
                expiresAt,
                jobPostLimit,
                plan_id: plan._id,
            });
        }

        return res.status(201).json({
            message: "Subscription created successfully.",
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

        const [isJobportaluser] = await User.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
        ]);

        if (!isJobportaluser) {
            message = "You are not a job portal user";
            isRequired = true;
        }

        const [data] = await Subscription.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
        ]).limit(1);

        if (!data) {
            throw new Error("Subscription not found.");
        }

        if (data.type === 'Free') {
            message = "Your subscription is Free";
        } else if (data.expiresAt < new Date()) {
            message = "Your subscription has expired";
            isRequired = true;
        } else if (!data.isActive) {
            message = "Your subscription is deactivated; please renew it";
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
        const subscription = await Subscription.findOne({ user: userId });

        if (!subscription) {
            return res.status(400).json({
                message: "Subscription not found.",
                success: false,
            });
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
            message: "Subscription renewed successfully.",
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
        const subscription = await Subscription.findOne({ user: userId });

        if (!subscription) {
            return res.status(400).json({
                message: "Subscription not found.",
                success: false,
            });
        }

        subscription.isActive = false;
        await subscription.save();

        return res.status(200).json({
            message: "Subscription cancelled successfully.",
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

export {
    SubscriptionCreate,
    getSubscription,
    renewSubscription,
    cancelSubscription,
};
