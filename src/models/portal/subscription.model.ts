import { ISubscription } from '@/types/plan';
import mongoose, { Document, Model } from 'mongoose';



const subscriptionSchema = new mongoose.Schema<ISubscription>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },
    orderId: {
        type:String,
        required: true,
        unique: true
    },
    plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'plans',
        required: true
    },
    type: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', 'Free'],
        required: true
    },
    jobPostLimit: {
        type: Number,
        default: 0
    },
    jobPostsUsed: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

subscriptionSchema.pre<ISubscription>('save', function (next) {
    next();
});

const Subscription: Model<ISubscription> = mongoose.model<ISubscription>('subscriptions', subscriptionSchema);

export { Subscription };